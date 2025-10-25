import { requireAuth } from '@/lib/auth/api-helpers';
import { HookService } from '@/services/hooks/HookService';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/hooks/:id - Get single hook
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const hook = await HookService.getHookById(id, user.id);

    if (!hook) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hook
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error.message.includes('do not have access')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch hook', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/hooks/:id - Update hook
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    const hook = await HookService.updateHook(id, user.id, body);

    return NextResponse.json({
      success: true,
      hook
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

    if (error.message.includes('validation failed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update hook', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/hooks/:id - Delete hook
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    await HookService.deleteHook(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Hook deleted successfully'
    }, { status: 204 });
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

    return NextResponse.json(
      { error: 'Failed to delete hook', details: error.message },
      { status: 500 }
    );
  }
}
