import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasSupabaseUrl || !hasServiceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        env: {
          hasSupabaseUrl,
          hasServiceRoleKey,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
        }
      });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test basic connection
    let connectionTest = null;
    try {
      const { data, error } = await supabase.from('hooks').select('count').limit(1);
      connectionTest = { success: !error, error: error?.message };
    } catch (err) {
      connectionTest = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    // Test exec_sql function
    let execSqlTest = null;
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: "SELECT 'test' as result"
      } as any);
      execSqlTest = { success: !error, data, error: error?.message };
    } catch (err) {
      execSqlTest = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    // Test pg_cron extension
    let pgCronTest = null;
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') as pg_cron_enabled"
      } as any);
      pgCronTest = { success: !error, data, error: error?.message };
    } catch (err) {
      pgCronTest = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    // Test http extension
    let httpTest = null;
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http') as http_enabled"
      } as any);
      httpTest = { success: !error, data, error: error?.message };
    } catch (err) {
      httpTest = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    // List existing cron jobs
    let cronJobsTest = null;
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: "SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname LIKE 'hook_%'"
      } as any);
      cronJobsTest = { success: !error, data, error: error?.message };
    } catch (err) {
      cronJobsTest = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    return NextResponse.json({
      success: true,
      tests: {
        connectionTest,
        execSqlTest,
        pgCronTest,
        httpTest,
        cronJobsTest
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
