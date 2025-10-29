/**
 * Centralized configuration management for environment variables
 * This file provides a single source of truth for all environment variables
 * and includes validation to ensure required variables are set.
 */

export interface AppConfig {
  // Database
  database: {
    url: string;
  };

  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };

  // App
  app: {
    url: string;
  };

  // External Services
  alchemy: {
    apiKey: string;
    authToken?: string; // Dashboard API authentication
    appId?: string; // Application ID
    baseUrl: string;
    dashboardApiUrl: string; // Dashboard API URL
    webhookSecret?: string;
  };

  telegram: {
    botToken: string;
  };

  contract: {
    privateKey: string;
    rpcUrl: string;
  };

  webhook: {
    secret: string;
  };

  cron: {
    secret: string;
    url: string;
  };

  // Block Explorer APIs (single API key for all Etherscan-compatible explorers)
  etherscan: {
    apiKey: string;
  };
}

/**
 * Validates and loads environment variables
 */
function loadConfig(): AppConfig {
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    ADMIN_WALLET_PRIVATE_KEY: process.env.ADMIN_WALLET_PRIVATE_KEY,
    CONTRACT_RPC_URL: process.env.CONTRACT_RPC_URL,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
  };

  // Check for missing required variables
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(", ")}`);
    console.warn(
      "Some features may not work properly without these variables."
    );
  }

  return {
    database: {
      url: requiredVars.DATABASE_URL || "",
    },
    supabase: {
      url: requiredVars.NEXT_PUBLIC_SUPABASE_URL || "",
      anonKey: requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      serviceRoleKey: requiredVars.SUPABASE_SERVICE_ROLE_KEY || "",
    },
    app: {
      url: requiredVars.NEXT_PUBLIC_APP_URL || "https://3000.sx100.xyz",
    },
    alchemy: {
      apiKey: requiredVars.ALCHEMY_API_KEY || "",
      authToken: process.env.ALCHEMY_AUTH_TOKEN,
      appId: process.env.ALCHEMY_APP_ID,
      baseUrl:
        process.env.ALCHEMY_BASE_URL || "https://eth-mainnet.g.alchemy.com",
      dashboardApiUrl:
        process.env.ALCHEMY_DASHBOARD_API_URL ||
        "https://dashboard.alchemy.com/api",
      webhookSecret: process.env.ALCHEMY_WEBHOOK_SECRET,
    },
    telegram: {
      botToken: requiredVars.TELEGRAM_BOT_TOKEN || "",
    },
    contract: {
      privateKey: requiredVars.ADMIN_WALLET_PRIVATE_KEY || "",
      rpcUrl: requiredVars.CONTRACT_RPC_URL || "",
    },
    webhook: {
      secret: requiredVars.WEBHOOK_SECRET || "default-webhook-secret",
    },
    cron: {
      secret: requiredVars.CRON_SECRET || "default-cron-secret",
      url:
        requiredVars.NEXT_PUBLIC_APP_URL === "http://localhost:3000"
          ? "https://3000.sx100.xyz"
          : requiredVars.NEXT_PUBLIC_APP_URL || "https://3000.sx100.xyz",
    },
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
  };
}

// Export the loaded configuration
export const config = loadConfig();

// Helper functions for configuration checks
export function isEtherscanConfigured(): boolean {
  return !!config.etherscan.apiKey;
}

export function getEtherscanConfig() {
  return config.etherscan;
}

// Legacy functions for backward compatibility - all use the same API key
export function isBscscanConfigured(): boolean {
  return !!config.etherscan.apiKey;
}

export function isPolygonscanConfigured(): boolean {
  return !!config.etherscan.apiKey;
}

export function isBasescanConfigured(): boolean {
  return !!config.etherscan.apiKey;
}

export function getBscscanConfig() {
  return config.etherscan;
}

export function getPolygonscanConfig() {
  return config.etherscan;
}

export function getBasescanConfig() {
  return config.etherscan;
}

// Helper functions for accessing specific configurations
export const getAlchemyConfig = () => config.alchemy;
export const getTelegramConfig = () => config.telegram;
export const getContractConfig = () => config.contract;
export const getWebhookConfig = () => config.webhook;
export const getCronConfig = () => config.cron;
export const getSupabaseConfig = () => config.supabase;
export const getAppConfig = () => config.app;
export const getDatabaseConfig = () => config.database;

// Validation helpers
export const isAlchemyConfigured = () => !!config.alchemy.apiKey;
export const isTelegramConfigured = () => !!config.telegram.botToken;
export const isContractConfigured = () =>
  !!config.contract.privateKey && !!config.contract.rpcUrl;
export const isWebhookConfigured = () => !!config.webhook.secret;
export const isCronConfigured = () => !!config.cron.secret;
