import { registry } from '../registry';
import { cronTrigger } from './CronTrigger';
import { manualTrigger } from './ManualTrigger';
import { onchainTrigger } from './OnchainTrigger';
import { webhookTrigger } from './WebhookTrigger';

// Auto-register all triggers
registry.registerTrigger(onchainTrigger);
registry.registerTrigger(cronTrigger);
registry.registerTrigger(webhookTrigger);
registry.registerTrigger(manualTrigger);

// Re-export for external use
export { CronTrigger, cronTrigger } from './CronTrigger';
export { ManualTrigger, manualTrigger } from './ManualTrigger';
export { OnchainTrigger, onchainTrigger } from './OnchainTrigger';
export { WebhookTrigger, webhookTrigger } from './WebhookTrigger';

export type { CronConfig } from './CronTrigger';
export type { ManualConfig } from './ManualTrigger';
export type { OnchainConfig } from './OnchainTrigger';
export type { WebhookConfig } from './WebhookTrigger';

