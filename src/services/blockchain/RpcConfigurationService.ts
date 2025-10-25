import { createPublicClient, fallback, http } from 'viem';
import { base, baseSepolia, bsc, bscTestnet, mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains';

export interface RpcProvider {
  url: string;
  name: string;
  priority: number;
  timeout: number;
  weight: number;
}

export interface RpcHealthCheck {
  provider: RpcProvider;
  isHealthy: boolean;
  responseTime: number;
  lastChecked: number;
  consecutiveFailures: number;
}

export interface ChainRpcConfig {
  chainId: number;
  chain: any;
  providers: RpcProvider[];
  fallbackProviders: RpcProvider[];
  healthChecks: Map<string, RpcHealthCheck>;
}

export interface RpcConfigurationService {
  getClient(chainId: number): any;
  getHealthyProviders(chainId: number): RpcProvider[];
  performHealthCheck(chainId: number): Promise<void>;
  getHealthStatus(chainId: number): RpcHealthCheck[];
  addCustomProvider(chainId: number, provider: RpcProvider): void;
  removeProvider(chainId: number, providerName: string): void;
}

class RpcConfigurationServiceImpl implements RpcConfigurationService {
  private chainConfigs = new Map<number, ChainRpcConfig>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  constructor() {
    this.initializeChainConfigs();
    this.startHealthChecks();
  }

  private initializeChainConfigs() {
    // Ethereum Mainnet
    this.chainConfigs.set(1, {
      chainId: 1,
      chain: mainnet,
      providers: [
        {
          url: 'https://mainnet.infura.io/v3/',
          name: 'Infura',
          priority: 1,
          timeout: 10000,
          weight: 1,
        },
        {
          url: 'https://eth.llamapr.ee',
          name: 'LlamaRPC',
          priority: 2,
          timeout: 10000,
          weight: 1,
        },
        {
          url: 'https://rpc.ankr.com/eth',
          name: 'Ankr',
          priority: 3,
          timeout: 10000,
          weight: 1,
        },
      ],
      fallbackProviders: [
        {
          url: 'https://ethereum.publicnode.com',
          name: 'PublicNode',
          priority: 4,
          timeout: 15000,
          weight: 0.5,
        },
        {
          url: 'https://eth-mainnet.g.alchemy.com/v2/',
          name: 'Alchemy',
          priority: 5,
          timeout: 10000,
          weight: 1,
        },
      ],
      healthChecks: new Map(),
    });

    // Ethereum Sepolia
    this.chainConfigs.set(11155111, {
      chainId: 11155111,
      chain: sepolia,
      providers: [
        {
          url: 'https://sepolia.infura.io/v3/',
          name: 'Infura',
          priority: 1,
          timeout: 10000,
          weight: 1,
        },
        {
          url: 'https://rpc.sepolia.org',
          name: 'Sepolia',
          priority: 2,
          timeout: 10000,
          weight: 1,
        },
      ],
      fallbackProviders: [
        {
          url: 'https://sepolia.g.alchemy.com/v2/',
          name: 'Alchemy',
          priority: 3,
          timeout: 10000,
          weight: 1,
        },
      ],
      healthChecks: new Map(),
    });

    // BSC Mainnet
    this.chainConfigs.set(56, {
      chainId: 56,
      chain: bsc,
      providers: [
        {
          url: 'https://bsc-dataseed.bnbchain.org',
          name: 'BSC',
          priority: 1,
          timeout: 10000,
          weight: 1,
        },
        {
          url: 'https://bsc-dataseed1.defibit.io',
          name: 'DeFiBit',
          priority: 2,
          timeout: 10000,
          weight: 1,
        },
        {
          url: 'https://bsc-dataseed1.ninicoin.io',
          name: 'Ninicoin',
          priority: 3,
          timeout: 10000,
          weight: 1,
        },
      ],
      fallbackProviders: [
        {
          url: 'https://rpc.ankr.com/bsc',
          name: 'Ankr',
          priority: 4,
          timeout: 10000,
          weight: 1,
        },
      ],
      healthChecks: new Map(),
    });

    // BSC Testnet
    this.chainConfigs.set(97, {
      chainId: 97,
      chain: bscTestnet,
      providers: [
        {
          url: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
          name: 'BSC Testnet',
          priority: 1,
          timeout: 10000,
          weight: 1,
        },
      ],
      fallbackProviders: [],
      healthChecks: new Map(),
    });

    // Polygon Mainnet
    this.chainConfigs.set(137, {
      chainId: 137,
      chain: polygon,
      providers: [
        {
          url: 'https://polygon-rpc.com',
          name: 'Polygon',
          priority: 1,
          timeout: 10000,
          weight: 1,
        },
        {
          url: 'https://rpc.ankr.com/polygon',
          name: 'Ankr',
          priority: 2,
          timeout: 10000,
          weight: 1,
        },
      ],
      fallbackProviders: [
        {
          url: 'https://polygon-mainnet.g.alchemy.com/v2/',
          name: 'Alchemy',
          priority: 3,
          timeout: 10000,
          weight: 1,
        },
      ],
      healthChecks: new Map(),
    });

    // Polygon Amoy
    this.chainConfigs.set(80002, {
      chainId: 80002,
      chain: polygonAmoy,
      providers: [
        {
          url: 'https://rpc-amoy.polygon.technology',
          name: 'Polygon Amoy',
          priority: 1,
          timeout: 10000,
          weight: 1,
        },
      ],
      fallbackProviders: [],
      healthChecks: new Map(),
    });

    // Base Mainnet
    this.chainConfigs.set(8453, {
      chainId: 8453,
      chain: base,
      providers: [
        {
          url: 'https://mainnet.base.org',
          name: 'Base',
          priority: 1,
          timeout: 10000,
          weight: 1,
        },
        {
          url: 'https://base.gateway.tenderly.co',
          name: 'Tenderly',
          priority: 2,
          timeout: 10000,
          weight: 1,
        },
      ],
      fallbackProviders: [
        {
          url: 'https://base-mainnet.g.alchemy.com/v2/',
          name: 'Alchemy',
          priority: 3,
          timeout: 10000,
          weight: 1,
        },
      ],
      healthChecks: new Map(),
    });

    // Base Sepolia
    this.chainConfigs.set(84532, {
      chainId: 84532,
      chain: baseSepolia,
      providers: [
        {
          url: 'https://sepolia.base.org',
          name: 'Base Sepolia',
          priority: 1,
          timeout: 10000,
          weight: 1,
        },
      ],
      fallbackProviders: [],
      healthChecks: new Map(),
    });

    // Initialize health checks for all providers
    this.chainConfigs.forEach((config) => {
      [...config.providers, ...config.fallbackProviders].forEach((provider) => {
        config.healthChecks.set(provider.name, {
          provider,
          isHealthy: true,
          responseTime: 0,
          lastChecked: 0,
          consecutiveFailures: 0,
        });
      });
    });
  }

  getClient(chainId: number): any {
    const config = this.chainConfigs.get(chainId);
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Get healthy providers
    const healthyProviders = this.getHealthyProviders(chainId);

    if (healthyProviders.length === 0) {
      throw new Error(`No healthy RPC providers available for chain ${chainId}`);
    }

    // Create transports with fallback
    const transports = healthyProviders.map((provider) => {
      let url = provider.url;

      // Add API keys if needed
      if (url.includes('infura.io') && process.env.INFURA_API_KEY) {
        url = url.replace('v3/', `v3/${process.env.INFURA_API_KEY}`);
      }
      if (url.includes('alchemy.com') && process.env.ALCHEMY_API_KEY) {
        url = url.replace('v2/', `v2/${process.env.ALCHEMY_API_KEY}`);
      }

      return http(url, {
        timeout: provider.timeout,
        retryCount: 2,
        retryDelay: 1000,
      });
    });

    // Use fallback transport for redundancy
    const transport = fallback(transports, {
      rank: false,
      retryCount: 2,
    });

    return createPublicClient({
      chain: config.chain,
      transport,
    });
  }

  getHealthyProviders(chainId: number): RpcProvider[] {
    const config = this.chainConfigs.get(chainId);
    if (!config) {
      return [];
    }

    const healthyProviders: RpcProvider[] = [];

    // Add healthy primary providers
    config.providers.forEach((provider) => {
      const healthCheck = config.healthChecks.get(provider.name);
      if (healthCheck && healthCheck.isHealthy) {
        healthyProviders.push(provider);
      }
    });

    // Add healthy fallback providers if no primary providers are healthy
    if (healthyProviders.length === 0) {
      config.fallbackProviders.forEach((provider) => {
        const healthCheck = config.healthChecks.get(provider.name);
        if (healthCheck && healthCheck.isHealthy) {
          healthyProviders.push(provider);
        }
      });
    }

    // Sort by priority
    return healthyProviders.sort((a, b) => a.priority - b.priority);
  }

  async performHealthCheck(chainId: number): Promise<void> {
    const config = this.chainConfigs.get(chainId);
    if (!config) {
      return;
    }

    const allProviders = [...config.providers, ...config.fallbackProviders];

    await Promise.allSettled(
      allProviders.map(async (provider) => {
        const healthCheck = config.healthChecks.get(provider.name);
        if (!healthCheck) {
          return;
        }

        const startTime = Date.now();

        try {
          let url = provider.url;

          // Add API keys if needed
          if (url.includes('infura.io') && process.env.INFURA_API_KEY) {
            url = url.replace('v3/', `v3/${process.env.INFURA_API_KEY}`);
          }
          if (url.includes('alchemy.com') && process.env.ALCHEMY_API_KEY) {
            url = url.replace('v2/', `v2/${process.env.ALCHEMY_API_KEY}`);
          }

          const client = createPublicClient({
            chain: config.chain,
            transport: http(url, { timeout: provider.timeout }),
          });

          // Simple health check - get latest block number
          await client.getBlockNumber();

          const responseTime = Date.now() - startTime;

          // Update health check
          healthCheck.isHealthy = true;
          healthCheck.responseTime = responseTime;
          healthCheck.lastChecked = Date.now();
          healthCheck.consecutiveFailures = 0;

        } catch (error) {
          console.warn(`Health check failed for ${provider.name} on chain ${chainId}:`, error);

          // Update health check
          healthCheck.isHealthy = false;
          healthCheck.responseTime = 0;
          healthCheck.lastChecked = Date.now();
          healthCheck.consecutiveFailures += 1;

          // Mark as unhealthy if too many consecutive failures
          if (healthCheck.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            console.error(`Provider ${provider.name} marked as unhealthy after ${this.MAX_CONSECUTIVE_FAILURES} consecutive failures`);
          }
        }
      })
    );
  }

  getHealthStatus(chainId: number): RpcHealthCheck[] {
    const config = this.chainConfigs.get(chainId);
    if (!config) {
      return [];
    }

    return Array.from(config.healthChecks.values());
  }

  addCustomProvider(chainId: number, provider: RpcProvider): void {
    const config = this.chainConfigs.get(chainId);
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Add to fallback providers
    config.fallbackProviders.push(provider);

    // Initialize health check
    config.healthChecks.set(provider.name, {
      provider,
      isHealthy: true,
      responseTime: 0,
      lastChecked: 0,
      consecutiveFailures: 0,
    });
  }

  removeProvider(chainId: number, providerName: string): void {
    const config = this.chainConfigs.get(chainId);
    if (!config) {
      return;
    }

    // Remove from providers
    config.providers = config.providers.filter(p => p.name !== providerName);
    config.fallbackProviders = config.fallbackProviders.filter(p => p.name !== providerName);

    // Remove health check
    config.healthChecks.delete(providerName);
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const chainIds = Array.from(this.chainConfigs.keys());

      await Promise.allSettled(
        chainIds.map(chainId => this.performHealthCheck(chainId))
      );
    }, this.HEALTH_CHECK_INTERVAL);
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Utility methods
  getSupportedChains(): number[] {
    return Array.from(this.chainConfigs.keys());
  }

  getChainConfig(chainId: number): ChainRpcConfig | undefined {
    return this.chainConfigs.get(chainId);
  }

  getProviderStats(chainId: number): {
    total: number;
    healthy: number;
    unhealthy: number;
    avgResponseTime: number;
  } {
    const healthChecks = this.getHealthStatus(chainId);

    const total = healthChecks.length;
    const healthy = healthChecks.filter(h => h.isHealthy).length;
    const unhealthy = total - healthy;
    const avgResponseTime = healthChecks
      .filter(h => h.isHealthy)
      .reduce((sum, h) => sum + h.responseTime, 0) / Math.max(healthy, 1);

    return {
      total,
      healthy,
      unhealthy,
      avgResponseTime,
    };
  }
}

// Export singleton instance
export const rpcConfigurationService = new RpcConfigurationServiceImpl();
