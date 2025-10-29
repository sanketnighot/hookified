import { prisma } from '@/lib/prisma';
import { Hook } from '@/lib/types';
import { ChainExecutor } from './actions/ChainExecutor';
import { ContractCallExecutor } from './actions/ContractCallExecutor';
import { TelegramExecutor } from './actions/TelegramExecutor';
import { WebhookExecutor } from './actions/WebhookExecutor';
import {
    ExecutionContext,
    ExecutionMeta,
    HookExecutionResult,
    TriggerContext
} from './types';
import { VariableContextBuilder } from "./VariableContextBuilder";

export class HookExecutor {
  private actionExecutors = new Map<string, any>([
    ['TELEGRAM', new TelegramExecutor()],
    ['WEBHOOK', new WebhookExecutor()],
    ['CHAIN', new ChainExecutor()],
    ['CONTRACT_CALL', new ContractCallExecutor()],
  ]);

  async executeHook(
    hook: Hook,
    triggerContext?: TriggerContext
  ): Promise<HookExecutionResult> {
    const startTime = Date.now();
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create HookRun record with PENDING status
    const hookRun = await prisma.hookRun.create({
      data: {
        id: runId,
        hookId: hook.id,
        status: 'PENDING',
        triggeredAt: new Date(),
        meta: {
          triggerContext: triggerContext?.data,
          actions: [],
          totalDuration: 0,
        },
      },
    });

    try {
      // Validate hook is active
      if (!hook.isActive || hook.status !== "ACTIVE") {
        throw new Error("Hook is not active");
      }

      // Validate actions exist
      if (!hook.actions || hook.actions.length === 0) {
        throw new Error("Hook has no actions configured");
      }

      // Initialize variable context builder with trigger data
      const variableBuilder = new VariableContextBuilder(triggerContext?.data);

      // Execute actions sequentially
      const actionResults = [];
      let failedAt: number | undefined;

      for (let i = 0; i < hook.actions.length; i++) {
        const action = hook.actions[i];
        const executor = this.actionExecutors.get(action.type);

        if (!executor) {
          throw new Error(`Unknown action type: ${action.type}`);
        }

        try {
          // Create execution context with current variable state
          const context: ExecutionContext = {
            hookId: hook.id,
            userId: hook.userId,
            triggerContext: triggerContext?.data,
            runId,
            variables: variableBuilder.getContext(),
          };

          const result = await executor.execute(action.config, context);
          actionResults.push(result);

          // Add result to variable context for next actions (even if failed)
          variableBuilder.addActionResult(
            i,
            action.id || `action-${i}`,
            action.type,
            result
          );

          // If this action failed, stop execution
          if (result.status === "FAILED") {
            failedAt = i;
            break;
          }
        } catch (error) {
          // Create a failed result for this action
          const failedResult = {
            actionId: action.id || `action-${i}`,
            actionType: action.type,
            status: "FAILED" as const,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            duration: 0,
            error: error instanceof Error ? error.message : "Unknown error",
            result: undefined,
          };
          actionResults.push(failedResult);

          // Add failed result to variable context
          variableBuilder.addActionResult(
            i,
            action.id || `action-${i}`,
            action.type,
            failedResult
          );

          failedAt = i;
          break;
        }
      }

      const totalDuration = Date.now() - startTime;
      const overallStatus = failedAt !== undefined ? "FAILED" : "SUCCESS";

      // Prepare execution meta
      const meta: ExecutionMeta = {
        triggerContext: triggerContext?.data,
        actions: actionResults,
        totalDuration,
        failedAt,
      };

      // Update HookRun with results
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: overallStatus,
          completedAt: new Date(),
          meta: meta as any,
          error:
            failedAt !== undefined
              ? `Action ${failedAt + 1} failed`
              : undefined,
        },
      });

      // Update hook's lastExecutedAt
      await prisma.hook.update({
        where: { id: hook.id },
        data: {
          lastExecutedAt: new Date(),
        },
      });

      return {
        runId,
        status: overallStatus,
        totalDuration,
        actions: actionResults,
        failedAt,
        error:
          failedAt !== undefined ? `Action ${failedAt + 1} failed` : undefined,
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update HookRun with error
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: errorMessage,
          meta: {
            triggerContext: triggerContext?.data,
            actions: [],
            totalDuration,
            error: errorMessage,
          } as any,
        },
      });

      return {
        runId,
        status: 'FAILED',
        totalDuration,
        actions: [],
        error: errorMessage,
      };
    }
  }

  async executeHookById(
    hookId: string,
    userId: string,
    triggerContext?: TriggerContext
  ): Promise<HookExecutionResult> {
    // Fetch hook from database
    const hook = await prisma.hook.findUnique({
      where: { id: hookId },
    });

    if (!hook) {
      throw new Error('Hook not found');
    }

    // Verify ownership
    if (hook.userId !== userId) {
      throw new Error('Unauthorized: You do not have access to this hook');
    }

    return this.executeHook(hook as any, triggerContext);
  }
}
