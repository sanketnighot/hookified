import { prisma } from '@/lib/prisma';
import { HookExecutor } from '@/services/execution/HookExecutor';
import { TriggerContext } from '@/services/execution/types';
import CronExpressionParser from 'cron-parser';

/**
 * CronEngine - Backup/fallback mechanism for cron execution
 *
 * This engine is now primarily used for:
 * - Manual testing and debugging
 * - Migration purposes
 * - Fallback execution if pg_cron jobs fail
 *
 * The main cron execution now happens via individual pg_cron jobs
 * that call /api/cron/execute/[hookId] endpoints.
 */
export class CronEngine {
  private executor = new HookExecutor();

  async checkAndExecuteCronHooks(): Promise<void> {
    try {
      console.log('Checking CRON hooks...');

      // Fetch all active hooks with CRON trigger type
      const cronHooks = await prisma.hook.findMany({
        where: {
          triggerType: 'CRON',
          isActive: true,
          status: 'ACTIVE',
        },
      });

      console.log(`Found ${cronHooks.length} active CRON hooks`);

      for (const hook of cronHooks) {
        try {
          await this.checkAndExecuteHook(hook);
        } catch (error) {
          console.error(`Error checking CRON hook ${hook.id}:`, error);
        }
      }

      console.log('CRON check completed');
    } catch (error) {
      console.error('CRON engine error:', error);
    }
  }

  private async checkAndExecuteHook(hook: any): Promise<void> {
    const triggerConfig = hook.triggerConfig as any;
    const cronExpression = triggerConfig?.cronExpression;
    const timezone = triggerConfig?.timezone || 'UTC';

    if (!cronExpression) {
      console.warn(`Hook ${hook.id} has no cron expression`);
      return;
    }

    try {
      // Parse the cron expression
      const interval = CronExpressionParser.parse(cronExpression, {
        tz: timezone,
      });

      // Get the last execution time
      const lastExecutedAt = hook.lastExecutedAt;
      const lastCheckedAt = hook.lastCheckedAt || hook.createdAt;
      const now = new Date();

      // Check if it's time to execute
      let shouldExecute = false;

      if (!lastExecutedAt) {
        // First execution - check if current time matches cron
        const nextExecution = interval.next();
        shouldExecute = now >= nextExecution.toDate();
      } else {
        // Check if enough time has passed since last execution
        // Create a new interval with the last execution time as current date
        const intervalFromLastExecution = CronExpressionParser.parse(cronExpression, {
          tz: timezone,
          currentDate: lastExecutedAt,
        });
        const nextExecution = intervalFromLastExecution.next();
        shouldExecute = now >= nextExecution.toDate();
      }

      if (shouldExecute) {
        console.log(`Executing CRON hook: ${hook.name} (${hook.id})`);

        // Create trigger context
        const triggerContext: TriggerContext = {
          type: 'CRON',
          data: {
            cronExpression,
            timezone,
            scheduledAt: now.toISOString(),
            lastExecutedAt: lastExecutedAt?.toISOString(),
          },
          timestamp: now.toISOString(),
        };

        // Execute the hook
        await this.executor.executeHook(hook, triggerContext);

        // Update lastCheckedAt
        await prisma.hook.update({
          where: { id: hook.id },
          data: { lastCheckedAt: now },
        });

        console.log(`CRON hook ${hook.id} executed successfully`);
      }
    } catch (error) {
      console.error(`Error parsing cron expression for hook ${hook.id}:`, error);

      // Mark hook as error status
      await prisma.hook.update({
        where: { id: hook.id },
        data: {
          status: 'ERROR',
          lastCheckedAt: new Date(),
        },
      });
    }
  }

  // Method to validate cron expression
  static validateCronExpression(cronExpression: string): boolean {
    try {
      CronExpressionParser.parse(cronExpression);
      return true;
    } catch {
      return false;
    }
  }

  // Method to get next execution time for a cron expression
  static getNextExecutionTime(cronExpression: string, timezone: string = 'UTC'): Date | null {
    try {
      const interval = CronExpressionParser.parse(cronExpression, { tz: timezone });
      return interval.next().toDate();
    } catch {
      return null;
    }
  }
}
