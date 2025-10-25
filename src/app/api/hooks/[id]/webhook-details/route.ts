import { getUserSession } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/hooks/[id]/webhook-details - Get webhook configuration details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user session
    const session = await getUserSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the hook
    const hook = await prisma.hook.findUnique({
      where: { id },
    });

    if (!hook) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Verify ownership
    if (hook.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this hook' },
        { status: 403 }
      );
    }

    // Check if hook is WEBHOOK type
    if (hook.triggerType !== 'WEBHOOK') {
      return NextResponse.json(
        { error: 'This hook is not configured for webhook triggers' },
        { status: 400 }
      );
    }

    const webhookSecret = (hook.triggerConfig as any)?.secret;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get last execution time
    const lastRun = await prisma.hookRun.findFirst({
      where: { hookId: id },
      orderBy: { triggeredAt: 'desc' },
      select: { triggeredAt: true, status: true }
    });

    const webhookUrl = `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/${id}`;

    // Generate example curl command
    const exampleCurl = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{"message": "Hello from webhook!", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'`;

    return NextResponse.json({
      webhookUrl,
      secret: webhookSecret,
      lastTriggered: lastRun?.triggeredAt || null,
      lastStatus: lastRun?.status || null,
      exampleCurl,
      instructions: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret
        },
        body: 'JSON payload will be passed to your hook actions'
      }
    });

  } catch (error: any) {
    console.error('Webhook details error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve webhook details', details: error.message },
      { status: 500 }
    );
  }
}
