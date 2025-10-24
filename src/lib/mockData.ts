import { AnalyticsData, Hook, HookRun, Template, TriggerType } from "./types";

// Generate mock hooks
export const mockHooks: Hook[] = [
  {
    id: "hook-1",
    userId: "user-1",
    name: "Whale Alert Notifier",
    description: "Get notified when large USDC transfers occur",
    triggerType: "ONCHAIN" as TriggerType,
    triggerConfig: {
      type: "ONCHAIN",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      eventName: "Transfer",
      chainId: 1,
    },
    actionConfig: {
      type: "TELEGRAM",
      botToken: "mock-token",
      chatId: "mock-chat-id",
      messageTemplate: "🐋 Large transfer detected: {amount} USDC",
    },
    actions: [
      {
        id: "action-1",
        order: 0,
        type: "TELEGRAM",
        config: {
          type: "TELEGRAM",
          botToken: "mock-token",
          chatId: "mock-chat-id",
          messageTemplate: "🐋 Large transfer detected: {amount} USDC",
        },
        isExpanded: false,
        isValid: true,
        errors: [],
        customName: "Whale Alert",
        defaultName: "Action 1",
      },
    ],
    status: "ACTIVE",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    lastExecutedAt: new Date("2024-01-23"),
  },
  {
    id: "hook-2",
    userId: "user-1",
    name: "Daily Portfolio Summary",
    description: "Receive daily updates on your wallet balance",
    triggerType: "CRON" as TriggerType,
    triggerConfig: {
      type: "CRON",
      cronExpression: "0 9 * * *",
      timezone: "UTC",
    },
    actionConfig: {
      type: "TELEGRAM",
      messageTemplate: "📊 Your portfolio value: ${value}",
    },
    actions: [
      {
        id: "action-2",
        order: 0,
        type: "TELEGRAM",
        config: {
          type: "TELEGRAM",
          messageTemplate: "📊 Your portfolio value: ${value}",
        },
        isExpanded: false,
        isValid: true,
        errors: [],
        customName: "Portfolio Summary",
        defaultName: "Action 1",
      },
    ],
    status: "ACTIVE",
    isActive: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    lastExecutedAt: new Date("2024-01-23"),
  },
];

// Generate mock runs
export const mockRuns: HookRun[] = [
  {
    id: "run-1",
    hookId: "hook-1",
    status: "SUCCESS",
    triggeredAt: new Date("2024-01-23T10:30:00"),
    completedAt: new Date("2024-01-23T10:30:05"),
    meta: { amount: "1000000", from: "0x123...", to: "0x456..." },
  },
  {
    id: "run-2",
    hookId: "hook-1",
    status: "SUCCESS",
    triggeredAt: new Date("2024-01-23T08:15:00"),
    completedAt: new Date("2024-01-23T08:15:03"),
    meta: { amount: "500000", from: "0x789...", to: "0xabc..." },
  },
];

// Generate mock templates
export const mockTemplates: Template[] = [
  {
    id: "template-1",
    name: "NFT Sale Notifier",
    description: "Get notified when an NFT from your collection is sold",
    category: "NFTs",
    triggerConfig: {
      type: "ONCHAIN",
      contractAddress: "0x...",
      eventName: "Transfer",
    },
    actionConfig: {
      type: "TELEGRAM",
      messageTemplate: "🎨 NFT #{tokenId} sold for {price} ETH",
    },
    popularity: 250,
    createdAt: new Date("2024-01-01"),
  },
];

// Mock analytics
export const mockAnalytics: AnalyticsData = {
  totalHooks: 12,
  activeHooks: 8,
  totalRuns: 1523,
  successRate: 98.5,
  recentActivity: mockRuns,
};

// Utility to generate more mock data
export function generateMockHook(overrides?: Partial<Hook>): Hook {
  return {
    id: `hook-${Date.now()}`,
    userId: "user-1",
    name: "New Hook",
    triggerType: "ONCHAIN",
    triggerConfig: { type: "ONCHAIN" },
    actionConfig: { type: "TELEGRAM" },
    actions: [
      {
        id: `action-${Date.now()}`,
        order: 0,
        type: "TELEGRAM",
        config: { type: "TELEGRAM" },
        isExpanded: false,
        isValid: false,
        errors: [],
        defaultName: "Action 1",
      },
    ],
    status: "ACTIVE",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

