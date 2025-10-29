/**
 * GraphQL Query Builder for Alchemy Custom Webhooks
 * Generates GraphQL queries to filter blockchain events
 */

export interface TopicFilter {
  topicIndex: number; // 1, 2, or 3 (0 is event signature)
  values: string[]; // Possible values for this topic
}

export interface GraphQLQueryOptions {
  addresses?: string[];
  eventSignatures?: string[];
  topicFilters?: TopicFilter[]; // New: for indexed parameter filtering
  fromAddresses?: string[];
  toAddresses?: string[];
  includeTransactionDetails?: boolean;
  includeBlockDetails?: boolean;
}

/**
 * Build a GraphQL query for filtering logs/events
 * Used for Alchemy Custom Webhooks
 */
export function buildTopicsArray(eventSignatures: string[], topicFilters?: TopicFilter[]): (string | string[] | null)[] {
  const topics: (string | string[] | null)[] = [];

  // Topic 0: Event signatures
  if (eventSignatures.length > 0) {
    topics.push(eventSignatures.length === 1 ? eventSignatures[0] : eventSignatures);
  } else {
    topics.push(null);
  }

  // Topics 1-3: Indexed parameters
  const topicMap = new Map<number, Set<string>>();
  topicFilters?.forEach(filter => {
    if (!topicMap.has(filter.topicIndex)) {
      topicMap.set(filter.topicIndex, new Set());
    }
    filter.values.forEach(value => topicMap.get(filter.topicIndex)!.add(value));
  });

  for (let i = 1; i <= 3; i++) {
    if (topicMap.has(i)) {
      const values = Array.from(topicMap.get(i)!);
      topics.push(values.length === 1 ? values[0] : values);
    } else {
      topics.push(null);
    }
  }

  return topics;
}

export function buildLogFilterQuery(options: GraphQLQueryOptions = {}): string {
  const {
    addresses = [],
    eventSignatures = [],
    topicFilters = [],
    fromAddresses = [],
    toAddresses = [],
    includeTransactionDetails = true,
    includeBlockDetails = true,
  } = options;

  // Build the filter object
  const filters: string[] = [];

  if (addresses.length > 0) {
    const addressesStr = addresses.map((addr) => `"${addr}"`).join(", ");
    filters.push(`addresses: [${addressesStr}]`);
  }

  // Build topics array with indexed parameter filters
  // Alchemy supports topics as [eventSig, topic1, topic2, topic3] with nulls for wildcards
  // We include indexed parameter filters here to reduce webhook volume
  if (eventSignatures.length > 0) {
    const topics = buildTopicsArray(eventSignatures, topicFilters);

    const formatTopicItem = (item: string | string[] | null): string => {
      if (item === null) return "null";
      if (Array.isArray(item)) {
        return `[${item.map((v) => `"${v}"`).join(", ")}]`;
      }
      return `"${item}"`;
    };

    const topicsStr = `[${topics.map(formatTopicItem).join(", ")}]`;
    filters.push(`topics: ${topicsStr}`);
  }

  const filterStr = filters.length > 0 ? `filter: {${filters.join(", ")}}` : "";

  // Build the query structure to match Alchemy's UI format exactly
  // This format ensures Alchemy only sends webhooks when matching logs exist
  let query = "{\n  block {\n";
  query += "    hash,\n    number,\n    timestamp,\n";

  // Build logs query with filter - this is critical for skip_empty_messages to work
  query += `    logs(${filterStr || "filter: {}"}) {\n`;
  query += "      data,\n      topics,\n      index,\n";
  query += "      account {\n        address\n      }";

  if (includeTransactionDetails) {
    query += ",\n      transaction {\n";
    query += "        hash,\n        nonce,\n        index,\n";
    query += "        from {\n          address\n        },\n";
    query += "        to {\n          address\n        },\n";
    query += "        value,\n        gasPrice,\n";
    query += "        maxFeePerGas,\n        maxPriorityFeePerGas,\n";
    query += "        gas,\n        status,\n        gasUsed,\n";
    query += "        cumulativeGasUsed,\n        effectiveGasPrice,\n";
    query += "        createdContract {\n          address\n        }\n";
    query += "      }\n";
  }

  query += "    }\n  }\n}";

  return query;
}

/**
 * Build a GraphQL query for monitoring specific contract events
 * This is the recommended structure for Alchemy Custom Webhooks
 */
export function buildEventMonitorQuery(contractAddress: string, eventSignature: string): string {
  return buildLogFilterQuery({
    addresses: [contractAddress],
    eventSignatures: [eventSignature],
    includeTransactionDetails: true,
    includeBlockDetails: true,
  });
}

/**
 * Build a GraphQL query for monitoring all events from a contract
 */
export function buildContractMonitorQuery(contractAddress: string): string {
  return buildLogFilterQuery({
    addresses: [contractAddress],
    includeTransactionDetails: true,
    includeBlockDetails: true,
  });
}

/**
 * Build a GraphQL query for monitoring transfers to/from specific addresses
 */
export function buildTransferMonitorQuery(
  eventSignature: string,
  fromAddresses?: string[],
  toAddresses?: string[]
): string {
  const filters: string[] = [];

  if (eventSignature) {
    filters.push(`topics: ["${eventSignature}"]`);
  }

  // Note: Custom Webhooks GraphQL may not support direct filtering by from/to addresses
  // These would need to be filtered in the webhook handler or query can be extended
  // based on Alchemy's actual GraphQL schema capabilities

  let query = `
    {
      block {
        number
        hash
        timestamp
        logs (${filters.join(', ')}) {
          topics
          data
          transactionHash
          address
          transaction {
            hash
            from {
              address
            }
            to {
              address
            }
            value
            gas
            gasPrice
          }
        }
      }
    }
  `;

  return query.trim();
}

/**
 * Parse GraphQL query response from Alchemy webhook
 */
export function parseGraphQLWebhookResponse(webhookData: any): any {
  // Alchemy webhook structure varies, but typically includes:
  // webhookData.event.data.block contains the block data

  if (!webhookData.event?.data?.block) {
    return {
      logs: [],
      blockNumber: null,
      blockHash: null,
      timestamp: null,
    };
  }

  const block = webhookData.event.data.block;

  // Extract logs and normalize address format
  const logs = (block.logs || []).map((log: any) => ({
    ...log,
    // Ensure we have address - Alchemy uses account.address
    address: log.account?.address || log.address,
  }));

  return {
    logs,
    blockNumber: block.number,
    blockHash: block.hash,
    timestamp: block.timestamp,
  };
}

