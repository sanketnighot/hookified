import { getEventByName } from "@/lib/blockchain/abiParser";
import {
  computeEventSignature,
  getKnownEventSignature,
} from "@/lib/blockchain/eventSignature";
import {
  buildLogFilterQuery,
  parseGraphQLWebhookResponse,
  TopicFilter,
} from "@/lib/blockchain/graphqlQueryBuilder";
import { getAlchemyConfig, isAlchemyConfigured } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { HookExecutor } from "@/services/execution/HookExecutor";
import { TriggerContext } from "@/services/execution/types";
import axios from "axios";
import { decodeEventLog } from "viem";

export class OnchainEngine {
  private executor = new HookExecutor();

  constructor() {
    if (!isAlchemyConfigured()) {
      console.warn("ALCHEMY_API_KEY not found in environment variables");
    }
  }

  // Register webhook with Alchemy Custom Webhooks (GraphQL)
  async registerWebhook(hook: any): Promise<string | null> {
    if (!isAlchemyConfigured()) {
      throw new Error("Alchemy API key not configured");
    }

    const alchemyConfig = getAlchemyConfig();

    const triggerConfig = hook.triggerConfig as any;
    // Ensure chainId is a number
    const chainId =
      typeof triggerConfig?.chainId === "string"
        ? parseInt(triggerConfig.chainId)
        : triggerConfig?.chainId;
    const events = triggerConfig?.events || [];

    if (!chainId || isNaN(chainId)) {
      throw new Error(
        "Missing or invalid ONCHAIN configuration: chainId must be a valid number"
      );
    }

    // Handle both legacy and new format
    let eventMonitors: any[] = [];
    if (events.length > 0) {
      // New format: multiple events
      eventMonitors = events;
    } else {
      // Legacy format: single event
      const contractAddress = triggerConfig?.contractAddress;
      const eventName = triggerConfig?.eventName;
      if (!contractAddress || !eventName) {
        throw new Error(
          "Missing required ONCHAIN configuration: contractAddress, eventName, chainId"
        );
      }
      eventMonitors = [
        {
          contractAddress,
          eventName,
          abi: triggerConfig?.abi,
          filters: [],
        },
      ];
    }

    try {
      const webhookDomain =
        process.env.NEXT_PUBLIC_APP_URL === "http://localhost:3000"
          ? "https://3000.sx100.xyz"
          : process.env.NEXT_PUBLIC_APP_URL;
      const webhookUrl = `${webhookDomain}/api/webhooks/alchemy/${hook.id}`;

      // Validate webhook URL - Alchemy requires publicly accessible HTTPS URLs
      try {
        const url = new URL(webhookUrl);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          throw new Error(
            `Invalid webhook URL: Alchemy requires a publicly accessible HTTPS URL` +
              `\nCurrent URL: ${webhookUrl}`
          );
        }
        if (
          url.protocol !== "https:" &&
          process.env.NODE_ENV === "production"
        ) {
          throw new Error(
            `Invalid webhook URL: Alchemy requires HTTPS URLs in production. ` +
              `\nCurrent URL: ${webhookUrl}`
          );
        }
      } catch (urlError: any) {
        if (urlError.message.includes("Invalid webhook URL")) {
          throw urlError;
        }
        throw new Error(`Invalid webhook URL format: ${webhookUrl}`);
      }

      // Build GraphQL query for multiple events with filters
      const graphqlQuery = this.buildMultiEventQuery(eventMonitors);

      // Register webhook with Alchemy Dashboard API
      // Using Notify API: https://docs.alchemy.com/reference/notify-api-quickstart
      const authToken = alchemyConfig.authToken;

      if (!authToken) {
        throw new Error(
          "ALCHEMY_AUTH_TOKEN is required for webhook registration"
        );
      }

      // Use Alchemy's Notify API
      // Docs: https://docs.alchemy.com/reference/notify-api-quickstart
      const webhookApiUrl = `${alchemyConfig.dashboardApiUrl}/create-webhook`;

      // Format network name for Alchemy API
      const network = this.getAlchemyNetwork(chainId);
      const networkFormatted = network.replace(/-/g, "_").toUpperCase();

      // Build request with skip_empty_messages to prevent webhooks for empty blocks
      const requestBody = {
        webhook_type: "GRAPHQL",
        webhook_url: webhookUrl,
        network: networkFormatted,
        graphql_query: graphqlQuery,
        skip_empty_messages: true, // Only send webhook when matching events occur
      };

      const headers = {
        "Content-Type": "application/json",
        "X-Alchemy-Token": authToken,
      };

      try {
        // Validate GraphQL query before sending
        if (!graphqlQuery || graphqlQuery.trim().length === 0) {
          throw new Error("GraphQL query cannot be empty");
        }

        // Log request summary (minimal logging)
        console.log(
          `Creating Alchemy webhook for ${networkFormatted} with skip_empty_messages`
        );

        const response = await axios.post(webhookApiUrl, requestBody, {
          headers,
        });

        // Parse the webhook ID from response
        const actualWebhookId =
          response.data?.data?.id ||
          response.data?.id ||
          response.data?.data?.[0]?.id;

        if (!actualWebhookId) {
          throw new Error(
            `Invalid response from Alchemy API - no webhook ID returned`
          );
        }

        // Store webhook ID in database
        await prisma.hook.update({
          where: { id: hook.id },
          data: { alchemyWebhookId: actualWebhookId },
        });

        return actualWebhookId;
      } catch (error: any) {
        console.log("Gettng this error:-", error);
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const errorData = error.response?.data;
          const errorMsg =
            errorData?.message ||
            errorData?.error ||
            JSON.stringify(errorData) ||
            "Unknown error";

          if (status === 401) {
            throw new Error(
              `Authentication failed: ${errorMsg}. Check your ALCHEMY_AUTH_TOKEN in the Alchemy Dashboard.`
            );
          }

          if (status === 400) {
            // Include more details for 400 errors (validation issues)
            const details =
              errorData?.details || errorData?.errors
                ? JSON.stringify(errorData)
                : "";
            throw new Error(
              `Invalid request: ${errorMsg}${details ? ` - ${details}` : ""}`
            );
          }

          if (status === 503 || status === 500) {
            throw new Error(`Alchemy service error: ${errorMsg}`);
          }

          throw new Error(
            `Failed to register webhook (${status}): ${errorMsg}`
          );
        }

        throw error;
      }
    } catch (error) {
      console.log("Gettng this error outside Alchemy registerWebhook:-", error);
      throw error;
    }
  }

  // Unregister webhook when hook is deleted or disabled
  async unregisterWebhook(hook: any): Promise<void> {
    if (!hook.alchemyWebhookId || !isAlchemyConfigured()) {
      return;
    }

    // Skip deletion if this is a placeholder webhook ID (manually set up)
    if (
      hook.alchemyWebhookId.startsWith("manual_setup_") ||
      hook.alchemyWebhookId.startsWith("placeholder_")
    ) {
      console.log(
        `Skipping deletion of placeholder webhook ${hook.alchemyWebhookId} for hook ${hook.id}`
      );
      return;
    }

    const alchemyConfig = getAlchemyConfig();
    const authToken = alchemyConfig.authToken;

    if (!authToken) {
      console.warn(
        "ALCHEMY_AUTH_TOKEN not configured, skipping webhook deletion"
      );
      return;
    }

    try {
      await axios.delete(
        `${alchemyConfig.dashboardApiUrl}/delete-webhook/${hook.alchemyWebhookId}`,
        {
          headers: {
            "X-Alchemy-Token": authToken,
          },
        }
      );
    } catch (error) {
      // Don't throw - cleanup should be best effort
    }
  }

  // Handle incoming webhook from Alchemy
  async handleAlchemyWebhook(hookId: string, webhookData: any): Promise<void> {
    const startTime = Date.now();

    try {
      const hook = await prisma.hook.findUnique({
        where: { id: hookId },
      });

      if (!hook || !hook.isActive || hook.status !== "ACTIVE") {
        console.warn(`Hook ${hookId} not found or not active`);
        return;
      }

      if (hook.triggerType !== "ONCHAIN") {
        console.warn(`Hook ${hookId} is not an ONCHAIN trigger`);
        return;
      }

      // Quick check: Skip processing if no logs in the block
      const logsCount = webhookData.event?.data?.block?.logs?.length || 0;
      if (logsCount === 0) {
        // Empty block - no events to process, skip silently
        return;
      }

      console.log(
        `Processing Alchemy webhook for hook ${hookId} with ${logsCount} log(s)`
      );

      // Extract and decode event data
      const eventData = await this.extractEventData(webhookData, hook);

      console.log(
        `Decoded ${eventData.events?.length || 0} events from webhook`
      );

      // Skip processing if no events decoded
      if (!eventData.events || eventData.events.length === 0) {
        console.log(
          `No matching events found in webhook for hook ${hookId}, skipping execution`
        );
        return;
      }

      // Create trigger context for each event
      const events = eventData.events;

      for (const event of events) {
        const triggerContext: TriggerContext = {
          type: "ONCHAIN",
          data: {
            ...event,
            rawWebhookData: webhookData,
            receivedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        // Execute the hook for this event
        await this.executor.executeHook(hook as any, triggerContext);
      }

      const duration = Date.now() - startTime;
      console.log(
        `Successfully processed Alchemy webhook for hook ${hookId} in ${duration}ms`
      );
    } catch (error) {
      console.error(
        `Error handling Alchemy webhook for hook ${hookId}:`,
        error
      );
      throw error;
    }
  }

  // Build GraphQL query for multiple events with filters
  private buildMultiEventQuery(eventMonitors: any[]): string {
    const addresses = [...new Set(eventMonitors.map((e) => e.contractAddress))];
    const eventSignatures: string[] = [];
    const topicFilters: TopicFilter[] = [];

    // Build event signatures and topic filters
    eventMonitors.forEach((eventMonitor) => {
      const signature = this.getEventSignature(
        eventMonitor.eventName,
        eventMonitor.abi
      );
      eventSignatures.push(signature);

      // Build topic filters from indexed parameter filters
      if (eventMonitor.filters && eventMonitor.filters.length > 0) {
        eventMonitor.filters.forEach((filter: any) => {
          if (filter.indexed && filter.operator === "eq") {
            // Find the topic index for this parameter
            const eventAbi = getEventByName(
              eventMonitor.abi || [],
              eventMonitor.eventName
            );
            if (eventAbi && eventAbi.inputs) {
              let topicIndex = 1; // Topics start at 1 (0 is event signature)
              for (const input of eventAbi.inputs) {
                if (input.indexed && input.name === filter.parameter) {
                  // Ensure value is properly formatted (address should be lowercase)
                  let filterValue = String(filter.value);
                  if (input.type === "address") {
                    filterValue = filterValue.toLowerCase();
                    if (!filterValue.startsWith("0x")) {
                      filterValue = `0x${filterValue.padStart(40, "0")}`;
                    }
                  }

                  topicFilters.push({
                    topicIndex,
                    values: [filterValue],
                  });
                  break;
                }
                if (input.indexed) {
                  topicIndex++;
                }
              }
            }
          }
        });
      }
    });

    return buildLogFilterQuery({
      addresses,
      eventSignatures,
      topicFilters,
      includeTransactionDetails: true,
      includeBlockDetails: true,
    });
  }

  // Extract relevant event data from Alchemy webhook
  private async extractEventData(webhookData: any, hook: any): Promise<any> {
    // Parse GraphQL webhook response
    const parsedData = parseGraphQLWebhookResponse(webhookData);
    const logs = parsedData.logs || [];
    const triggerConfig = hook.triggerConfig as any;
    const events = triggerConfig?.events || [];

    // Handle both legacy and new format
    let eventMonitors: any[] = [];
    if (events.length > 0) {
      eventMonitors = events;
    } else {
      // Legacy format
      if (triggerConfig?.contractAddress && triggerConfig?.eventName) {
        eventMonitors = [
          {
            contractAddress: triggerConfig.contractAddress,
            eventName: triggerConfig.eventName,
            abi: triggerConfig.abi,
            filters: [],
          },
        ];
      }
    }

    // Decode and filter events
    const decodedEvents = logs
      .map((log: any) => this.decodeLog(log, eventMonitors, parsedData))
      .filter(
        (event: any) => event && this.matchesFilters(event, eventMonitors)
      );

    return {
      events: decodedEvents,
      rawWebhookData: webhookData,
    };
  }

  // Decode a single log entry
  private decodeLog(log: any, eventMonitors: any[], parsedData: any): any {
    // Extract address from log (Alchemy uses account.address)
    const logAddress = log.account?.address || log.address;
    if (!logAddress) {
      return null;
    }

    // Find matching event monitor by address
    const monitor = eventMonitors.find(
      (m) => m.contractAddress?.toLowerCase() === logAddress.toLowerCase()
    );

    if (!monitor) {
      return null;
    }

    // Try to decode with ABI if available
    if (monitor.abi && monitor.abi.length > 0) {
      const eventAbi = getEventByName(monitor.abi, monitor.eventName);
      if (eventAbi) {
        try {
          const decoded = decodeEventLog({
            abi: [eventAbi],
            data: log.data,
            topics: log.topics,
          }) as {
            eventName: string;
            args: any;
          };

          return {
            eventName: decoded.eventName || monitor.eventName,
            args: decoded.args,
            transactionHash: log.transactionHash,
            blockNumber: parsedData.blockNumber,
            blockHash: parsedData.blockHash,
            timestamp: parsedData.timestamp,
            address: logAddress,
          };
        } catch (error) {
          console.error("Error decoding event log:", error);
        }
      }
    }

    // Fallback: return raw log
    return {
      eventName: monitor.eventName,
      transactionHash: log.transactionHash,
      blockNumber: parsedData.blockNumber,
      blockHash: parsedData.blockHash,
      timestamp: parsedData.timestamp,
      address: logAddress,
      topics: log.topics,
      data: log.data,
    };
  }

  // Check if event matches configured filters
  private matchesFilters(event: any, eventMonitors: any[]): boolean {
    // Find matching event monitor
    const monitor = eventMonitors.find(
      (m) =>
        m.contractAddress?.toLowerCase() === event.address?.toLowerCase() &&
        m.eventName === event.eventName
    );

    if (!monitor || !monitor.filters || monitor.filters.length === 0) {
      return true; // No filters = match all
    }

    // Apply filters
    return monitor.filters.every((filter: any) => {
      const paramValue = event.args?.[filter.parameter];
      return this.applyFilter(paramValue, filter);
    });
  }

  // Apply a single filter to a value
  private applyFilter(value: any, filter: any): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    try {
      switch (filter.operator) {
        case "eq":
          return (
            value?.toString().toLowerCase() ===
            filter.value.toString().toLowerCase()
          );
        case "ne":
          return (
            value?.toString().toLowerCase() !==
            filter.value.toString().toLowerCase()
          );
        case "gt":
          return BigInt(value) > BigInt(filter.value);
        case "lt":
          return BigInt(value) < BigInt(filter.value);
        case "gte":
          return BigInt(value) >= BigInt(filter.value);
        case "lte":
          return BigInt(value) <= BigInt(filter.value);
        case "contains":
          return value
            ?.toString()
            .toLowerCase()
            .includes(filter.value.toString().toLowerCase());
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  // Get event signature hash using viem
  private getEventSignature(
    eventName: string,
    abi?: any[],
    params?: string[]
  ): string {
    // If ABI is provided, extract exact event parameters from it
    if (abi && abi.length > 0) {
      const eventDef = getEventByName(abi, eventName);
      if (eventDef && eventDef.inputs) {
        const paramTypes = eventDef.inputs.map((input: any) => input.type);
        return computeEventSignature(eventName, paramTypes);
      }
    }

    // Try known event signatures first
    const knownSignature = getKnownEventSignature(eventName);
    if (knownSignature) {
      return knownSignature;
    }

    // Compute event signature from event name and params
    // For standard events, infer common parameters
    if (!params) {
      // Try to infer parameters based on event name
      if (eventName.toLowerCase().includes("transfer")) {
        return computeEventSignature(eventName, [
          "address",
          "address",
          "uint256",
        ]);
      }
      if (eventName.toLowerCase().includes("approval")) {
        return computeEventSignature(eventName, [
          "address",
          "address",
          "uint256",
        ]);
      }
    }

    return computeEventSignature(eventName, params);
  }

  // Map chain ID to Alchemy network
  private getAlchemyNetwork(chainId: number): string {
    const networks: { [key: number]: string } = {
      1: "eth-mainnet",
      11155111: "eth-sepolia",
      137: "polygon-mainnet",
      80002: "polygon-amoy",
      56: "bsc-mainnet",
      97: "bsc-testnet",
      42161: "arb-mainnet",
      10: "opt-mainnet",
      8453: "base-mainnet",
      84532: "base-sepolia",
    };

    const network = networks[chainId];
    if (!network) {
      console.warn(
        `Unknown chain ID ${chainId}, defaulting to eth-mainnet for Alchemy webhook`
      );
      return "eth-mainnet";
    }

    return network;
  }

  // Validate ONCHAIN configuration
  static validateOnchainConfig(config: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.contractAddress) {
      errors.push("Contract address is required");
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(config.contractAddress)) {
      errors.push("Invalid contract address format");
    }

    if (!config.eventName) {
      errors.push("Event name is required");
    }

    if (!config.chainId) {
      errors.push("Chain ID is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
