import { CronJobManager } from '@/services/triggers/CronJobManager';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cronJobManager = new CronJobManager();

    // List all cron jobs
    const cronJobs = await cronJobManager.listAllCronJobs();

    // Check if exec_sql function exists
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Check pg_cron extension
    let pgCronTest = null;
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') as pg_cron_enabled"
      } as any);
      pgCronTest = { success: !error, data, error: error?.message };
    } catch (err) {
      pgCronTest = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    // Check http extension
    let httpTest = null;
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http') as http_enabled"
      } as any);
      httpTest = { success: !error, data, error: error?.message };
    } catch (err) {
      httpTest = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    return NextResponse.json({
      success: true,
      debug: {
        cronJobs,
        execSqlTest,
        pgCronTest,
        httpTest,
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasCronSecret: !!process.env.CRON_SECRET,
        }
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
