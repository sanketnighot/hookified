import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/test/runs - Test endpoint to check runs data
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const hookId = url.searchParams.get('hookId');

    if (!hookId) {
      return NextResponse.json({ error: 'hookId is required' }, { status: 400 });
    }

    // Fetch runs for the hook
    const runs = await prisma.hookRun.findMany({
      where: { hookId },
      orderBy: { triggeredAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      hookId,
      runsCount: runs.length,
      runs: runs.map(run => ({
        id: run.id,
        status: run.status,
        triggeredAt: run.triggeredAt,
        completedAt: run.completedAt,
        error: run.error,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch test runs', details: error.message },
      { status: 500 }
    );
  }
}
