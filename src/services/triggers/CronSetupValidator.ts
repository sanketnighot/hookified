import { createClient } from '@supabase/supabase-js';

export interface CronSetupStatus {
  isSetup: boolean;
  isValid: boolean;
  issues: string[];
  details: {
    environmentVariables: {
      cronSecret: boolean;
      supabaseUrl: boolean;
      serviceRoleKey: boolean;
    };
    databaseExtensions: {
      pgCron: boolean;
      http: boolean;
    };
    functions: {
      execSql: boolean;
    };
    permissions: boolean;
  };
  instructions: string[];
}

export class CronSetupValidator {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Validate the complete CRON setup and return detailed status
   */
  async validateSetup(): Promise<CronSetupStatus> {
    const status: CronSetupStatus = {
      isSetup: false,
      isValid: false,
      issues: [],
      details: {
        environmentVariables: {
          cronSecret: !!process.env.CRON_SECRET,
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        databaseExtensions: {
          pgCron: false,
          http: false,
        },
        functions: {
          execSql: false,
        },
        permissions: false,
      },
      instructions: [],
    };

    // Check environment variables
    if (!status.details.environmentVariables.cronSecret) {
      status.issues.push('CRON_SECRET environment variable is not set');
      status.instructions.push('Set CRON_SECRET environment variable in your .env file');
    }
    if (!status.details.environmentVariables.supabaseUrl) {
      status.issues.push('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
      status.instructions.push('Set NEXT_PUBLIC_SUPABASE_URL environment variable');
    }
    if (!status.details.environmentVariables.serviceRoleKey) {
      status.issues.push('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
      status.instructions.push('Set SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    // Try to check database extensions and functions
    try {
      // Check if exec_sql function exists
      const { data: execSqlCheck, error: execSqlError } = await this.supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'exec_sql')
        .limit(1);

      if (execSqlCheck && execSqlCheck.length > 0) {
        status.details.functions.execSql = true;
      } else {
        status.issues.push('exec_sql function not found in database');
        status.instructions.push('Run the SQL in supabase-cron-jobs-setup.sql to create the exec_sql function');
      }
    } catch (error) {
      // Try direct query instead
      try {
        const { data, error } = await this.supabase.rpc('exec_sql', {
          query: "SELECT proname FROM pg_proc WHERE proname = 'exec_sql' LIMIT 1"
        } as any);

        if (data && !error) {
          status.details.functions.execSql = true;
        } else {
          status.issues.push('Cannot verify exec_sql function - setup may be incomplete');
          status.instructions.push('Run the SQL in supabase-cron-jobs-setup.sql in your Supabase SQL Editor');
        }
      } catch {
        status.issues.push('exec_sql function not accessible');
        status.instructions.push('Run the SQL in supabase-cron-jobs-setup.sql to create the exec_sql function');
      }
    }

    // Check if we can use exec_sql to check extensions
    if (status.details.functions.execSql) {
      try {
        // Check pg_cron extension
        const { data: pgCronCheck, error: pgCronError } = await this.supabase.rpc('exec_sql', {
          query: "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') as pg_cron_enabled"
        } as any);

        if (!pgCronError && pgCronCheck) {
          status.details.databaseExtensions.pgCron = true;
        } else {
          status.issues.push('pg_cron extension is not enabled');
          status.instructions.push('Enable pg_cron extension in your Supabase dashboard');
        }
      } catch (error) {
        status.issues.push('Cannot check pg_cron extension status');
      }

      try {
        // Check http extension
        const { data: httpCheck, error: httpError } = await this.supabase.rpc('exec_sql', {
          query: "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http') as http_enabled"
        } as any);

        if (!httpError && httpCheck) {
          status.details.databaseExtensions.http = true;
        } else {
          status.issues.push('http extension is not enabled');
          status.instructions.push('Enable http extension in your Supabase dashboard');
        }
      } catch (error) {
        status.issues.push('Cannot check http extension status');
      }

      // Test if we can actually create a cron job (quick test)
      try {
        const testJobName = `test_setup_${Date.now()}`;
        const { error: testError } = await this.supabase.rpc('exec_sql', {
          query: `SELECT cron.schedule('${testJobName}', '* * * * *', 'SELECT NOW()');`
        } as any);

        if (!testError) {
          status.details.permissions = true;
          // Clean up test job
          try {
            await this.supabase.rpc('exec_sql', {
              query: `SELECT cron.unschedule('${testJobName}');`
            } as any);
          } catch {
            // Ignore cleanup errors
          }
        }
      } catch (error) {
        status.issues.push('Cannot create test cron job - permissions may be insufficient');
        status.instructions.push('Check that service role has permissions to use pg_cron');
      }
    }

    // Determine overall status
    status.isValid =
      status.details.environmentVariables.cronSecret &&
      status.details.environmentVariables.supabaseUrl &&
      status.details.environmentVariables.serviceRoleKey &&
      status.details.functions.execSql &&
      status.details.databaseExtensions.pgCron &&
      status.details.databaseExtensions.http &&
      status.details.permissions &&
      status.issues.length === 0;

    status.isSetup = status.isValid;

    if (!status.isValid && status.instructions.length === 0) {
      status.instructions.push('Run the SQL in supabase-cron-jobs-setup.sql in your Supabase SQL Editor');
    }

    return status;
  }

  /**
   * Quick check if CRON setup is available
   */
  async isSetupAvailable(): Promise<boolean> {
    const status = await this.validateSetup();
    return status.isValid;
  }

  /**
   * Get a user-friendly error message for the current setup issues
   */
  getErrorMessage(): string {
    return 'CRON scheduling is not available. Please contact your administrator to set up pg_cron in Supabase.';
  }
}
