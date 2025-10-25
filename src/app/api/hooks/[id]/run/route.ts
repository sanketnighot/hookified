import { requireAuth } from '@/lib/auth/api-helpers';
import { HookExecutor } from '@/services/execution/HookExecutor';
import { TriggerContext } from '@/services/execution/types';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/hooks/[id]/run - Manually trigger a hook
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Validate that this is a manual trigger request
    const body = await req.json().catch(() => ({}));

    // Create trigger context for manual execution
    const triggerContext: TriggerContext = {
      type: 'MANUAL',
      data: {
        triggeredBy: user.id,
        triggeredAt: new Date().toISOString(),
        userAgent: req.headers.get('user-agent') || 'Unknown',
        ...body, // Allow additional context from request body
      },
      timestamp: new Date().toISOString(),
    };

    // Execute the hook
    const executor = new HookExecutor();
    const result = await executor.executeHookById(id, user.id, triggerContext);

    return NextResponse.json({
      success: true,
      runId: result.runId,
      status: result.status,
      message: result.status === 'SUCCESS'
        ? 'Hook executed successfully'
        : 'Hook execution failed',
      error: result.error,
    });

  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error.message === 'Hook not found') {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    if (error.message.includes('do not have access')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (error.message === 'Hook is not active') {
      return NextResponse.json(
        { error: 'Hook is not active' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to execute hook', details: error.message },
      { status: 500 }
    );
  }
}
