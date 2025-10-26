import { CronSetupValidator } from '@/services/triggers/CronSetupValidator';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/cron-setup
 * Returns detailed diagnostics about the CRON setup status
 */
export async function GET(req: NextRequest) {
  try {
    const validator = new CronSetupValidator();
    const status = await validator.validateSetup();

    return NextResponse.json({
      success: true,
      setup: status,
      summary: {
        isConfigured: status.isValid,
        issues: status.issues.length,
        requirements: {
          environmentVariables: {
            required: 3,
            configured: Object.values(status.details.environmentVariables).filter(Boolean).length
          },
          databaseExtensions: {
            required: 2,
            configured: Object.values(status.details.databaseExtensions).filter(Boolean).length
          },
          functions: {
            required: 1,
            configured: Object.values(status.details.functions).filter(Boolean).length
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Error checking CRON setup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        setup: {
          isSetup: false,
          isValid: false,
          issues: ['Failed to check setup status'],
          instructions: ['Check server logs for details']
        }
      },
      { status: 500 }
    );
  }
}
