import { CronJobManager } from '@/services/triggers/CronJobManager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/test/cron-create
 * Test endpoint to manually test cron job creation
 */
export async function POST(req: NextRequest) {
  try {
    const { cronExpression, hookId } = await req.json();

    if (!cronExpression || !hookId) {
      return NextResponse.json(
        { error: 'Missing cronExpression or hookId' },
        { status: 400 }
      );
    }

    const manager = new CronJobManager();

    await manager.createCronJob(hookId, cronExpression);

    // Check if it was created
    const status = await manager.getCronJobStatus(hookId);
    const allJobs = await manager.listAllCronJobs();

    return NextResponse.json({
      success: true,
      message: 'Cron job created successfully',
      jobStatus: status,
      allJobs: allJobs,
    });
  } catch (error: any) {
    console.error('Test cron creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
