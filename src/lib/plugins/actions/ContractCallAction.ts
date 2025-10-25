import { ActionDefinition, FormSchema, ValidationResult } from '../types';

export interface ContractCallConfig {
  type: 'CONTRACT_CALL';
  contractAddress?: string;
  functionName?: string;
  parameters?: string; // JSON string for UI
  chainId?: number;
}

export class ContractCallAction implements ActionDefinition<ContractCallConfig> {
  type = 'CONTRACT_CALL';
  name = 'Contract Call';
  description = 'Execute smart contract functions onchain';
  icon = 'Code';

  validateConfig(config: ContractCallConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.contractAddress) {
      errors.push('Contract address is required');
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(config.contractAddress)) {
      errors.push('Invalid contract address format');
    }

    if (!config.functionName) {
      errors.push('Function name is required');
    }

    if (!config.chainId) {
      errors.push('Chain ID is required');
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
          description: 'The smart contract address to call'
        },
        {
          name: 'functionName',
          label: 'Function Name',
          type: 'text',
          placeholder: 'transfer',
          required: true,
          description: 'The function name to execute'
        },
        {
          name: 'parameters',
          label: 'Parameters (JSON)',
          type: 'textarea',
          placeholder: '["0x123...", "1000000"]',
          required: false,
          description: 'Function parameters as JSON array'
        },
        {
          name: 'chainId',
          label: 'Chain',
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

export const contractCallAction = new ContractCallAction();
