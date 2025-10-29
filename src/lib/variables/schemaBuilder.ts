/**
 * Build variable schema from hook configuration
 */

import { VariableContextData, VariableTreeNode } from '@/components/hook-builder/VariableInput/types';
import { ActionConfig, ActionType, TriggerConfig, TriggerType } from '@/lib/types';

/**
 * Build complete variable schema from hook context
 */
export function buildVariableSchema(context: VariableContextData): VariableTreeNode[] {
  const nodes: VariableTreeNode[] = [];

  // Add trigger variables
  if (context.triggerType) {
    const triggerNodes = buildTriggerVariables(
      context.triggerType as TriggerType,
      context.triggerConfig
    );
    nodes.push(...triggerNodes);
  }

  // Add action variables (only previous actions)
  if (context.currentActionIndex !== undefined) {
    for (let i = 0; i < context.currentActionIndex && i < context.actions.length; i++) {
      const action = context.actions[i];
      const actionNodes = buildActionVariables(
        action.type as ActionType,
        action.config,
        i,
        action.customName || `Action ${i + 1}`
      );
      nodes.push(...actionNodes);
    }
  }

  // Add built-in variables
  nodes.push(...buildBuiltInVariables());

  return nodes;
}

/**
 * Build trigger variable tree
 */
function buildTriggerVariables(
  triggerType: TriggerType,
  triggerConfig?: TriggerConfig
): VariableTreeNode[] {
  switch (triggerType) {
    case 'ONCHAIN':
      return buildOnchainTriggerVariables(triggerConfig);
    case 'WEBHOOK':
      return buildWebhookTriggerVariables();
    case 'CRON':
      return buildCronTriggerVariables();
    case 'MANUAL':
      return buildManualTriggerVariables();
    default:
      return [];
  }
}

/**
 * Build ONCHAIN trigger variables from ABI
 */
function buildOnchainTriggerVariables(config?: TriggerConfig): VariableTreeNode[] {
  const nodes: VariableTreeNode[] = [];

  // Main trigger node
  const triggerNode: VariableTreeNode = {
    id: 'trigger',
    name: 'Trigger Data',
    path: 'trigger',
    type: 'object',
    isLeaf: false,
    source: 'trigger',
    icon: '📡',
    children: [
      {
        id: 'trigger.event',
        name: 'Event',
        path: 'trigger.event',
        type: 'object',
        isLeaf: false,
        source: 'trigger',
        children: [
          {
            id: 'trigger.event.args',
            name: 'Arguments',
            path: 'trigger.event.args',
            type: 'object',
            isLeaf: false,
            source: 'trigger',
            children: buildEventArgs(config),
          },
          {
            id: 'trigger.event.transaction',
            name: 'Transaction',
            path: 'trigger.event.transaction',
            type: 'object',
            isLeaf: false,
            source: 'trigger',
            children: [
              {
                id: 'trigger.event.transaction.hash',
                name: 'Hash',
                path: 'trigger.event.transaction.hash',
                type: 'string',
                isLeaf: true,
                source: 'trigger',
                description: 'Transaction hash',
              },
              {
                id: 'trigger.event.transaction.blockNumber',
                name: 'Block Number',
                path: 'trigger.event.transaction.blockNumber',
                type: 'number',
                isLeaf: true,
                source: 'trigger',
                description: 'Block number',
              },
            ],
          },
          {
            id: 'trigger.event.address',
            name: 'Contract Address',
            path: 'trigger.event.address',
            type: 'string',
            isLeaf: true,
            source: 'trigger',
            description: 'Contract address that emitted the event',
          },
        ],
      },
    ],
  };

  nodes.push(triggerNode);
  return nodes;
}

/**
 * Build event arguments from ABI
 */
