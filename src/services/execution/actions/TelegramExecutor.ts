import { getTelegramConfig, isTelegramConfigured } from '@/lib/config';
import { convertToTelegramEntities } from "@/lib/telegram/entityConverter";
import { BaseActionExecutor } from '../ActionExecutor';
import { ActionExecutionResult, EXECUTION_CONFIG, ExecutionContext, interpolateVariables } from '../types';

export interface TelegramConfig {
  chatId: string;
  messageTemplate?: string;
  // botToken removed - will use environment variable
}

export class TelegramExecutor extends BaseActionExecutor {
  async execute(
    actionConfig: TelegramConfig,
    context: ExecutionContext
  ): Promise<ActionExecutionResult> {
    const startedAt = new Date();
    const actionId = `telegram-${Date.now()}`;

    try {
      // Check if Telegram is configured
      if (!isTelegramConfigured()) {
        throw new Error(
          "Telegram bot token not configured in environment variables"
        );
      }

      const telegramConfig = getTelegramConfig();

      // Validate configuration
      if (!actionConfig.chatId) {
        throw new Error(
          "Missing required Telegram configuration: chatId is required"
        );
      }

      // Resolve username to chat ID if needed
      let chatId = actionConfig.chatId;
      if (!this.isNumericChatId(chatId)) {
        chatId = await this.resolveUsernameToChatId(
          telegramConfig.botToken,
          chatId
        );
      }

      // Prepare message with variable interpolation
      const messageTemplate =
        actionConfig.messageTemplate || "🚨 Hook executed successfully!";
      // Add common runtime variables to context
      const enrichedContext = {
        ...context.variables,
        hookId: context.hookId,
        runId: context.runId,
        timestamp: new Date().toISOString(),
      };
      // Interpolate variables in markup text
      const interpolatedMarkup = interpolateVariables(
        messageTemplate,
        enrichedContext
      );

      // Convert markup to Telegram entities
      const { text, entities } = convertToTelegramEntities(interpolatedMarkup);

      // Execute with retry and timeout
      const result = await this.executeWithRetry(
        () =>
          this.executeWithTimeout(
            this.sendTelegramMessage(
              telegramConfig.botToken,
              chatId,
              text,
              entities
            ),
            EXECUTION_CONFIG.TIMEOUTS.TELEGRAM,
            "TELEGRAM"
          ),
        "TELEGRAM"
      );

      return this.createExecutionResult(
        actionId,
        "TELEGRAM",
        startedAt,
        "SUCCESS",
        result
      );
    } catch (error) {
      return this.createExecutionResult(
        actionId,
        'TELEGRAM',
        startedAt,
        'FAILED',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Check if the chat ID is numeric (legitimate chat ID)
   */
  private isNumericChatId(chatId: string): boolean {
    // Remove @ if present and check if numeric
    return /^-?\d+$/.test(chatId.replace('@', ''));
  }

  /**
   * Attempt to resolve a username to a chat ID by:
   * 1. Trying to send a message directly (Telegram will return the chat info)
   * 2. Using getUpdates to find recent chats
   */
  private async resolveUsernameToChatId(botToken: string, usernameOrChannel: string): Promise<string> {
    // Remove @ if present
    const cleanUsername = usernameOrChannel.replace('@', '');

    // First, try to get chat info using getChat
    try {
      const getChatUrl = `https://api.telegram.org/bot${botToken}/getChat`;
      const response = await fetch(getChatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: `@${cleanUsername}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok && result.result.id) {
          return result.result.id.toString();
        }
      }
    } catch (error) {
      console.warn('Could not resolve username via getChat:', error);
    }

    // If getChat fails, throw an error with helpful message
    throw new Error(
      `Unable to resolve username "@${cleanUsername}" to a chat ID. ` +
      `Please provide the numeric chat ID instead. To get your chat ID: ` +
      `1. Send a message to your bot, then call https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates ` +
      `2. Look for the "chat":{"id":<NUMBER>} field`
    );
  }

  private async sendTelegramMessage(
    botToken: string,
    chatId: string,
    text: string,
    entities?: any[]
  ): Promise<any> {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const payload: any = {
      chat_id: chatId,
      text: text,
    };

    // Only include entities if we have formatting
    if (entities && entities.length > 0) {
      payload.entities = entities;
    }

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Telegram API error: ${response.status} - ${errorData.description || response.statusText}`);
    }

    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Telegram API returned error: ${result.description || 'Unknown error'}`);
    }

    return {
      messageId: result.result.message_id,
      chatId: result.result.chat.id,
      timestamp: result.result.date,
    };
  }
}
