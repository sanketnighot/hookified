import { registry } from '../registry';
import { chainAction } from './ChainAction';
import { contractCallAction } from './ContractCallAction';
import { telegramAction } from './TelegramAction';
import { webhookAction } from './WebhookAction';

// Auto-register all actions
registry.registerAction(telegramAction);
registry.registerAction(webhookAction);
registry.registerAction(contractCallAction);
registry.registerAction(chainAction);

// Re-export for external use
export { ChainAction, chainAction } from './ChainAction';
export { ContractCallAction, contractCallAction } from './ContractCallAction';
export { TelegramAction, telegramAction } from './TelegramAction';
export { WebhookAction, webhookAction } from './WebhookAction';

export type { ChainConfig } from './ChainAction';
export type { ContractCallConfig } from './ContractCallAction';
export type { TelegramConfig } from './TelegramAction';
export type { WebhookActionConfig } from './WebhookAction';

