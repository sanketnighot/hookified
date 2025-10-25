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
  const startTime = Date.now();
  const clientIP =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  try {
    const { hookId } = await params;

    // Create HookRun record for tracking (even for failed attempts)
    const runId = `run_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    let hookRun = await prisma.hookRun.create({
      data: {
        id: runId,
        hookId: hookId,
        status: "PENDING",
        triggeredAt: new Date(),
        meta: {
          triggerContext: {
            webhookPayload: {},
            headers: Object.fromEntries(req.headers.entries()),
            timestamp: new Date().toISOString(),
            source: req.headers.get("user-agent") || "Unknown",
            clientIP,
          },
          actions: [],
          totalDuration: 0,
        },
      },
    });

    // Validate Content-Type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.log(
        `Webhook validation failed for hook ${hookId}: Invalid Content-Type from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Content-Type must be application/json",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Content-Type must be application/json",
          },
        },
      });

      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Find the hook
    const hook = await prisma.hook.findUnique({
      where: { id: hookId },
    });

    if (!hook) {
      console.log(
        `Webhook validation failed for hook ${hookId}: Hook not found from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Hook not found",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Hook not found",
          },
        },
      });

      return NextResponse.json({ error: "Hook not found" }, { status: 404 });
    }

    // Verify hook is active and has WEBHOOK trigger type
    if (!hook.isActive || hook.status !== "ACTIVE") {
      console.log(
        `Webhook validation failed for hook ${hookId}: Hook is not active from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Hook is not active",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Hook is not active",
          },
        },
      });

      return NextResponse.json(
        { error: "Hook is not active" },
        { status: 400 }
      );
    }

    if (hook.triggerType !== "WEBHOOK") {
      console.log(
        `Webhook validation failed for hook ${hookId}: Hook is not configured for webhook triggers from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Hook is not configured for webhook triggers",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Hook is not configured for webhook triggers",
          },
        },
      });

      return NextResponse.json(
        { error: "Hook is not configured for webhook triggers" },
        { status: 400 }
      );
    }

    // Validate webhook secret
    const webhookSecret = (hook.triggerConfig as any)?.secret;
    if (!webhookSecret) {
      console.log(
        `Webhook validation failed for hook ${hookId}: No secret configured from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Webhook secret not configured",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Webhook secret not configured",
          },
        },
      });

      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const providedSecret = req.headers.get("x-webhook-secret");
    if (!providedSecret) {
      console.log(
        `Webhook validation failed for hook ${hookId}: Missing secret header from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Missing x-webhook-secret header",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Missing x-webhook-secret header",
          },
        },
      });

      return NextResponse.json(
        { error: "Missing x-webhook-secret header" },
        { status: 401 }
      );
    }

    // Use timing-safe comparison to prevent timing attacks
    // First check if lengths match to avoid buffer length errors
    const webhookSecretBuffer = Buffer.from(webhookSecret, "utf8");
    const providedSecretBuffer = Buffer.from(providedSecret, "utf8");

    if (webhookSecretBuffer.length !== providedSecretBuffer.length) {
      console.log(
        `Webhook validation failed for hook ${hookId}: Secret length mismatch from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Invalid webhook secret (length mismatch)",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Invalid webhook secret (length mismatch)",
          },
        },
      });

      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    if (!crypto.timingSafeEqual(webhookSecretBuffer, providedSecretBuffer)) {
      console.log(
        `Webhook validation failed for hook ${hookId}: Invalid secret from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Invalid webhook secret",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Invalid webhook secret",
          },
        },
      });

      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let webhookPayload: any;
    try {
      const body = await req.text();
      webhookPayload = JSON.parse(body);
    } catch (error) {
      console.log(
        `Webhook validation failed for hook ${hookId}: Invalid JSON payload from IP ${clientIP}`
      );

      // Update HookRun with failure
      await prisma.hookRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: "Invalid JSON payload",
          meta: {
            triggerContext: {
              webhookPayload: {},
              headers: Object.fromEntries(req.headers.entries()),
              timestamp: new Date().toISOString(),
              source: req.headers.get("user-agent") || "Unknown",
              clientIP,
            },
            actions: [],
            totalDuration: Date.now() - startTime,
            error: "Invalid JSON payload",
          },
        },
      });

      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Create trigger context
    const triggerContext: TriggerContext = {
      type: "WEBHOOK",
      data: {
        webhookPayload,
        headers: Object.fromEntries(req.headers.entries()),
        timestamp: new Date().toISOString(),
        source: req.headers.get("user-agent") || "Unknown",
        clientIP,
      },
      timestamp: new Date().toISOString(),
    };

    // Delete the HookRun we created since HookExecutor will create its own
    await prisma.hookRun.delete({
      where: { id: runId },
    });

    // Execute the hook asynchronously
    const executor = new HookExecutor();

    // Don't await the execution - return immediately
    executor.executeHook(hook as any, triggerContext).catch((error) => {
      console.error(`Webhook execution failed for hook ${hookId}:`, error);
    });

    const processingTime = Date.now() - startTime;
    console.log(
      `Webhook accepted for hook ${hookId} from IP ${clientIP} in ${processingTime}ms`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Webhook received and hook execution triggered",
        hookId,
      },
      { status: 202 }
    );
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(
      `Webhook trigger error from IP ${clientIP} in ${processingTime}ms:`,
      error
    );

    return NextResponse.json(
      { error: "Failed to process webhook", details: error.message },
      { status: 500 }
    );
  }
}
