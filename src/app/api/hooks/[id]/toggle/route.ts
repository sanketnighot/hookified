import { requireAuth } from '@/lib/auth/api-helpers';
import { HookService } from '@/services/hooks/HookService';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/hooks/:id/toggle - Toggle hook active/inactive status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: isActive must be a boolean' },
        { status: 400 }
      );
    }

    const hook = await HookService.toggleHookStatus(id, user.id, isActive);

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

    return NextResponse.json(
      { error: 'Failed to toggle hook status', details: error.message },
      { status: 500 }
    );
  }
}
