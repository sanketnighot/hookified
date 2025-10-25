import { ActionDefinition, FormSchema, ValidationResult } from '../types';

export interface TelegramConfig {
  type: 'TELEGRAM';
  botToken?: string;
  chatId?: string;
  messageTemplate?: string;
}

export class TelegramAction implements ActionDefinition<TelegramConfig> {
  type = 'TELEGRAM';
  name = 'Telegram Message';
  description = 'Send messages to Telegram chats or channels';
  icon = 'Send';

  validateConfig(config: TelegramConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.botToken) {
      errors.push('Bot token is required');
    }

    if (!config.chatId) {
      errors.push('Chat ID is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: 'botToken',
          label: 'Bot Token',
          type: 'password',
          placeholder: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
          required: true,
          description: 'Get this from @BotFather on Telegram'
        },
        {
          name: 'chatId',
          label: 'Chat ID',
          type: 'text',
          placeholder: '123456789 or @channelname',
          required: true,
          description: 'Your Telegram chat ID or channel username'
        },
        {
          name: 'messageTemplate',
          label: 'Message Template',
          type: 'textarea',
          placeholder: '🚨 Alert: {eventName} detected!',
          required: false,
          description: 'Use {variable} for dynamic values (e.g., {eventName}, {contractAddress})'
        }
      ]
    };
  }
}

export const telegramAction = new TelegramAction();
