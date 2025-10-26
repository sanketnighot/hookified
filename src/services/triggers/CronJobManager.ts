import { getCronConfig } from "@/lib/config";
import { createClient } from "@supabase/supabase-js";

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
    this.appUrl = getCronConfig().url;

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
      // First, check if job already exists
      const existingStatus = await this.getCronJobStatus(hookId);
      if (existingStatus.exists) {
        console.log(
          `Cron job '${jobName}' already exists, updating schedule...`
        );
        await this.updateCronJobSchedule(hookId, cronExpression);
        return;
      }

      // Create the cron job using pg_cron
      // cron.schedule returns a bigint jobid, we need to wrap it properly
      const { data, error } = await this.supabase.rpc("exec_sql", {
        query: `
          SELECT json_build_object('jobid', cron.schedule(
            '${jobName}',
            '${cronExpression}',
            $$
              SELECT net.http_post(
                url := '${endpoint}',
                headers := jsonb_build_object(
                  'Content-Type', 'application/json',
                  'x-cron-secret', '${this.cronSecret}'
                ),
                body := jsonb_build_object('cronSecret', '${this.cronSecret}')
              ) as request_id;
            $$
          ));
        `,
      } as any);

      if (error) {
        console.error("Supabase RPC error:", error);
        console.error("Full error details:", JSON.stringify(error, null, 2));
        throw this.createDetailedError(error);
      }

      // Log the result
      console.log("Cron job creation response:", { data: data as any, error });

      // Type assertion for data
      const responseData = data as any;

      // Verify the job was created by checking the cron.job table
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second for consistency
      const status = await this.getCronJobStatus(hookId);

      if (!status.exists) {
        console.error("Verification failed: Job not found in cron.job table");
        console.error("Response data:", responseData);
        throw new Error(
          "CRON job was not created successfully. The job ID was returned but the job is not found in cron.job table."
        );
      }

      // Extract job ID from response
      let jobId: string | null = null;
      if (
        responseData &&
        Array.isArray(responseData) &&
        responseData.length > 0
      ) {
        const firstItem = responseData[0];
        jobId = firstItem?.jobid?.toString() || null;
      }

      console.log(
        `✅ Created cron job '${jobName}' with schedule '${cronExpression}'${
          jobId ? ` (Job ID: ${jobId})` : ""
        }`
      );
    } catch (error) {
      console.error(`Failed to create cron job for hook ${hookId}:`, error);

      // Re-throw with enhanced error details
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check for specific setup issues
      if (
        errorMessage.includes("exec_sql") ||
        errorMessage.includes("function")
      ) {
        throw new Error(
          "CRON scheduling unavailable: exec_sql function not found. Please run the setup script: supabase-cron-jobs-setup.sql"
        );
      }

      if (
        errorMessage.includes("pg_cron") ||
        errorMessage.includes("extension")
      ) {
        throw new Error(
          "CRON scheduling unavailable: pg_cron extension not enabled. Enable it in your Supabase dashboard."
        );
      }

      if (errorMessage.includes("http")) {
        throw new Error(
          "CRON scheduling unavailable: http extension not enabled. Enable it in your Supabase dashboard."
        );
      }

      throw new Error(`Failed to create cron job: ${errorMessage}`);
    }
  }

  /**
   * Create detailed error from Supabase RPC error
   */
  private createDetailedError(error: any): Error {
    const message = error?.message || "Unknown error";

    // Common error patterns
    if (message.includes("permission denied")) {
      return new Error("CRON scheduling unavailable: insufficient permissions");
    }

    if (message.includes("does not exist")) {
      if (message.includes("exec_sql")) {
        return new Error(
          "CRON scheduling unavailable: exec_sql function not found"
        );
      }
      if (message.includes("cron.")) {
        return new Error(
          "CRON scheduling unavailable: pg_cron extension not enabled"
        );
      }
    }

    return new Error(`CRON scheduling unavailable: ${message}`);
  }

  /**
   * Pause a Supabase cron job
   */
  async pauseCronJob(hookId: string): Promise<void> {
    const jobName = `hook_${hookId}`;

    try {
      const { error } = await this.supabase.rpc("exec_sql", {
        query: `
          SELECT cron.alter_job(
            job_id := (SELECT jobid FROM cron.job WHERE jobname = '${jobName}'),
            active := false
          );
        `,
      } as any);

      if (error) {
        throw new Error(`Failed to pause cron job: ${error.message}`);
      }
    } catch (error) {
      console.error(`Failed to pause cron job for hook ${hookId}:`, error);
      throw new Error(
        `Failed to pause cron job: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Resume a Supabase cron job
   */
  async resumeCronJob(hookId: string): Promise<void> {
    const jobName = `hook_${hookId}`;

    try {
      const { error } = await this.supabase.rpc("exec_sql", {
        query: `
          SELECT cron.alter_job(
            job_id := (SELECT jobid FROM cron.job WHERE jobname = '${jobName}'),
            active := true
          );
        `,
      } as any);

      if (error) {
        throw new Error(`Failed to resume cron job: ${error.message}`);
      }
    } catch (error) {
      console.error(`Failed to resume cron job for hook ${hookId}:`, error);
      throw new Error(
        `Failed to resume cron job: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete a Supabase cron job
   */
  async deleteCronJob(hookId: string): Promise<void> {
    const jobName = `hook_${hookId}`;

    try {
      const { error } = await this.supabase.rpc("exec_sql", {
        query: `
          SELECT cron.unschedule('${jobName}');
        `,
      } as any);

      if (error) {
        throw new Error(`Failed to delete cron job: ${error.message}`);
      }
    } catch (error) {
      console.error(`Failed to delete cron job for hook ${hookId}:`, error);
      throw new Error(
        `Failed to delete cron job: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update a Supabase cron job's schedule
   */
  async updateCronJobSchedule(
    hookId: string,
    cronExpression: string
  ): Promise<void> {
    const jobName = `hook_${hookId}`;

    try {
      const { error } = await this.supabase.rpc("exec_sql", {
        query: `
          SELECT cron.alter_job(
            job_id := (SELECT jobid FROM cron.job WHERE jobname = '${jobName}'),
            schedule := '${cronExpression}'
          );
        `,
      } as any);

      if (error) {
        throw new Error(`Failed to update cron job schedule: ${error.message}`);
      }
    } catch (error) {
      console.error(
        `Failed to update cron job schedule for hook ${hookId}:`,
        error
      );
      throw new Error(
        `Failed to update cron job schedule: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get the status of a Supabase cron job
   */
  async getCronJobStatus(hookId: string): Promise<CronJobStatus> {
    const jobName = `hook_${hookId}`;

    try {
      const { data, error } = await this.supabase.rpc("exec_sql", {
        query: `
          SELECT jobname, schedule, active
          FROM cron.job
          WHERE jobname = '${jobName}';
        `,
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
      const { data, error } = await this.supabase.rpc("exec_sql", {
        query: `
          SELECT jobid, jobname, schedule, active, created_at
          FROM cron.job
          WHERE jobname LIKE 'hook_%'
          ORDER BY created_at DESC;
        `,
      } as any);

      if (error) {
        console.error("Failed to list cron jobs:", error);
        return [];
      }

      return (data as any[]) || [];
    } catch (error) {
      console.error("Failed to list cron jobs:", error);
      return [];
    }
  }
}
