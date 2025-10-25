import { OnchainEngine } from '@/services/triggers/OnchainEngine';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/webhooks/alchemy/[hookId] - Handle Alchemy Notify webhooks
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ hookId: string }> }
) {
  try {
    const { hookId } = await params;

    // Parse webhook payload
    const webhookData = await req.json();

    // Validate webhook signature (optional but recommended)
    const signature = req.headers.get('x-alchemy-signature');
    if (signature && process.env.ALCHEMY_WEBHOOK_SECRET) {
      // In production, validate the signature here
      // const isValid = validateAlchemySignature(signature, webhookData, process.env.ALCHEMY_WEBHOOK_SECRET);
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
    }

    // Process the webhook asynchronously
    const engine = new OnchainEngine();
    engine.handleAlchemyWebhook(hookId, webhookData).catch((error) => {
      console.error(`Failed to process Alchemy webhook for hook ${hookId}:`, error);
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook received and processing',
    }, { status: 202 });

  } catch (error: any) {
    console.error('Alchemy webhook error:', error);

    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    );
  }
}
