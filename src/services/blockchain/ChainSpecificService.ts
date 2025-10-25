import { createPublicClient, http } from 'viem';
import { base, baseSepolia, bsc, bscTestnet, mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains';

export interface ChainFeature {
  chainId: number;
  name: string;
  features: {
    eip1559: boolean;
    l2Optimizations: boolean;
    customGasToken?: string;
    priorityFeeSupport: boolean;
    batchTransactions: boolean;
    customRpcMethods: string[];
  };
}

export interface EIP1559GasConfig {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  baseFeePerGas: bigint;
  gasLimit: bigint;
}

export interface L2Optimization {
  type: 'batch' | 'compression' | 'aggregation';
  enabled: boolean;
  description: string;
  gasSavings: number; // percentage
}

export interface ChainSpecificService {
  getChainFeatures(chainId: number): ChainFeature | null;
  isEIP1559Supported(chainId: number): boolean;
  getEIP1559GasConfig(chainId: number, priorityLevel?: 'slow' | 'standard' | 'fast' | 'instant'): Promise<EIP1559GasConfig>;
  getL2Optimizations(chainId: number): L2Optimization[];
  optimizeTransaction(chainId: number, transaction: any): Promise<any>;
  getCustomRpcMethods(chainId: number): string[];
  estimateBatchGas(chainId: number, transactions: any[]): Promise<bigint>;
}

class ChainSpecificServiceImpl implements ChainSpecificService {
  private chainFeatures = new Map<number, ChainFeature>([
    // Ethereum Mainnet
    [1, {
      chainId: 1,
      name: 'Ethereum Mainnet',
      features: {
        eip1559: true,
        l2Optimizations: false,
        priorityFeeSupport: true,
        batchTransactions: false,
        customRpcMethods: ['eth_feeHistory', 'eth_maxPriorityFeePerGas'],
      },
    }],
    // Ethereum Sepolia
    [11155111, {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      features: {
        eip1559: true,
        l2Optimizations: false,
        priorityFeeSupport: true,
        batchTransactions: false,
        customRpcMethods: ['eth_feeHistory', 'eth_maxPriorityFeePerGas'],
      },
    }],
    // BSC Mainnet
    [56, {
      chainId: 56,
      name: 'BNB Smart Chain',
      features: {
        eip1559: false,
        l2Optimizations: true,
        customGasToken: 'BNB',
        priorityFeeSupport: false,
        batchTransactions: true,
        customRpcMethods: ['bsc_getChainId', 'bsc_getBalance'],
      },
    }],
    // BSC Testnet
    [97, {
      chainId: 97,
      name: 'BSC Testnet',
      features: {
        eip1559: false,
        l2Optimizations: true,
        customGasToken: 'BNB',
        priorityFeeSupport: false,
        batchTransactions: true,
        customRpcMethods: ['bsc_getChainId', 'bsc_getBalance'],
      },
    }],
    // Polygon Mainnet
    [137, {
      chainId: 137,
      name: 'Polygon',
      features: {
        eip1559: false,
        l2Optimizations: true,
        customGasToken: 'MATIC',
        priorityFeeSupport: false,
        batchTransactions: true,
        customRpcMethods: ['polygon_getBalance', 'polygon_getTransactionCount'],
      },
    }],
    // Polygon Amoy
    [80002, {
      chainId: 80002,
      name: 'Polygon Amoy',
      features: {
        eip1559: false,
        l2Optimizations: true,
        customGasToken: 'MATIC',
        priorityFeeSupport: false,
        batchTransactions: true,
        customRpcMethods: ['polygon_getBalance', 'polygon_getTransactionCount'],
      },
    }],
    // Base Mainnet
    [8453, {
      chainId: 8453,
      name: 'Base',
      features: {
        eip1559: true,
        l2Optimizations: true,
        priorityFeeSupport: true,
        batchTransactions: true,
        customRpcMethods: ['eth_feeHistory', 'base_getBalance'],
      },
    }],
    // Base Sepolia
    [84532, {
      chainId: 84532,
      name: 'Base Sepolia',
      features: {
        eip1559: true,
        l2Optimizations: true,
        priorityFeeSupport: true,
        batchTransactions: true,
        customRpcMethods: ['eth_feeHistory', 'base_getBalance'],
      },
    }],
  ]);

  getChainFeatures(chainId: number): ChainFeature | null {
    return this.chainFeatures.get(chainId) || null;
  }

  isEIP1559Supported(chainId: number): boolean {
    const features = this.getChainFeatures(chainId);
    return features?.features.eip1559 || false;
  }

  async getEIP1559GasConfig(
    chainId: number,
    priorityLevel: 'slow' | 'standard' | 'fast' | 'instant' = 'standard'
  ): Promise<EIP1559GasConfig> {
    if (!this.isEIP1559Supported(chainId)) {
      throw new Error(`EIP-1559 not supported on chain ${chainId}`);
    }

    const client = createPublicClient({
      chain: this.getChainConfig(chainId),
      transport: http(),
    });

    try {
      // Get fee history
      const feeHistory = await client.getFeeHistory({
        blockCount: 4,
        rewardPercentiles: [25, 50, 75, 90],
      });

      const baseFeePerGas = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
      const priorityFees = feeHistory.reward?.map(rewards => rewards[1]) || []; // 50th percentile
      const avgPriorityFee = priorityFees.length > 0
        ? priorityFees.reduce((a, b) => a + b, BigInt(0)) / BigInt(priorityFees.length)
        : BigInt(0);

      // Calculate priority fee based on level
      let maxPriorityFeePerGas: bigint;
      switch (priorityLevel) {
        case 'slow':
          maxPriorityFeePerGas = avgPriorityFee;
          break;
        case 'standard':
          maxPriorityFeePerGas = (avgPriorityFee * BigInt(110)) / BigInt(100);
          break;
        case 'fast':
          maxPriorityFeePerGas = (avgPriorityFee * BigInt(150)) / BigInt(100);
          break;
        case 'instant':
          maxPriorityFeePerGas = (avgPriorityFee * BigInt(200)) / BigInt(100);
          break;
        default:
          maxPriorityFeePerGas = avgPriorityFee;
      }

      // Calculate max fee per gas (base fee + priority fee + buffer)
      const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas + (baseFeePerGas * BigInt(10)) / BigInt(100);

      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
        baseFeePerGas,
        gasLimit: BigInt(210000), // Default gas limit
      };
    } catch (error) {
      console.error('Error getting EIP-1559 gas config:', error);
      throw error;
    }
  }

  getL2Optimizations(chainId: number): L2Optimization[] {
    const features = this.getChainFeatures(chainId);
    if (!features?.features.l2Optimizations) {
      return [];
    }

    const optimizations: L2Optimization[] = [];

    // BSC optimizations
    if (chainId === 56 || chainId === 97) {
      optimizations.push({
        type: 'batch',
        enabled: true,
        description: 'Batch multiple transactions into a single block',
        gasSavings: 15,
      });
      optimizations.push({
        type: 'compression',
        enabled: true,
        description: 'Compress transaction data for reduced gas costs',
        gasSavings: 10,
      });
    }

    // Polygon optimizations
    if (chainId === 137 || chainId === 80002) {
      optimizations.push({
        type: 'batch',
        enabled: true,
        description: 'Polygon batch processing for faster confirmation',
        gasSavings: 20,
      });
      optimizations.push({
        type: 'aggregation',
        enabled: true,
        description: 'Aggregate multiple operations into single transaction',
        gasSavings: 25,
      });
    }

    // Base optimizations
    if (chainId === 8453 || chainId === 84532) {
      optimizations.push({
        type: 'batch',
        enabled: true,
        description: 'Base L2 batch processing',
        gasSavings: 30,
      });
      optimizations.push({
        type: 'compression',
        enabled: true,
        description: 'Optimized data compression for Base',
        gasSavings: 15,
      });
      optimizations.push({
        type: 'aggregation',
        enabled: true,
        description: 'Transaction aggregation for cost savings',
        gasSavings: 20,
      });
    }

    return optimizations;
  }

  async optimizeTransaction(chainId: number, transaction: any): Promise<any> {
    const features = this.getChainFeatures(chainId);
    if (!features) {
      return transaction;
    }

    const optimizedTransaction = { ...transaction };

    // Apply EIP-1559 optimizations
    if (features.features.eip1559) {
      try {
        const gasConfig = await this.getEIP1559GasConfig(chainId);
        optimizedTransaction.maxFeePerGas = gasConfig.maxFeePerGas;
        optimizedTransaction.maxPriorityFeePerGas = gasConfig.maxPriorityFeePerGas;
        optimizedTransaction.gasLimit = gasConfig.gasLimit;
      } catch (error) {
        console.warn('Failed to apply EIP-1559 optimizations:', error);
      }
    }

    // Apply L2 optimizations
    const optimizations = this.getL2Optimizations(chainId);
    for (const optimization of optimizations) {
      if (optimization.enabled) {
        switch (optimization.type) {
          case 'batch':
            // Add batch-specific fields
            optimizedTransaction.batchOptimized = true;
            break;
          case 'compression':
            // Add compression hints
            optimizedTransaction.compressionEnabled = true;
            break;
          case 'aggregation':
            // Add aggregation metadata
            optimizedTransaction.aggregationEnabled = true;
            break;
        }
      }
    }

    return optimizedTransaction;
  }

  getCustomRpcMethods(chainId: number): string[] {
    const features = this.getChainFeatures(chainId);
    return features?.features.customRpcMethods || [];
  }

  async estimateBatchGas(chainId: number, transactions: any[]): Promise<bigint> {
    const features = this.getChainFeatures(chainId);
    if (!features?.features.batchTransactions) {
      throw new Error(`Batch transactions not supported on chain ${chainId}`);
    }

    const client = createPublicClient({
      chain: this.getChainConfig(chainId),
      transport: http(),
    });

    try {
      // Estimate gas for each transaction
      const gasEstimates = await Promise.all(
        transactions.map(async (tx) => {
          return await client.estimateGas({
            to: tx.to,
            value: tx.value,
            data: tx.data,
            account: tx.from,
          });
        })
      );

      // Calculate total gas with batch discount
      const totalGas = gasEstimates.reduce((sum, gas) => sum + gas, BigInt(0));

      // Apply batch discount based on chain
      let discount = BigInt(0);
      if (chainId === 56 || chainId === 97) {
        discount = (totalGas * BigInt(15)) / BigInt(100); // 15% discount for BSC
      } else if (chainId === 137 || chainId === 80002) {
        discount = (totalGas * BigInt(20)) / BigInt(100); // 20% discount for Polygon
      } else if (chainId === 8453 || chainId === 84532) {
        discount = (totalGas * BigInt(30)) / BigInt(100); // 30% discount for Base
      }

      return totalGas - discount;
    } catch (error) {
      console.error('Error estimating batch gas:', error);
      throw error;
    }
  }

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

  // Utility methods
  getAllSupportedChains(): ChainFeature[] {
    return Array.from(this.chainFeatures.values());
  }

  getChainsByFeature(feature: keyof ChainFeature['features']): ChainFeature[] {
    return Array.from(this.chainFeatures.values()).filter(
      chain => chain.features[feature] === true
    );
  }

  getGasTokenSymbol(chainId: number): string {
    const features = this.getChainFeatures(chainId);
    return features?.features.customGasToken || 'ETH';
  }

  isL2Chain(chainId: number): boolean {
    const l2Chains = [56, 97, 137, 80002, 8453, 84532];
    return l2Chains.includes(chainId);
  }

  getChainType(chainId: number): 'mainnet' | 'testnet' | 'l2' | 'unknown' {
    if (chainId === 1 || chainId === 56 || chainId === 137 || chainId === 8453) {
      return 'mainnet';
    }
    if (chainId === 11155111 || chainId === 97 || chainId === 80002 || chainId === 84532) {
      return 'testnet';
    }
    if (this.isL2Chain(chainId)) {
      return 'l2';
    }
    return 'unknown';
  }
}

// Export singleton instance
export const chainSpecificService = new ChainSpecificServiceImpl();
