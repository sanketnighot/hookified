import { getUserSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/hooks/[id]/regenerate-secret - Regenerate webhook secret
export async function POST(
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

    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex');

    // Update hook with new secret
    const updatedHook = await prisma.hook.update({
      where: { id },
      data: {
        triggerConfig: {
          ...(hook.triggerConfig as any),
          secret: newSecret
        },
        updatedAt: new Date()
      }
    });

    // Log regeneration event for audit
    console.log(`Webhook secret regenerated for hook ${id} by user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook secret regenerated successfully',
      secret: newSecret,
      warning: 'This will break existing integrations using the old secret. Update your webhook clients immediately.'
    });

  } catch (error: any) {
    console.error('Secret regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate webhook secret', details: error.message },
      { status: 500 }
    );
  }
}
