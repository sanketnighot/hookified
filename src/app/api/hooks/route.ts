import { requireAuth } from '@/lib/auth/api-helpers';
import { HookService } from '@/services/hooks/HookService';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/hooks - List all user hooks
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const hooks = await HookService.getHooksByUser(user.id);

    return NextResponse.json({
      success: true,
      hooks
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch hooks', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/hooks - Create new hook
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.triggerType || !body.actions || body.actions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, triggerType, actions' },
        { status: 400 }
      );
    }

    const hook = await HookService.createHook({
      ...body,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      hook
    }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validation errors
    if (error.message.includes('validation failed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create hook', details: error.message },
      { status: 500 }
    );
  }
}
