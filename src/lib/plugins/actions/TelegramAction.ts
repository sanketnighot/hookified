import { ActionDefinition, FormSchema, ValidationResult } from '../types';

export interface TelegramConfig {
  type: "TELEGRAM";
  chatId?: string;
  messageTemplate?: string;
  // botToken removed - will use environment variable
}

export class TelegramAction implements ActionDefinition<TelegramConfig> {
  type = 'TELEGRAM';
  name = 'Telegram Message';
  description = 'Send messages to Telegram chats or channels';
  icon = 'Send';

  validateConfig(config: TelegramConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.chatId) {
      errors.push('Chat ID is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: "chatId",
          label: "Chat ID",
          type: "text",
          placeholder: "123456789 or @channelname",
          required: true,
          description: "Your Telegram chat ID or channel username",
        },
        {
          name: "messageTemplate",
          label: "Message Template",
          type: "textarea",
          placeholder: "🚨 Alert: {eventName} detected!",
          required: false,
          supportsVariables: true,
          editorType: "telegram-rich-text",
          description:
            "Use variables and formatting toolbar to create rich messages",
        },
      ],
    };
  }
}

export const telegramAction = new TelegramAction();
