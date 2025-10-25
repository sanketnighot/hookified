import { requireAuth } from '@/lib/auth/api-helpers';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/runs/[id] - Get a specific run by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Fetch run with hook information
    const run = await prisma.hookRun.findUnique({
      where: { id },
      include: {
        hook: true,
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    // Verify ownership through hook
    if (run.hook.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      run,
    });

  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch run', details: error.message },
      { status: 500 }
    );
  }
}
