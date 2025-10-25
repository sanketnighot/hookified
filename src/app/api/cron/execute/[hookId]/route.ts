import { getCronConfig } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { HookExecutor } from '@/services/execution/HookExecutor';
import { TriggerContext } from '@/services/execution/types';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    hookId: string;
  }>;
}

// POST /api/cron/execute/[hookId] - Execute a specific hook via cron
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { hookId } = await params;

  try {
    // 1. Verify CRON_SECRET
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = getCronConfig().secret;

    if (!cronSecret || cronSecret !== expectedSecret) {
      console.error(`Invalid cron secret for hook ${hookId}`);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron secret' },
        { status: 401 }
      );
    }

    // 2. Verify Supabase service role authentication (optional additional security)
    const authHeader = req.headers.get('authorization');
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      console.error(`Invalid authorization header for hook ${hookId}`);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid authorization header' },
        { status: 401 }
      );
    }

    // 3. Fetch and validate the hook
    const hook = await prisma.hook.findUnique({
      where: { id: hookId },
    });

    if (!hook) {
      console.error(`Hook ${hookId} not found`);
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    // 4. Check if hook is active and has CRON trigger type
    if (!hook.isActive || hook.status !== 'ACTIVE') {
      console.log(`Hook ${hookId} is not active (isActive: ${hook.isActive}, status: ${hook.status})`);
      return NextResponse.json(
        { error: 'Hook is not active' },
        { status: 400 }
      );
    }

    if (hook.triggerType !== 'CRON') {
      console.error(`Hook ${hookId} is not a CRON trigger (type: ${hook.triggerType})`);
      return NextResponse.json(
        { error: 'Hook is not a CRON trigger' },
        { status: 400 }
      );
    }

    // 5. Validate cron expression
    const triggerConfig = hook.triggerConfig as any;
    const cronExpression = triggerConfig?.cronExpression;
    const timezone = triggerConfig?.timezone || 'UTC';

    if (!cronExpression) {
      console.error(`Hook ${hookId} has no cron expression`);
      return NextResponse.json(
        { error: 'Hook has no cron expression' },
        { status: 400 }
      );
    }

    // 6. Create trigger context
    const now = new Date();
    const triggerContext: TriggerContext = {
      type: 'CRON',
      data: {
        cronExpression,
        timezone,
        scheduledAt: now.toISOString(),
        lastExecutedAt: hook.lastExecutedAt?.toISOString(),
        hookId,
      },
      timestamp: now.toISOString(),
    };

    // 7. Execute the hook
    console.log(`Executing CRON hook: ${hook.name} (${hook.id})`);

    const executor = new HookExecutor();

    // Convert Prisma hook to Hook type (null -> undefined, JsonValue -> proper types)
    const hookForExecution = {
      ...hook,
      description: hook.description ?? undefined,
      lastExecutedAt: hook.lastExecutedAt ?? undefined,
      lastCheckedAt: hook.lastCheckedAt ?? undefined,
      lastProcessedBlock: hook.lastProcessedBlock ?? undefined,
      alchemyWebhookId: hook.alchemyWebhookId ?? undefined,
      triggerConfig: hook.triggerConfig as any,
      actionConfig: hook.actionConfig as any,
      actions: hook.actions as any,
    };

    const executionResult = await executor.executeHook(hookForExecution, triggerContext);

    // 8. Update last execution time
    await prisma.hook.update({
      where: { id: hookId },
      data: {
        lastExecutedAt: now,
        lastCheckedAt: now,
      },
    });

    console.log(`CRON hook ${hookId} executed successfully`);

    return NextResponse.json({
      success: true,
      message: 'Hook executed successfully',
      hookId,
      executionTime: now.toISOString(),
      result: executionResult,
    });

  } catch (error: any) {
    console.error(`Error executing CRON hook ${hookId}:`, error);

    // Update hook status to ERROR if execution failed
    try {
      await prisma.hook.update({
        where: { id: hookId },
        data: {
          status: 'ERROR',
          lastCheckedAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error(`Failed to update hook status to ERROR for ${hookId}:`, updateError);
    }

    return NextResponse.json(
      {
        error: 'Failed to execute hook',
        details: error.message,
        hookId,
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/execute/[hookId] - Get hook status (for debugging)
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { hookId } = await params;

  try {
    const hook = await prisma.hook.findUnique({
      where: { id: hookId },
      select: {
        id: true,
        name: true,
        triggerType: true,
        isActive: true,
        status: true,
        lastExecutedAt: true,
        lastCheckedAt: true,
        triggerConfig: true,
      },
    });

    if (!hook) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hook,
    });

  } catch (error: any) {
    console.error(`Error fetching hook ${hookId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch hook', details: error.message },
      { status: 500 }
    );
  }
}
