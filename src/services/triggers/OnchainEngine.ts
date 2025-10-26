import { getAlchemyConfig, isAlchemyConfigured } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { HookExecutor } from '@/services/execution/HookExecutor';
import { TriggerContext } from '@/services/execution/types';
import axios from 'axios';

export class OnchainEngine {
  private executor = new HookExecutor();

  constructor() {
    if (!isAlchemyConfigured()) {
      console.warn('ALCHEMY_API_KEY not found in environment variables');
    }
  }

  // Register webhook with Alchemy Notify when hook is created
  async registerWebhook(hook: any): Promise<string | null> {
    if (!isAlchemyConfigured()) {
      throw new Error('Alchemy API key not configured');
    }

    const alchemyConfig = getAlchemyConfig();

    const triggerConfig = hook.triggerConfig as any;
    const contractAddress = triggerConfig?.contractAddress;
    const eventName = triggerConfig?.eventName;
    const chainId = triggerConfig?.chainId;

    if (!contractAddress || !eventName || !chainId) {
      throw new Error('Missing required ONCHAIN configuration: contractAddress, eventName, chainId');
    }

    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/alchemy/${hook.id}`;

      const response = await axios.post(
        `${alchemyConfig.baseUrl}/v2/${alchemyConfig.apiKey}`,
        {
          webhook_url: webhookUrl,
          addresses: [contractAddress],
          topics: [`0x${this.getEventSignature(eventName)}`],
          network: this.getAlchemyNetwork(chainId),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const webhookId = response.data.id;

      // Store webhook ID in database
      await prisma.hook.update({
        where: { id: hook.id },
        data: { alchemyWebhookId: webhookId },
      });
      return webhookId;
    } catch (error) {
      console.error(`Failed to register Alchemy webhook for hook ${hook.id}:`, error);
      throw error;
    }
  }

  // Unregister webhook when hook is deleted or disabled
  async unregisterWebhook(hook: any): Promise<void> {
    if (!hook.alchemyWebhookId || !isAlchemyConfigured()) {
      return;
    }

    const alchemyConfig = getAlchemyConfig();

    try {
      await axios.delete(
        `${alchemyConfig.baseUrl}/v2/${alchemyConfig.apiKey}/webhooks/${hook.alchemyWebhookId}`
      );
    } catch (error) {
      console.error(`Failed to unregister Alchemy webhook for hook ${hook.id}:`, error);
    }
  }

  // Handle incoming webhook from Alchemy
  async handleAlchemyWebhook(hookId: string, webhookData: any): Promise<void> {
    try {
      const hook = await prisma.hook.findUnique({
        where: { id: hookId },
      });

      if (!hook || !hook.isActive || hook.status !== 'ACTIVE') {
        console.warn(`Hook ${hookId} not found or not active`);
        return;
      }

      if (hook.triggerType !== 'ONCHAIN') {
        console.warn(`Hook ${hookId} is not an ONCHAIN trigger`);
        return;
      }

      // Extract event data from webhook
      const eventData = this.extractEventData(webhookData);

      // Create trigger context
      const triggerContext: TriggerContext = {
        type: 'ONCHAIN',
        data: {
          ...eventData,
          webhookData,
          receivedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      // Execute the hook
      await this.executor.executeHook(hook as any, triggerContext);
    } catch (error) {
      console.error(`Error handling Alchemy webhook for hook ${hookId}:`, error);
    }
  }

  // Extract relevant event data from Alchemy webhook
  private extractEventData(webhookData: any): any {
    const logs = webhookData.logs || [];
    const eventData: any = {};

    for (const log of logs) {
      eventData.transactionHash = log.transactionHash;
      eventData.blockNumber = log.blockNumber;
      eventData.logIndex = log.logIndex;
      eventData.address = log.address;
      eventData.topics = log.topics;
      eventData.data = log.data;

      // Parse event parameters (simplified - in production, you'd use ABI)
      if (log.topics && log.topics.length > 1) {
        eventData.eventParams = log.topics.slice(1);
      }
    }

    return eventData;
  }

  // Get event signature hash (simplified)
  private getEventSignature(eventName: string): string {
    // In production, you'd use ethers.js to compute the keccak256 hash
    // For now, return a placeholder
    return '0000000000000000000000000000000000000000000000000000000000000000';
  }

  // Map chain ID to Alchemy network
  private getAlchemyNetwork(chainId: number): string {
    const networks: { [key: number]: string } = {
      1: 'eth-mainnet',
      137: 'polygon-mainnet',
      56: 'bsc-mainnet',
      42161: 'arb-mainnet',
      10: 'opt-mainnet',
    };

    return networks[chainId] || 'eth-mainnet';
  }

  // Validate ONCHAIN configuration
  static validateOnchainConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.contractAddress) {
      errors.push('Contract address is required');
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(config.contractAddress)) {
      errors.push('Invalid contract address format');
    }

    if (!config.eventName) {
      errors.push('Event name is required');
    }

    if (!config.chainId) {
      errors.push('Chain ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
