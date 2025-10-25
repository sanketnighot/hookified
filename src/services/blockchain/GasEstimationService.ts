import { getChainById } from '@/lib/blockchain/chainConfig';
import { createPublicClient, formatEther, http, parseEther } from 'viem';
import { base, baseSepolia, bsc, bscTestnet, mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains';

export interface GasPrice {
  slow: bigint;
  standard: bigint;
  fast: bigint;
  instant: bigint;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCost: bigint;
  costInUSD?: number;
}

export interface GasEstimationResult {
  estimate: GasEstimate;
  priceLevel: 'slow' | 'standard' | 'fast' | 'instant';
  confidence: 'low' | 'medium' | 'high';
  warnings: string[];
}

export interface GasEstimationService {
  getGasPrices(chainId: number): Promise<GasPrice>;
  estimateGasForTransaction(
    chainId: number,
    transaction: {
      to?: `0x${string}`;
      value?: bigint;
      data?: `0x${string}`;
      from?: `0x${string}`;
    },
    priceLevel?: 'slow' | 'standard' | 'fast' | 'instant'
  ): Promise<GasEstimationResult>;
  getGasCostInUSD(chainId: number, gasCost: bigint): Promise<number>;
}

class GasEstimationServiceImpl implements GasEstimationService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  private getChainConfig(chainId: number) {
    const chainMap: Record<number, any> = {
      1: mainnet,
      11155111: sepolia,
      56: bsc,
      97: bscTestnet,
      137: polygon,
      80002: polygonAmoy,
      8453: base,
      84532: baseSepolia,
    };

    return chainMap[chainId] || mainnet;
  }

  private createClient(chainId: number) {
    const chain = this.getChainConfig(chainId);

    // Use public RPC endpoints for gas estimation
    let rpcUrl = chain.rpcUrls.default.http[0];

    return createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }

  private getCacheKey(chainId: number, type: string): string {
    return `${type}:${chainId}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  async getGasPrices(chainId: number): Promise<GasPrice> {
    const cacheKey = this.getCacheKey(chainId, 'gasPrices');
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    const client = this.createClient(chainId);
    const chain = getChainById(chainId);

    try {
      // Get current gas price
      const gasPrice = await client.getGasPrice();

      // Calculate different price levels based on chain
      let slow: bigint;
      let standard: bigint;
      let fast: bigint;
      let instant: bigint;

      if (chainId === 1 || chainId === 11155111) {
        // Ethereum - use EIP-1559
        const feeHistory = await client.getFeeHistory({
          blockCount: 4,
          rewardPercentiles: [25, 50, 75, 90],
        });

        const baseFee = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
        const priorityFees = feeHistory.reward?.map(rewards => rewards[1]) || []; // 50th percentile
        const avgPriorityFee = priorityFees.length > 0
          ? priorityFees.reduce((a, b) => a + b, BigInt(0)) / BigInt(priorityFees.length)
          : BigInt(0);

        slow = baseFee + avgPriorityFee;
        standard = baseFee + (avgPriorityFee * BigInt(110)) / BigInt(100);
        fast = baseFee + (avgPriorityFee * BigInt(150)) / BigInt(100);
        instant = baseFee + (avgPriorityFee * BigInt(200)) / BigInt(100);
      } else {
        // Other chains - use multiplier approach
        slow = (gasPrice * BigInt(90)) / BigInt(100);
        standard = gasPrice;
        fast = (gasPrice * BigInt(120)) / BigInt(100);
        instant = (gasPrice * BigInt(150)) / BigInt(100);
      }

      const gasPrices: GasPrice = {
        slow,
        standard,
        fast,
        instant,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: gasPrices,
        timestamp: Date.now(),
      });

      return gasPrices;
    } catch (error) {
      console.error('Error fetching gas prices:', error);

      // Fallback to basic gas price
      const gasPrice = await client.getGasPrice();
      return {
        slow: (gasPrice * BigInt(90)) / BigInt(100),
        standard: gasPrice,
        fast: (gasPrice * BigInt(120)) / BigInt(100),
        instant: (gasPrice * BigInt(150)) / BigInt(100),
      };
    }
  }

  async estimateGasForTransaction(
    chainId: number,
    transaction: {
      to?: `0x${string}`;
      value?: bigint;
      data?: `0x${string}`;
      from?: `0x${string}`;
    },
    priceLevel: 'slow' | 'standard' | 'fast' | 'instant' = 'standard'
  ): Promise<GasEstimationResult> {
    const client = this.createClient(chainId);
    const warnings: string[] = [];

    try {
      // Estimate gas limit
      const gasLimit = await client.estimateGas({
        ...transaction,
        account: transaction.from,
      });

      // Add 20% buffer to gas limit
      const bufferedGasLimit = (gasLimit * BigInt(120)) / BigInt(100);

      // Get gas prices
      const gasPrices = await this.getGasPrices(chainId);
      const gasPrice = gasPrices[priceLevel];

      // Calculate total cost
      const totalCost = bufferedGasLimit * gasPrice;

      // Get cost in USD
      const costInUSD = await this.getGasCostInUSD(chainId, totalCost);

      // Determine confidence level
      let confidence: 'low' | 'medium' | 'high' = 'medium';
      if (gasLimit > BigInt(500000)) {
        confidence = 'low';
        warnings.push('High gas limit detected - transaction may fail');
      } else if (gasLimit < BigInt(21000)) {
        confidence = 'high';
      }

      // Add warnings based on cost
      if (costInUSD > 50) {
        warnings.push('High transaction cost detected');
        confidence = 'low';
      }

      // Check for potential issues
      if (transaction.value && transaction.value > parseEther('1')) {
        warnings.push('Large value transfer detected');
      }

      const estimate: GasEstimate = {
        gasLimit: bufferedGasLimit,
        gasPrice,
        totalCost,
        costInUSD,
      };

      // Add EIP-1559 fields for Ethereum
      if (chainId === 1 || chainId === 11155111) {
        const feeHistory = await client.getFeeHistory({
          blockCount: 4,
          rewardPercentiles: [25, 50, 75, 90],
        });

        const baseFee = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
        const priorityFees = feeHistory.reward?.map(rewards => rewards[1]) || [];
        const avgPriorityFee = priorityFees.length > 0
          ? priorityFees.reduce((a, b) => a + b, BigInt(0)) / BigInt(priorityFees.length)
          : BigInt(0);

        estimate.maxFeePerGas = baseFee + (avgPriorityFee * BigInt(200)) / BigInt(100);
        estimate.maxPriorityFeePerGas = avgPriorityFee;
      }

      return {
        estimate,
        priceLevel,
        confidence,
        warnings,
      };
    } catch (error) {
      console.error('Error estimating gas:', error);

      // Return fallback estimate
      const gasPrices = await this.getGasPrices(chainId);
      const gasPrice = gasPrices[priceLevel];

      return {
        estimate: {
          gasLimit: BigInt(210000), // Default gas limit
          gasPrice,
          totalCost: BigInt(210000) * gasPrice,
        },
        priceLevel,
        confidence: 'low',
        warnings: ['Gas estimation failed - using default values'],
      };
    }
  }

  async getGasCostInUSD(chainId: number, gasCost: bigint): Promise<number> {
    const cacheKey = this.getCacheKey(chainId, 'tokenPrice');
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      const price = cached.data;
      const costInETH = parseFloat(formatEther(gasCost));
      return costInETH * price;
    }

    try {
      const chain = getChainById(chainId);
      const nativeSymbol = chain?.nativeCurrency.symbol || 'ETH';

      // Fetch token price from CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinGeckoId(nativeSymbol)}&vs_currencies=usd`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch token price');
      }

      const data = await response.json();
      const price = data[this.getCoinGeckoId(nativeSymbol)]?.usd || 0;

      // Cache the price
      this.cache.set(cacheKey, {
        data: price,
        timestamp: Date.now(),
      });

      const costInETH = parseFloat(formatEther(gasCost));
      return costInETH * price;
    } catch (error) {
      console.warn('Failed to fetch token price:', error);

      // Return fallback price
      const costInETH = parseFloat(formatEther(gasCost));
      return costInETH * this.getFallbackPrice(chainId);
    }
  }

  private getCoinGeckoId(symbol: string): string {
    const coinMap: Record<string, string> = {
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'FTM': 'fantom',
    };

    return coinMap[symbol] || 'ethereum';
  }

  private getFallbackPrice(chainId: number): number {
    const fallbackPrices: Record<number, number> = {
      1: 2000, // ETH
      11155111: 2000, // Sepolia ETH
      56: 300, // BNB
      97: 300, // BSC Testnet BNB
      137: 0.8, // MATIC
      80002: 0.8, // Polygon Amoy MATIC
      8453: 2000, // Base ETH
      84532: 2000, // Base Sepolia ETH
    };

    return fallbackPrices[chainId] || 2000;
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const gasEstimationService = new GasEstimationServiceImpl();
