import { ActionDefinition, FormSchema, ValidationResult } from '../types';

export interface ContractCallConfig {
  type: "CONTRACT_CALL";
  contractAddress?: string;
  functionName?: string;
  parameters?: any[]; // Changed from string to any[] for better type safety
  chainId?: number;
  isNativeTransfer?: boolean;
  abi?: any[];
  abiSignature?: string;
  tokenDecimals?: number;
  tokenSymbol?: string;
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

    if (!config.chainId) {
      errors.push("Chain ID is required");
    }

    if (config.isNativeTransfer) {
      // For native transfers, we need recipient and amount
      if (!config.parameters || config.parameters.length < 2) {
        errors.push("Native transfer requires recipient address and amount");
      }
    } else {
      // For contract calls, we need function name
      if (!config.functionName) {
        errors.push("Function name is required for contract calls");
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: "contractAddress",
          label: "Contract Address",
          type: "text",
          placeholder: "0x...",
          required: true,
          validation: { pattern: "^0x[a-fA-F0-9]{40}$" },
          description: "The smart contract address to call",
        },
        {
          name: "functionName",
          label: "Function Name",
          type: "text",
          placeholder: "transfer",
          required: true,
          description: "The function name to execute",
        },
        {
          name: "parameters",
          label: "Parameters (JSON)",
          type: "textarea",
          placeholder: '["0x123...", "1000000"]',
          required: false,
          description: "Function parameters as JSON array",
        },
        {
          name: "chainId",
          label: "Chain",
          type: "select",
          required: true,
          options: [
            { value: 1, label: "Ethereum Mainnet" },
            { value: 11155111, label: "Sepolia Testnet" },
            { value: 137, label: "Polygon" },
            { value: 80002, label: "Polygon Amoy" },
            { value: 56, label: "BSC" },
            { value: 97, label: "BSC Testnet" },
            { value: 42161, label: "Arbitrum" },
            { value: 10, label: "Optimism" },
            { value: 8453, label: "Base" },
            { value: 84532, label: "Base Sepolia" },
          ],
          description: "Select the blockchain network",
        },
      ],
    };
  }
}

export const contractCallAction = new ContractCallAction();
