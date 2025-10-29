import { EventMonitor } from "@/lib/types";
import { FormSchema, TriggerDefinition, ValidationResult } from "../types";

export interface OnchainConfig {
  type: "ONCHAIN";
  // Legacy fields
  contractAddress?: string;
  eventName?: string;
  chainId?: number;
  abi?: any[];
  // New fields
  mode?: "single" | "multi";
  events?: EventMonitor[];
}

export class OnchainTrigger implements TriggerDefinition<OnchainConfig> {
  type = "ONCHAIN";
  name = "Onchain Event";
  description = "Monitor smart contract events and token transfers";
  icon = "Blocks";

  validateConfig(config: OnchainConfig): ValidationResult {
    const errors: string[] = [];

    // Handle both legacy and new format
    const events = config.events || [];
    const mode = config.mode || "single";

    if (events.length === 0) {
      // Try legacy format
      if (!config.contractAddress || !config.eventName) {
        errors.push("At least one event must be configured");
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(config.contractAddress)) {
        errors.push("Invalid contract address format");
      }
    } else {
      // Validate each event in new format
      events.forEach((event, index) => {
        if (!event.contractAddress) {
          errors.push(`Event ${index + 1}: Contract address is required`);
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(event.contractAddress)) {
          errors.push(`Event ${index + 1}: Invalid contract address format`);
        }

        if (!event.eventName) {
          errors.push(`Event ${index + 1}: Event name is required`);
        }

        // Validate filters
        event.filters?.forEach((filter, fIndex) => {
          if (!filter.parameter || !filter.operator) {
            errors.push(
              `Event ${index + 1}, Filter ${
                fIndex + 1
              }: Invalid filter configuration`
            );
          }
        });
      });
    }

    if (!config.chainId) {
      errors.push("Chain selection is required");
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
          description: "The smart contract address to monitor",
        },
        {
          name: "eventName",
          label: "Event Name",
          type: "text",
          placeholder: "Transfer",
          required: true,
          description:
            "The event name to listen for (e.g., Transfer, Approval)",
        },
        {
          name: "chainId",
          label: "Blockchain Network",
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

export const onchainTrigger = new OnchainTrigger();
