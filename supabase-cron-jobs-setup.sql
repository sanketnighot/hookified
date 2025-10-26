-- Supabase Cron Jobs Setup
-- Run this in your Supabase SQL Editor

-- 1. Enable required extensions
-- Note: Some Supabase projects may not have the http extension available
-- If you get an error about http schema not existing, use Supabase's built-in HTTP functionality instead
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Check if http extension is available before trying to enable it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
        BEGIN
            CREATE EXTENSION IF NOT EXISTS http;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'http extension not available. pg_cron will work but net.http_post() functions won't be available.';
        END;
    END IF;
END $$;

-- 2. Create exec_sql function for dynamic SQL execution
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    rec RECORD;
    result_array json[] := ARRAY[]::json[];
BEGIN
    -- Only allow service role to execute SQL
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied. Only service role can execute SQL.';
    END IF;

    -- Execute the query and collect results
    FOR rec IN EXECUTE query LOOP
        result_array := array_append(result_array, to_json(rec));
    END LOOP;

    -- Return as JSON array
    result := to_json(result_array);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- 4. Grant permissions for cron operations
GRANT USAGE ON SCHEMA cron TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA cron TO service_role;

-- 5. Grant permissions for pg_net operations (if available)
-- Note: pg_net is Supabase's built-in HTTP extension
DO $$
BEGIN
    -- Try to grant permissions for pg_net schema
    BEGIN
        GRANT USAGE ON SCHEMA net TO service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO service_role;
        RAISE NOTICE 'pg_net permissions granted';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'pg_net schema not available';
    END;

    -- Try to grant permissions for http schema (legacy)
    BEGIN
        GRANT USAGE ON SCHEMA http TO service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA http TO service_role;
        RAISE NOTICE 'http schema permissions granted';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'http schema not available';
    END;
END $$;

-- 6. Verify setup
DO $$
BEGIN
    -- Check if pg_cron is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE '✅ pg_cron extension is enabled';
    ELSE
        RAISE NOTICE '❌ pg_cron extension is NOT enabled';
    END IF;

    -- Check if pg_net extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        RAISE NOTICE '✅ pg_net extension is enabled';
    ELSE
        RAISE NOTICE '❌ pg_net extension is NOT enabled';
    END IF;

    -- Check if http extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
        RAISE NOTICE '✅ http extension is enabled';
    ELSE
        RAISE NOTICE '❌ http extension is NOT enabled';
    END IF;

    -- Check if exec_sql function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'exec_sql') THEN
        RAISE NOTICE '✅ exec_sql function is created';
    ELSE
        RAISE NOTICE '❌ exec_sql function is NOT created';
    END IF;
END $$;