function buildEventArgs(config?: TriggerConfig): VariableTreeNode[] {
  const args: VariableTreeNode[] = [];

  // Try to extract from config ABI
  const events = (config as any)?.events || [];
  const mode = (config as any)?.mode || 'single';

  if (mode === 'single' && (config as any)?.abi) {
    const abi = (config as any).abi;
    const eventName = (config as any).eventName;

    // Find event in ABI
    const eventAbi = abi.find(
      (item: any) => item.type === 'event' && item.name === eventName
    );

    if (eventAbi && eventAbi.inputs) {
      eventAbi.inputs.forEach((input: any, index: number) => {
        args.push({
          id: `trigger.event.args.${input.name}`,
          name: input.name || `arg${index}`,
          path: `trigger.event.args.${input.name || `arg${index}`}`,
          type: mapAbiTypeToVarType(input.type),
          isLeaf: true,
          source: 'trigger',
          description: input.name,
        });
      });
    }
  } else if (mode === 'multi' && events.length > 0) {
    // For multi-event mode, use first event as example
    const firstEvent = events[0];
    if (firstEvent.abi && firstEvent.abi.length > 0) {
      const eventAbi = firstEvent.abi.find((item: any) => item.type === 'event');
      if (eventAbi && eventAbi.inputs) {
        eventAbi.inputs.forEach((input: any, index: number) => {
          args.push({
            id: `trigger.event.args.${input.name || `arg${index}`}`,
            name: input.name || `Argument ${index + 1}`,
            path: `trigger.event.args.${input.name || `arg${index}`}`,
            type: mapAbiTypeToVarType(input.type),
            isLeaf: true,
            source: 'trigger',
            description: input.name,
          });
        });
      }
    }
  }

  // Fallback: Add common event args
  if (args.length === 0) {
    args.push(
      {
        id: 'trigger.event.args.from',
        name: 'From',
        path: 'trigger.event.args.from',
        type: 'string',
        isLeaf: true,
        source: 'trigger',
        description: 'From address',
      },
      {
        id: 'trigger.event.args.to',
        name: 'To',
        path: 'trigger.event.args.to',
        type: 'string',
        isLeaf: true,
        source: 'trigger',
        description: 'To address',
      },
      {
        id: 'trigger.event.args.value',
        name: 'Value',
        path: 'trigger.event.args.value',
        type: 'string',
        isLeaf: true,
        source: 'trigger',
        description: 'Transfer value',
      }
    );
  }

  return args;
}

/**
 * Map ABI type to variable type
 */
function mapAbiTypeToVarType(abiType: string): 'string' | 'number' | 'boolean' | 'object' | 'array' | 'unknown' {
  if (abiType.includes('uint') || abiType.includes('int')) {
    return 'number';
  } else if (abiType === 'bool') {
    return 'boolean';
  } else if (abiType.includes('[]') || abiType.includes('[')) {
    return 'array';
  } else if (abiType === 'address' || abiType.includes('string') || abiType.includes('bytes')) {
    return 'string';
  }
  return 'string'; // Default
}

/**
 * Build WEBHOOK trigger variables
 */
function buildWebhookTriggerVariables(): VariableTreeNode[] {
  return [
    {
      id: 'trigger',
      name: 'Trigger Data',
      path: 'trigger',
      type: 'object',
      isLeaf: false,
      source: 'trigger',
      icon: '📡',
      children: [
        {
          id: 'trigger.webhookPayload',
          name: 'Webhook Payload',
          path: 'trigger.webhookPayload',
          type: 'object',
          isLeaf: false,
          source: 'trigger',
          description: 'Full webhook request body',
        },
        {
          id: 'trigger.headers',
          name: 'Headers',
          path: 'trigger.headers',
          type: 'object',
          isLeaf: false,
          source: 'trigger',
          description: 'Request headers',
        },
        {
          id: 'trigger.timestamp',
          name: 'Timestamp',
          path: 'trigger.timestamp',
          type: 'string',
          isLeaf: true,
          source: 'trigger',
          description: 'Request timestamp',
        },
      ],
    },
  ];
}

/**
 * Build CRON trigger variables
 */
function buildCronTriggerVariables(): VariableTreeNode[] {
  return [
    {
      id: 'trigger',
      name: 'Trigger Data',
      path: 'trigger',
      type: 'object',
      isLeaf: false,
      source: 'trigger',
      icon: '📡',
      children: [
        {
          id: 'trigger.cronExpression',
          name: 'Cron Expression',
          path: 'trigger.cronExpression',
          type: 'string',
          isLeaf: true,
          source: 'trigger',
          description: 'Schedule expression',
        },
        {
          id: 'trigger.scheduledAt',
          name: 'Scheduled At',
          path: 'trigger.scheduledAt',
          type: 'string',
          isLeaf: true,
          source: 'trigger',
          description: 'Current execution time',
        },
      ],
    },
  ];
}

/**
 * Build MANUAL trigger variables
 */
function buildManualTriggerVariables(): VariableTreeNode[] {
  return [
    {
      id: 'trigger',
      name: 'Trigger Data',
      path: 'trigger',
      type: 'object',
      isLeaf: false,
      source: 'trigger',
      icon: '📡',
      children: [
        {
          id: 'trigger.triggeredBy',
          name: 'Triggered By',
          path: 'trigger.triggeredBy',
          type: 'string',
          isLeaf: true,
          source: 'trigger',
          description: 'User ID who triggered',
        },
        {
          id: 'trigger.triggeredAt',
          name: 'Triggered At',
          path: 'trigger.triggeredAt',
          type: 'string',
          isLeaf: true,
          source: 'trigger',
          description: 'Trigger timestamp',
        },
      ],
    },
  ];
}

