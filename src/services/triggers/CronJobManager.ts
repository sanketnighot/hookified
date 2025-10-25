import { getAppConfig, getCronConfig } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';

export interface CronJobStatus {
  exists: boolean;
  active: boolean;
  jobName?: string;
  schedule?: string;
}

export class CronJobManager {
  private cronSecret: string;
  private appUrl: string;
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.cronSecret = getCronConfig().secret;
    this.appUrl = getAppConfig().url;

    // Create Supabase client with service role key for database operations
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Create a Supabase cron job using pg_cron
   */
  async createCronJob(hookId: string, cronExpression: string): Promise<void> {
    const jobName = `hook_${hookId}`;
    const endpoint = `${this.appUrl}/api/cron/execute/${hookId}`;

    try {
      console.log(`Creating Supabase cron job for hook ${hookId} with schedule: ${cronExpression}`);

      // Create the cron job using pg_cron
      const { data, error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT cron.schedule(
            '${jobName}',
            '${cronExpression}',
            $$
              SELECT net.http_post(
                url := '${endpoint}',
                headers := '{"Content-Type": "application/json", "x-cron-secret": "${this.cronSecret}"}'::jsonb,
                body := '{}'::jsonb
              ) as request_id;
            $$
          );
        `
      } as any);

      if (error) {
        console.error('Supabase RPC error:', error);
        throw new Error(`Failed to create cron job: ${error.message}`);
      }

      console.log('Cron job creation response:', data);

      console.log(`Successfully created Supabase cron job: ${jobName}`);
    } catch (error) {
      console.error(`Failed to create cron job for hook ${hookId}:`, error);
      throw new Error(`Failed to create cron job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pause a Supabase cron job
   */
  async pauseCronJob(hookId: string): Promise<void> {
    const jobName = `hook_${hookId}`;

    try {
      console.log(`Pausing Supabase cron job for hook ${hookId}`);

      const { error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT cron.alter_job(
            job_id := (SELECT jobid FROM cron.job WHERE jobname = '${jobName}'),
            active := false
          );
        `
      } as any);

      if (error) {
        throw new Error(`Failed to pause cron job: ${error.message}`);
      }

      console.log(`Successfully paused Supabase cron job: ${jobName}`);
    } catch (error) {
      console.error(`Failed to pause cron job for hook ${hookId}:`, error);
      throw new Error(`Failed to pause cron job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resume a Supabase cron job
   */
  async resumeCronJob(hookId: string): Promise<void> {
    const jobName = `hook_${hookId}`;

    try {
      console.log(`Resuming Supabase cron job for hook ${hookId}`);

      const { error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT cron.alter_job(
            job_id := (SELECT jobid FROM cron.job WHERE jobname = '${jobName}'),
            active := true
          );
        `
      } as any);

      if (error) {
        throw new Error(`Failed to resume cron job: ${error.message}`);
      }

      console.log(`Successfully resumed Supabase cron job: ${jobName}`);
    } catch (error) {
      console.error(`Failed to resume cron job for hook ${hookId}:`, error);
      throw new Error(`Failed to resume cron job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a Supabase cron job
   */
  async deleteCronJob(hookId: string): Promise<void> {
    const jobName = `hook_${hookId}`;

    try {
      console.log(`Deleting Supabase cron job for hook ${hookId}`);

      const { error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT cron.unschedule('${jobName}');
        `
      } as any);

      if (error) {
        throw new Error(`Failed to delete cron job: ${error.message}`);
      }

      console.log(`Successfully deleted Supabase cron job: ${jobName}`);
    } catch (error) {
      console.error(`Failed to delete cron job for hook ${hookId}:`, error);
      throw new Error(`Failed to delete cron job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a Supabase cron job's schedule
   */
  async updateCronJobSchedule(hookId: string, cronExpression: string): Promise<void> {
    const jobName = `hook_${hookId}`;

    try {
      console.log(`Updating Supabase cron job schedule for hook ${hookId} to: ${cronExpression}`);

      const { error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT cron.alter_job(
            job_id := (SELECT jobid FROM cron.job WHERE jobname = '${jobName}'),
            schedule := '${cronExpression}'
          );
        `
      } as any);

      if (error) {
        throw new Error(`Failed to update cron job schedule: ${error.message}`);
      }

      console.log(`Successfully updated Supabase cron job schedule: ${jobName}`);
    } catch (error) {
      console.error(`Failed to update cron job schedule for hook ${hookId}:`, error);
      throw new Error(`Failed to update cron job schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the status of a Supabase cron job
   */
  async getCronJobStatus(hookId: string): Promise<CronJobStatus> {
    const jobName = `hook_${hookId}`;

    try {
      const { data, error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT jobname, schedule, active
          FROM cron.job
          WHERE jobname = '${jobName}';
        `
      } as any);

      if (error || !data) {
        return { exists: false, active: false };
      }

      const jobData = data as any[];
      if (!Array.isArray(jobData) || jobData.length === 0) {
        return { exists: false, active: false };
      }

      const job = jobData[0];
      return {
        exists: true,
        active: job.active,
        jobName: job.jobname,
        schedule: job.schedule,
      };
    } catch (error) {
      console.error(`Failed to get cron job status for hook ${hookId}:`, error);
      return { exists: false, active: false };
    }
  }

  /**
   * List all Supabase cron jobs for debugging
   */
  async listAllCronJobs(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.rpc('exec_sql', {
        query: `
          SELECT jobid, jobname, schedule, active, created_at
          FROM cron.job
          WHERE jobname LIKE 'hook_%'
          ORDER BY created_at DESC;
        `
      } as any);

      if (error) {
        console.error('Failed to list cron jobs:', error);
        return [];
      }

      return (data as any[]) || [];
    } catch (error) {
      console.error('Failed to list cron jobs:', error);
      return [];
    }
  }
}
