import { EventMonitor, TriggerConfig } from '@/lib/types';

export function migrateOnchainConfig(config: TriggerConfig): TriggerConfig {
  // Already migrated or not ONCHAIN
  if (config.type !== 'ONCHAIN' || config.events) {
    return config;
  }

  // Migrate from single-event format to multi-event
  if (config.contractAddress && config.eventName) {
    const eventMonitor: EventMonitor = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contractAddress: config.contractAddress,
      eventName: config.eventName,
      abi: config.abi,
      filters: [],
    };

    return {
      ...config,
      mode: 'single',
      events: [eventMonitor],
    };
  }

  return config;
}

export function migrateAllHooks(hooks: any[]): any[] {
  return hooks.map(hook => {
    if (hook.triggerType === 'ONCHAIN') {
      return {
        ...hook,
        triggerConfig: migrateOnchainConfig(hook.triggerConfig),
      };
    }
    return hook;
  });
}

