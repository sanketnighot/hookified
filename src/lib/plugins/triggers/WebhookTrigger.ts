import { FormSchema, TriggerDefinition, ValidationResult } from "../types";

export interface WebhookConfig {
  type: "WEBHOOK";
  secret?: string; // Auto-generated secret stored in triggerConfig (optional during creation)
}

export class WebhookTrigger implements TriggerDefinition<WebhookConfig> {
  type = "WEBHOOK";
  name = "Webhook";
  description = "Trigger from external services via HTTP requests";
  icon = "Webhook";

  validateConfig(config: WebhookConfig): ValidationResult {
    const errors: string[] = [];

    // For webhook triggers, secret is auto-generated during creation
    // No validation needed during the creation process
    return { isValid: true, errors: [] };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: "info",
          label: "Webhook Configuration",
          type: "text",
          placeholder: "",
          required: false,
          description:
            "Webhook URL and secret will be generated automatically after hook creation. External services can trigger this hook by calling the generated endpoint with the secret.",
        },
      ],
    };
  }
}

export const webhookTrigger = new WebhookTrigger();