/**
 * Build action variable tree
 */
function buildActionVariables(
  actionType: ActionType,
  actionConfig?: ActionConfig,
  actionIndex: number = 0,
  actionName?: string
): VariableTreeNode[] {
  const nodes: VariableTreeNode[] = [];

  // Use actions[0] format for main path (backend supports this)
  const actionPath = `actions[${actionIndex}]`;

  const baseNode: VariableTreeNode = {
    id: actionPath,
    name: actionName || `Action ${actionIndex + 1}`,
    path: actionPath,
    type: 'object',
    isLeaf: false,
    source: 'action',
    sourceIndex: actionIndex,
    icon: '🔗',
    children: [
      {
        id: `${actionPath}.result`,
        name: 'Result',
        path: `${actionPath}.result`,
        type: 'object',
        isLeaf: false,
        source: 'action',
        sourceIndex: actionIndex,
        children: buildActionResultVariables(actionType, actionIndex),
      },
      {
        id: `${actionPath}.status`,
        name: 'Status',
        path: `${actionPath}.status`,
        type: 'string',
        isLeaf: true,
        source: 'action',
        sourceIndex: actionIndex,
        description: 'Execution status (SUCCESS/FAILED)',
      },
    ],
  };

  nodes.push(baseNode);
  return nodes;
}

/**
 * Build action result variables based on action type
 */
function buildActionResultVariables(actionType: ActionType, actionIndex: number = 0): VariableTreeNode[] {
  const basePath = `actions[${actionIndex}].result`;

  switch (actionType) {
    case 'TELEGRAM':
      return [
        {
          id: `${basePath}.messageId`,
          name: 'Message ID',
          path: `${basePath}.messageId`,
          type: 'number',
          isLeaf: true,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'Telegram message ID',
        },
        {
          id: `${basePath}.chatId`,
          name: 'Chat ID',
          path: `${basePath}.chatId`,
          type: 'string',
          isLeaf: true,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'Chat ID where message was sent',
        },
      ];

    case 'WEBHOOK':
      return [
        {
          id: `${basePath}.status`,
          name: 'Status Code',
          path: `${basePath}.status`,
          type: 'number',
          isLeaf: true,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'HTTP status code',
        },
        {
          id: `${basePath}.body`,
          name: 'Response Body',
          path: `${basePath}.body`,
          type: 'object',
          isLeaf: false,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'Response body (structure depends on API)',
        },
        {
          id: `${basePath}.headers`,
          name: 'Response Headers',
          path: `${basePath}.headers`,
          type: 'object',
          isLeaf: false,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'HTTP response headers',
        },
      ];

    case 'CONTRACT_CALL':
      return [
        {
          id: `${basePath}.transactionHash`,
          name: 'Transaction Hash',
          path: `${basePath}.transactionHash`,
          type: 'string',
          isLeaf: true,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'Blockchain transaction hash',
        },
        {
          id: `${basePath}.status`,
          name: 'Status',
          path: `${basePath}.status`,
          type: 'string',
          isLeaf: true,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'Transaction status',
        },
        {
          id: `${basePath}.returnValue`,
          name: 'Return Value',
          path: `${basePath}.returnValue`,
          type: 'unknown',
          isLeaf: true,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'Function return value',
        },
      ];

    default:
      return [
        {
          id: basePath,
          name: 'Result',
          path: basePath,
          type: 'object',
          isLeaf: false,
          source: 'action',
          sourceIndex: actionIndex,
          description: 'Action result data',
        },
      ];
  }
}

/**
 * Build built-in variables
 */
function buildBuiltInVariables(): VariableTreeNode[] {
  return [
    {
      id: 'builtin',
      name: 'Built-in Variables',
      path: '',
      type: 'object',
      isLeaf: false,
      source: 'builtin',
      icon: '⚡',
      children: [
        {
          id: 'hookId',
          name: 'Hook ID',
          path: 'hookId',
          type: 'string',
          isLeaf: true,
          source: 'builtin',
          description: 'Current hook ID',
        },
        {
          id: 'runId',
          name: 'Run ID',
          path: 'runId',
          type: 'string',
          isLeaf: true,
          source: 'builtin',
          description: 'Current execution run ID',
        },
        {
          id: 'timestamp',
          name: 'Timestamp',
          path: 'timestamp',
          type: 'string',
          isLeaf: true,
          source: 'builtin',
          description: 'Current timestamp (ISO format)',
        },
      ],
    },
  ];
}

