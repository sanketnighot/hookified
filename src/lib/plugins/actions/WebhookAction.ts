import { ActionDefinition, FormSchema, ValidationResult } from '../types';

export interface WebhookActionConfig {
  type: 'WEBHOOK';
  webhookUrl?: string;
  method?: 'GET' | 'POST' | 'PUT';
  headers?: string; // JSON string for UI
}

export class WebhookAction implements ActionDefinition<WebhookActionConfig> {
  type = 'WEBHOOK';
  name = 'Webhook';
  description = 'POST to external services and APIs';
  icon = 'Webhook';

  validateConfig(config: WebhookActionConfig): ValidationResult {
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
          placeholder: 'https://your-api.com/webhook',
          required: true,
          validation: { pattern: '^https://.*' },
          description: 'The HTTPS URL to POST data to'
        },
        {
          name: 'method',
          label: 'HTTP Method',
          type: 'select',
          required: false,
          default: 'POST',
          options: [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' }
          ],
          description: 'HTTP method to use'
        },
        {
          name: 'headers',
          label: 'Headers (JSON)',
          type: 'textarea',
          placeholder: '{"Authorization": "Bearer token", "Content-Type": "application/json"}',
          required: false,
          description: 'Optional headers as JSON object'
        }
      ]
    };
  }
}

export const webhookAction = new WebhookAction();
