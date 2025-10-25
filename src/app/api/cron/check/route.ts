import { CronEngine } from '@/services/triggers/CronEngine';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/cron/check - Manually trigger CRON check (for testing)
export async function POST(req: NextRequest) {
  try {
    // In production, this should be protected or called by pg_cron
    const engine = new CronEngine();
    await engine.checkAndExecuteCronHooks();

    return NextResponse.json({
      success: true,
      message: 'CRON check completed',
    });
  } catch (error: any) {
    console.error('CRON check error:', error);

    return NextResponse.json(
      { error: 'Failed to check CRON hooks', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/cron/status - Get CRON engine status
export async function GET(req: NextRequest) {
  try {
    // Get count of active CRON hooks
    const { prisma } = await import('@/lib/prisma');

    const cronHooksCount = await prisma.hook.count({
      where: {
        triggerType: 'CRON',
        isActive: true,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      cronHooksCount,
      message: 'CRON engine is running',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get CRON status', details: error.message },
      { status: 500 }
    );
  }
}
