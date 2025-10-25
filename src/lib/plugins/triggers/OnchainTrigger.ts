import { TriggerDefinition, ValidationResult, FormSchema } from '../types';

export interface OnchainConfig {
  type: 'ONCHAIN';
  contractAddress?: string;
  eventName?: string;
  chainId?: number;
}

export class OnchainTrigger implements TriggerDefinition<OnchainConfig> {
  type = 'ONCHAIN';
  name = 'Onchain Event';
  description = 'Monitor smart contract events and token transfers';
  icon = 'Blocks';

  validateConfig(config: OnchainConfig): ValidationResult {
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
      errors.push('Chain selection is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: 'contractAddress',
          label: 'Contract Address',
          type: 'text',
          placeholder: '0x...',
          required: true,
          validation: { pattern: '^0x[a-fA-F0-9]{40}$' },
          description: 'The smart contract address to monitor'
        },
        {
          name: 'eventName',
          label: 'Event Name',
          type: 'text',
          placeholder: 'Transfer',
          required: true,
          description: 'The event name to listen for (e.g., Transfer, Approval)'
        },
        {
          name: 'chainId',
          label: 'Blockchain Network',
          type: 'select',
          required: true,
          options: [
            { value: 1, label: 'Ethereum Mainnet' },
            { value: 137, label: 'Polygon' },
            { value: 56, label: 'BSC' },
            { value: 42161, label: 'Arbitrum' },
            { value: 10, label: 'Optimism' }
          ],
          description: 'Select the blockchain network'
        }
      ]
    };
  }
}

export const onchainTrigger = new OnchainTrigger();
