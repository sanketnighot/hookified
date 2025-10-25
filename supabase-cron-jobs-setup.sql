-- Supabase Cron Jobs Setup
-- Run this in your Supabase SQL Editor

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Create exec_sql function for dynamic SQL execution
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Only allow service role to execute SQL
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied. Only service role can execute SQL.';
    END IF;

    -- Execute the query and return result
    EXECUTE query INTO result;
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

-- 5. Grant permissions for http operations
GRANT USAGE ON SCHEMA http TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA http TO service_role;

-- 6. Verify setup
DO $$
BEGIN
    -- Check if pg_cron is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE '✅ pg_cron extension is enabled';
    ELSE
        RAISE NOTICE '❌ pg_cron extension is NOT enabled';
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
