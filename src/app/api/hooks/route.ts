import { requireAuth } from '@/lib/auth/api-helpers';
import { env } from "@/lib/env";
import { HookService } from '@/services/hooks/HookService';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/hooks - List all user hooks
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const hooks = await HookService.getHooksByUser(user.id);

    return NextResponse.json({
      success: true,
      hooks
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch hooks', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/hooks - Create new hook
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    // Validate required fields
    if (
      !body.name ||
      !body.triggerType ||
      !body.actions ||
      body.actions.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields: name, triggerType, actions" },
        { status: 400 }
      );
    }

    const hook = await HookService.createHook({
      ...body,
      userId: user.id,
    });

    // For WEBHOOK triggers, include webhook details in response
    if (body.triggerType === "WEBHOOK" && (hook as any).webhookSecret) {
      const webhookUrl = `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/${hook.id}`;

      return NextResponse.json(
        {
          success: true,
          hook,
          webhookUrl,
          webhookSecret: (hook as any).webhookSecret,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        hook,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized: Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle ONCHAIN webhook registration failures
    if (error.message?.includes("Failed to create ONCHAIN hook")) {
      return NextResponse.json(
        {
          error: "Failed to create hook",
          message: error.message,
          details:
            "The hook could not be created because webhook registration with Alchemy failed.",
        },
        { status: 400 }
      );
    }

    // Validation errors
    if (error.message.includes("validation failed")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if this is a CRON setup error
    const errorMessage = error.message || "";
    const isCronSetupError =
      errorMessage.includes("CRON scheduling unavailable") ||
      errorMessage.includes("exec_sql") ||
      errorMessage.includes("pg_cron") ||
      errorMessage.includes("Cannot create CRON hook");

    if (isCronSetupError) {
      return NextResponse.json(
        {
          error: "CRON scheduling is not available",
          details: errorMessage,
          type: "CRON_SETUP_ERROR",
          instructions: [
            "Contact your administrator to set up pg_cron in Supabase",
            "Run the SQL in supabase-cron-jobs-setup.sql",
            "Ensure pg_cron and http extensions are enabled",
            "Verify CRON_SECRET and SUPABASE_SERVICE_ROLE_KEY are set",
          ],
          setupDocumentation: "/docs/CRON_SETUP_TROUBLESHOOTING.md",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create hook", details: error.message },
      { status: 500 }
    );
  }
}
