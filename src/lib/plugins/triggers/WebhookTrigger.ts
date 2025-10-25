import { TriggerDefinition, ValidationResult, FormSchema } from '../types';

export interface WebhookConfig {
  type: 'WEBHOOK';
  webhookUrl?: string;
  secret?: string;
}

export class WebhookTrigger implements TriggerDefinition<WebhookConfig> {
  type = 'WEBHOOK';
  name = 'Webhook';
  description = 'Trigger from external services via HTTP requests';
  icon = 'Webhook';

  validateConfig(config: WebhookConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.webhookUrl) {
      errors.push('Webhook URL is required');
    } else {
      try {
        const url = new URL(config.webhookUrl);
        if (url.protocol !== 'https:') {
          errors.push('Webhook URL must use HTTPS protocol');
        }
      } catch {
        errors.push('Invalid webhook URL format');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: 'webhookUrl',
          label: 'Webhook URL',
          type: 'text',
          placeholder: 'https://your-domain.com/webhook',
          required: true,
          validation: { pattern: '^https://.*' },
          description: 'The HTTPS URL to receive webhook requests'
        },
        {
          name: 'secret',
          label: 'Secret (Optional)',
          type: 'password',
          placeholder: 'Your webhook secret',
          required: false,
          description: 'Optional secret for webhook verification'
        }
      ]
    };
  }
}

export const webhookTrigger = new WebhookTrigger();
