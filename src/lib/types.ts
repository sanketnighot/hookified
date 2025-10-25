// Core entity types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  supabaseId: string;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
  error?: string;
}

export interface ErrorResponse {
  error: string;
  details?: any;
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
  // CONTRACT_CALL enhancements
  abi?: any[]; // Store fetched ABI
  abiSignature?: string; // Function signature for display
  isNativeTransfer?: boolean; // True for native token transfers
  tokenDecimals?: number; // For ERC-20 transfers
  tokenSymbol?: string; // For ERC-20 transfers
  chainId?: number;
}

// Block-based builder types
export interface ActionBlock {
  id: string;
  order: number;
  type: ActionType;
  config: ActionConfig;
  isExpanded: boolean;
  isValid: boolean;
  errors?: string[];
  customName?: string; // Optional custom name for the action
  defaultName?: string; // Static default name that doesn't change with reordering
}

export interface HookBuilderState {
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  actions: ActionBlock[];
  isValid?: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface BlockValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Hook {
  id: string;
  userId: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  actionConfig: ActionConfig; // Keep for backward compatibility
  actions: ActionBlock[]; // New multi-action support
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

// Blockchain types
export interface ChainInfo {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  testnet?: boolean;
}

export interface ContractInfo {
  address: string;
  name?: string;
  isVerified: boolean;
  compilerVersion?: string;
  sourceCodeUrl?: string;
}

export interface FunctionDefinition {
  name: string;
  type: "function";
  inputs: InputParameter[];
  outputs?: InputParameter[];
  stateMutability: "pure" | "view" | "nonpayable" | "payable";
}

export interface InputParameter {
  name: string;
  type: string;
  internalType?: string;
}

export interface ParsedABI {
  functions: FunctionDefinition[];
  events: any[];
  isERC20: boolean;
  isERC721: boolean;
}

export interface ERC20Metadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
}

export interface NFTMetadata {
  name: string;
  description?: string;
  image?: string;
  attributes?: any[];
}

