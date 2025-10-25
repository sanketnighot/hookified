import { registry } from '@/lib/plugins';
import { prisma } from '@/lib/prisma';
import { CreateHookInput, HookWithRuns, UpdateHookInput } from './types';

export class HookService {
  static async createHook(data: CreateHookInput) {
    // Validate trigger
    const triggerValidation = registry.validateTriggerConfig(
      data.triggerType,
      data.triggerConfig
    );

    if (!triggerValidation.isValid) {
      throw new Error(`Trigger validation failed: ${triggerValidation.errors.join(', ')}`);
    }

    // Validate all actions
    for (let i = 0; i < data.actions.length; i++) {
      const action = data.actions[i];
      const actionValidation = registry.validateActionConfig(
        action.type,
        action.config
      );

      if (!actionValidation.isValid) {
        throw new Error(`Action ${i + 1} validation failed: ${actionValidation.errors.join(', ')}`);
      }
    }

    // Save to database
    return await prisma.hook.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType as any,
        triggerConfig: data.triggerConfig,
        actionConfig: data.actions[0]?.config ? { ...data.actions[0].config, type: data.actions[0].type } : {}, // For backward compatibility
        actions: data.actions as any,
        status: 'ACTIVE' as any,
        isActive: true
      }
    });
  }

  static async getHookById(id: string, userId: string) {
    const hook = await prisma.hook.findUnique({
      where: { id }
    });

    if (!hook) {
      return null;
    }

    // Check ownership
    if (hook.userId !== userId) {
      throw new Error('Unauthorized: You do not have access to this hook');
    }

    return hook;
  }

  static async getHooksByUser(userId: string) {
    return await prisma.hook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateHook(id: string, userId: string, data: UpdateHookInput) {
    // Verify ownership
    const existingHook = await this.getHookById(id, userId);
    if (!existingHook) {
      throw new Error('Hook not found');
    }

    // Validate if trigger config is being updated
    if (data.triggerConfig && data.triggerType) {
      const triggerValidation = registry.validateTriggerConfig(
        data.triggerType,
        data.triggerConfig
      );

      if (!triggerValidation.isValid) {
        throw new Error(`Trigger validation failed: ${triggerValidation.errors.join(', ')}`);
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
          throw new Error(`Action ${i + 1} validation failed: ${actionValidation.errors.join(', ')}`);
        }
      }
    }

    return await prisma.hook.update({
      where: { id },
      data: {
        ...(data as any),
        updatedAt: new Date()
      }
    });
  }

  static async deleteHook(id: string, userId: string) {
    // Verify ownership
    const existingHook = await this.getHookById(id, userId);
    if (!existingHook) {
      throw new Error('Hook not found');
    }

    await prisma.hook.delete({
      where: { id }
    });
  }

  static async toggleHookStatus(id: string, userId: string, isActive: boolean) {
    // Verify ownership
    const existingHook = await this.getHookById(id, userId);
    if (!existingHook) {
      throw new Error('Hook not found');
    }

    return await prisma.hook.update({
      where: { id },
      data: {
        isActive,
        status: isActive ? 'ACTIVE' as any : 'PAUSED' as any,
        updatedAt: new Date()
      }
    });
  }

  static async getHookWithRuns(id: string, userId: string): Promise<HookWithRuns | null> {
    const hook = await this.getHookById(id, userId);
    if (!hook) {
      return null;
    }

    const runs = await prisma.hookRun.findMany({
      where: { hookId: id },
      orderBy: { triggeredAt: 'desc' },
      take: 50
    });

    return {
      ...hook,
      description: hook.description ?? undefined,
      triggerConfig: hook.triggerConfig as any,
      actionConfig: hook.actionConfig as any,
      actions: hook.actions as any,
      runs
    } as HookWithRuns;
  }
}
