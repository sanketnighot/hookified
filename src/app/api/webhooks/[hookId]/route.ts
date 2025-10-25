import { prisma } from '@/lib/prisma';
import { HookExecutor } from '@/services/execution/HookExecutor';
import { TriggerContext } from '@/services/execution/types';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/webhooks/[hookId] - Trigger hook via webhook
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ hookId: string }> }
) {
  try {
    const { hookId } = await params;

    // Find the hook
    const hook = await prisma.hook.findUnique({
      where: { id: hookId },
    });

    if (!hook) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    // Verify hook is active and has WEBHOOK trigger type
    if (!hook.isActive || hook.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Hook is not active' },
        { status: 400 }
      );
    }

    if (hook.triggerType !== 'WEBHOOK') {
      return NextResponse.json(
        { error: 'Hook is not configured for webhook triggers' },
        { status: 400 }
      );
    }

    // Validate webhook secret if configured
    const webhookSecret = (hook.triggerConfig as any)?.secret;
    if (webhookSecret) {
      const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-hub-signature-256');
      const body = await req.text();

      if (!signature) {
        return NextResponse.json(
          { error: 'Missing webhook signature' },
          { status: 401 }
        );
      }

      // Verify signature (supports both HMAC-SHA256 and HMAC-SHA1)
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      if (!crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      )) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    let webhookPayload: any;
    try {
      webhookPayload = JSON.parse(await req.text());
    } catch {
      webhookPayload = {};
    }

    // Create trigger context
    const triggerContext: TriggerContext = {
      type: 'WEBHOOK',
      data: {
        webhookPayload,
        headers: Object.fromEntries(req.headers.entries()),
        timestamp: new Date().toISOString(),
        source: req.headers.get('user-agent') || 'Unknown',
      },
      timestamp: new Date().toISOString(),
    };

    // Execute the hook asynchronously
    const executor = new HookExecutor();

    // Don't await the execution - return immediately
    executor.executeHook(hook as any, triggerContext).catch((error) => {
      console.error(`Webhook execution failed for hook ${hookId}:`, error);
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook received and hook execution triggered',
      hookId,
    }, { status: 202 });

  } catch (error: any) {
    console.error('Webhook trigger error:', error);

    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    );
  }
}
