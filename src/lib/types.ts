// Core entity types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export type TriggerType = "ONCHAIN" | "CRON" | "MANUAL" | "WEBHOOK";
export type ActionType = "TELEGRAM" | "WEBHOOK" | "CHAIN" | "CONTRACT_CALL";
export type HookStatus = "ACTIVE" | "PAUSED" | "ERROR";
export type RunStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface TriggerConfig {
  type: TriggerType;
  // For ONCHAIN
  contractAddress?: string;
  eventName?: string;
  chainId?: number;
  // For CRON
  cronExpression?: string;
  timezone?: string;
  // For WEBHOOK
  webhookUrl?: string;
}

export interface ActionConfig {
  type: ActionType;
  // For TELEGRAM
  botToken?: string;
  chatId?: string;
  messageTemplate?: string;
  // For WEBHOOK
  webhookUrl?: string;
  method?: "GET" | "POST" | "PUT";
  headers?: Record<string, string>;
  // For CONTRACT_CALL
  contractAddress?: string;
  functionName?: string;
  parameters?: any[];
}

export interface Hook {
  id: string;
  userId: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  actionConfig: ActionConfig;
  status: HookStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
}

export interface HookRun {
  id: string;
  hookId: string;
  status: RunStatus;
  triggeredAt: Date;
  completedAt?: Date;
  error?: string;
  meta?: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerConfig: TriggerConfig;
  actionConfig: ActionConfig;
  popularity: number;
  createdAt: Date;
}

export interface AnalyticsData {
  totalHooks: number;
  activeHooks: number;
  totalRuns: number;
  successRate: number;
  recentActivity: HookRun[];
}

