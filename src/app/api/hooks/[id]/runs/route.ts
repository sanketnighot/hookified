import { requireAuth } from '@/lib/auth/api-helpers';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/hooks/[id]/runs - Get runs for a specific hook
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Verify hook ownership
    const hook = await prisma.hook.findUnique({
      where: { id },
    });

    if (!hook) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    if (hook.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch runs with pagination
    const runs = await prisma.hookRun.findMany({
      where: { hookId: id },
      orderBy: { triggeredAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.hookRun.count({
      where: { hookId: id },
    });

    return NextResponse.json({
      success: true,
      runs,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch runs', details: error.message },
      { status: 500 }
    );
  }
}
