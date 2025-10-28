import { OnchainEngine } from "@/services/triggers/OnchainEngine";
import { NextRequest, NextResponse } from "next/server";

// POST /api/webhooks/alchemy/[hookId] - Handle Alchemy Custom Webhooks (GraphQL)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ hookId: string }> }
) {
  const startTime = Date.now();

  try {
    const { hookId } = await params;

    // Get raw body and parse webhook payload
    const rawBody = await req.text();
    const webhookData = JSON.parse(rawBody);

    // Quick check: Skip if no logs in block (empty block - no matching events)
    // Note: With skip_empty_messages: true, Alchemy shouldn't send these, but handle gracefully
    const logs = webhookData.event?.data?.block?.logs || [];
    if (logs.length === 0) {
      // Empty block - return 202 immediately without processing
      // This should not happen with skip_empty_messages: true on new webhooks
      return NextResponse.json({ success: true }, { status: 202 });
    }

    // Process the webhook asynchronously (don't await to respond quickly)
    const engine = new OnchainEngine();
    engine.handleAlchemyWebhook(hookId, webhookData).catch((error) => {
      console.error(
        `Failed to process Alchemy webhook for hook ${hookId}:`,
        error
      );
    });

    // Return 202 immediately to prevent retries
    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        message: "Webhook received and processing",
        hookId,
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Alchemy webhook error:", error);

    return NextResponse.json(
      { error: "Failed to process webhook", details: error.message },
      { status: 500 }
    );
  }
}
