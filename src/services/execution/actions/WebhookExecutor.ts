import { BaseActionExecutor } from '../ActionExecutor';
import { ActionExecutionResult, EXECUTION_CONFIG, ExecutionContext, interpolateVariables } from '../types';

export interface WebhookConfig {
  webhookUrl: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  bodyTemplate?: string;
}

export class WebhookExecutor extends BaseActionExecutor {
  async execute(
    actionConfig: WebhookConfig,
    context: ExecutionContext
  ): Promise<ActionExecutionResult> {
    const startedAt = new Date();
    const actionId = `webhook-${Date.now()}`;

    try {
      // Validate configuration
      if (!actionConfig.webhookUrl) {
        throw new Error(
          "Missing required Webhook configuration: webhookUrl is required"
        );
      }

      // Validate URL
      try {
        new URL(actionConfig.webhookUrl);
      } catch {
        throw new Error("Invalid webhook URL format");
      }

      const method = actionConfig.method || "POST";

      // Interpolate headers if they contain variables
      const enrichedContext = {
        ...context.variables,
        hookId: context.hookId,
        runId: context.runId,
        timestamp: new Date().toISOString(),
      };

      const headers = {
        "Content-Type": "application/json",
        "User-Agent": "Hookified/1.0",
        ...(actionConfig.headers
          ? Object.fromEntries(
              Object.entries(actionConfig.headers).map(([key, value]) => [
                key,
                typeof value === "string" && value.includes("{")
                  ? interpolateVariables(value, enrichedContext)
                  : value,
              ])
            )
          : {}),
      };

      // Prepare body with variable interpolation
      let body: string | undefined;
      if (
        actionConfig.bodyTemplate &&
        ["POST", "PUT", "PATCH"].includes(method)
      ) {
        // Add common runtime variables to context
        const enrichedContext = {
          ...context.variables,
          hookId: context.hookId,
          runId: context.runId,
          timestamp: new Date().toISOString(),
        };
        body = interpolateVariables(actionConfig.bodyTemplate, enrichedContext);
      }

      // Execute with retry and timeout
      const result = await this.executeWithRetry(
        () =>
          this.executeWithTimeout(
            this.makeWebhookRequest(
              actionConfig.webhookUrl,
              method,
              headers,
              body
            ),
            EXECUTION_CONFIG.TIMEOUTS.WEBHOOK,
            "WEBHOOK"
          ),
        "WEBHOOK"
      );

      return this.createExecutionResult(
        actionId,
        "WEBHOOK",
        startedAt,
        "SUCCESS",
        result
      );
    } catch (error) {
      return this.createExecutionResult(
        actionId,
        'WEBHOOK',
        startedAt,
        'FAILED',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async makeWebhookRequest(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<any> {
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      requestOptions.body = body;
    }

    const response = await fetch(url, requestOptions);

    // Consider 2xx and 3xx status codes as success
    if (response.status >= 400) {
      throw new Error(`Webhook request failed with status ${response.status}: ${response.statusText}`);
    }

    // Try to parse response body
    let responseBody: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
      url: response.url,
    };
  }
}
