import { registry } from '@/lib/plugins';
import { prisma } from '@/lib/prisma';
import { CronJobManager } from "@/services/triggers/CronJobManager";
import { OnchainEngine } from "@/services/triggers/OnchainEngine";
import crypto from "crypto";
import { CreateHookInput, HookWithRuns, UpdateHookInput } from "./types";

export class HookService {
  private static cronJobManager = new CronJobManager();

  static async createHook(data: CreateHookInput) {
    // Generate webhook secret for WEBHOOK triggers
    let finalTriggerConfig = data.triggerConfig;
    if (data.triggerType === "WEBHOOK") {
      const webhookSecret = crypto.randomBytes(32).toString("hex");
      finalTriggerConfig = {
        ...data.triggerConfig,
        secret: webhookSecret,
      };
    }

    // Validate trigger
    const triggerValidation = registry.validateTriggerConfig(
      data.triggerType,
      finalTriggerConfig
    );

    if (!triggerValidation.isValid) {
      throw new Error(
        `Trigger validation failed: ${triggerValidation.errors.join(", ")}`
      );
    }

    // Validate all actions
    for (let i = 0; i < data.actions.length; i++) {
      const action = data.actions[i];
      const actionValidation = registry.validateActionConfig(
        action.type,
        action.config
      );

      if (!actionValidation.isValid) {
        throw new Error(
          `Action ${i + 1} validation failed: ${actionValidation.errors.join(
            ", "
          )}`
        );
      }
    }

    // Save to database
    const hook = await prisma.hook.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType as any,
        triggerConfig: finalTriggerConfig,
        actionConfig: data.actions[0]?.config
          ? { ...data.actions[0].config, type: data.actions[0].type }
          : {}, // For backward compatibility
        actions: data.actions as any,
        status: "ACTIVE" as any,
        isActive: true,
      },
    });

    // Register webhook for ONCHAIN triggers
    if (data.triggerType === "ONCHAIN") {
      try {
        const onchainEngine = new OnchainEngine();
        await onchainEngine.registerWebhook(hook);
      } catch (error) {
        console.error(
          `Failed to register ONCHAIN webhook for hook ${hook.id}:`,
          error
        );
        // Don't fail the hook creation, just log the error
      }
    }

    // Create cron job for CRON triggers
    if (data.triggerType === "CRON") {
      const triggerConfig = data.triggerConfig as any;
      const cronExpression = triggerConfig?.cronExpression;

      if (!cronExpression) {
        throw new Error(
          "CRON trigger requires a cronExpression in triggerConfig"
        );
      }

      try {
        // Attempt to create the cron job in Supabase
        await this.cronJobManager.createCronJob(hook.id, cronExpression);
      } catch (error) {
        // If cron job creation fails, we need to delete the hook that was just created
        // to maintain data consistency
        await prisma.hook.delete({ where: { id: hook.id } });

        // Re-throw with a user-friendly error message
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        throw new Error(`Cannot create CRON hook: ${errorMessage}`);
      }
    }

    // Return hook with webhook details if applicable
    if (data.triggerType === "WEBHOOK") {
      return {
        ...hook,
        webhookSecret: finalTriggerConfig.secret,
      };
    }

    return hook;
  }

  static async getHookById(id: string, userId: string) {
    const hook = await prisma.hook.findUnique({
      where: { id },
    });

    if (!hook) {
      return null;
    }

    // Check ownership
    if (hook.userId !== userId) {
      throw new Error("Unauthorized: You do not have access to this hook");
    }

    return hook;
  }

  static async getHooksByUser(userId: string) {
    return await prisma.hook.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateHook(id: string, userId: string, data: UpdateHookInput) {
    // Verify ownership
    const existingHook = await this.getHookById(id, userId);
    if (!existingHook) {
      throw new Error("Hook not found");
    }

    // Validate if trigger config is being updated
    if (data.triggerConfig && data.triggerType) {
      const triggerValidation = registry.validateTriggerConfig(
        data.triggerType,
        data.triggerConfig
      );

      if (!triggerValidation.isValid) {
        throw new Error(
          `Trigger validation failed: ${triggerValidation.errors.join(", ")}`
        );
      }
    }

    // Validate actions if being updated
    if (data.actions) {
      for (let i = 0; i < data.actions.length; i++) {
        const action = data.actions[i];
        const actionValidation = registry.validateActionConfig(
          action.type,
          action.config
        );

        if (!actionValidation.isValid) {
          throw new Error(
            `Action ${i + 1} validation failed: ${actionValidation.errors.join(
              ", "
            )}`
          );
        }
      }
    }

    const updatedHook = await prisma.hook.update({
      where: { id },
      data: {
        ...(data as any),
        updatedAt: new Date(),
      },
    });

    // Update cron job if trigger config changed
    if (data.triggerConfig && existingHook.triggerType === "CRON") {
      try {
        const triggerConfig = data.triggerConfig as any;
        const cronExpression = triggerConfig?.cronExpression;

        if (cronExpression) {
          await this.cronJobManager.updateCronJobSchedule(id, cronExpression);
        }
      } catch (error) {
        console.error(
          `Failed to update cron job schedule for hook ${id}:`,
          error
        );
        // Don't fail the update, just log the error
      }
    }

    return updatedHook;
  }

  static async deleteHook(id: string, userId: string) {
    // Verify ownership
    const existingHook = await this.getHookById(id, userId);
    if (!existingHook) {
      throw new Error("Hook not found");
    }

    // Unregister webhook for ONCHAIN triggers
    if (
      existingHook.triggerType === "ONCHAIN" &&
      existingHook.alchemyWebhookId
    ) {
      try {
        const onchainEngine = new OnchainEngine();
        await onchainEngine.unregisterWebhook(existingHook);
      } catch (error) {
        console.error(
          `Failed to unregister ONCHAIN webhook for hook ${id}:`,
          error
        );
        // Don't fail the deletion, just log the error
      }
    }

    // Delete cron job for CRON triggers
    if (existingHook.triggerType === "CRON") {
      try {
        await this.cronJobManager.deleteCronJob(id);
      } catch (error) {
        console.error(`Failed to delete cron job for hook ${id}:`, error);
        // Don't fail the deletion, just log the error
      }
    }

    await prisma.hook.delete({
      where: { id },
    });
  }

  static async toggleHookStatus(id: string, userId: string, isActive: boolean) {
    // Verify ownership
    const existingHook = await this.getHookById(id, userId);
    if (!existingHook) {
      throw new Error("Hook not found");
    }

    const updatedHook = await prisma.hook.update({
      where: { id },
      data: {
        isActive,
        status: isActive ? ("ACTIVE" as any) : ("PAUSED" as any),
        updatedAt: new Date(),
      },
    });

    // Update cron job status for CRON triggers
    if (existingHook.triggerType === "CRON") {
      try {
        if (isActive) {
          await this.cronJobManager.resumeCronJob(id);
        } else {
          await this.cronJobManager.pauseCronJob(id);
        }
      } catch (error) {
        console.error(
          `Failed to ${isActive ? "resume" : "pause"} cron job for hook ${id}:`,
          error
        );
        // Don't fail the toggle, just log the error
      }
    }

    return updatedHook;
  }

  static async getHookWithRuns(
    id: string,
    userId: string
  ): Promise<HookWithRuns | null> {
    const hook = await this.getHookById(id, userId);
    if (!hook) {
      return null;
    }

    const runs = await prisma.hookRun.findMany({
      where: { hookId: id },
      orderBy: { triggeredAt: "desc" },
      take: 50,
    });

    return {
      ...hook,
      description: hook.description ?? undefined,
      triggerConfig: hook.triggerConfig as any,
      actionConfig: hook.actionConfig as any,
      actions: hook.actions as any,
      runs,
    } as HookWithRuns;
  }
}
