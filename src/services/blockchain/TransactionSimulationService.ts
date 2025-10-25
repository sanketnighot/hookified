import { createPublicClient, http } from 'viem';
import { base, baseSepolia, bsc, bscTestnet, mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains';

export interface SimulationResult {
  success: boolean;
  gasUsed: bigint;
  returnValue?: any;
  error?: string;
  warnings: string[];
  logs: any[];
  trace?: any;
}

export interface SimulationOptions {
  from?: `0x${string}`;
  value?: bigint;
  blockNumber?: bigint;
  timeout?: number;
}

export interface TransactionSimulationService {
  simulateContractCall(
    chainId: number,
    contractAddress: `0x${string}`,
    abi: any[],
    functionName: string,
    args: any[],
    options?: SimulationOptions
  ): Promise<SimulationResult>;
  simulateNativeTransfer(
    chainId: number,
    to: `0x${string}`,
    value: bigint,
    from?: `0x${string}`,
    options?: SimulationOptions
  ): Promise<SimulationResult>;
  validateTransaction(
    chainId: number,
    transaction: {
      to?: `0x${string}`;
      value?: bigint;
      data?: `0x${string}`;
      from?: `0x${string}`;
    }
  ): Promise<SimulationResult>;
}

class TransactionSimulationServiceImpl implements TransactionSimulationService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 1 minute

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

    // Use public RPC endpoints for simulation
    let rpcUrl = chain.rpcUrls.default.http[0];

    return createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }

  private getCacheKey(chainId: number, type: string, params: string): string {
    return `${type}:${chainId}:${params}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  async simulateContractCall(
    chainId: number,
    contractAddress: `0x${string}`,
    abi: any[],
    functionName: string,
    args: any[],
    options: SimulationOptions = {}
  ): Promise<SimulationResult> {
    const cacheKey = this.getCacheKey(
      chainId,
      'contractCall',
      `${contractAddress}:${functionName}:${JSON.stringify(args)}`
    );

    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    const client = this.createClient(chainId);
    const warnings: string[] = [];

    try {
      const contract = {
        address: contractAddress,
        abi,
      };

      const simulationResult = await client.simulateContract({
        ...contract,
        functionName,
        args,
        account: options.from,
        value: options.value,
        blockNumber: options.blockNumber,
      });

      // Analyze the result
      const result: SimulationResult = {
        success: true,
        gasUsed: BigInt(210000), // Default gas estimate
        returnValue: simulationResult.result,
        warnings: [],
        logs: [],
      };

      // Add warnings based on simulation
      if (result.gasUsed > BigInt(500000)) {
        warnings.push('High gas usage detected');
      }

      if (result.gasUsed < BigInt(21000)) {
        warnings.push('Very low gas usage - transaction might be invalid');
      }

      // Check for common issues
      if (options.value && options.value > BigInt(0)) {
        warnings.push('Transaction includes ETH value');
      }

      // Check logs for events
      if (result.logs.length > 0) {
        warnings.push(`${result.logs.length} events will be emitted`);
      }

      result.warnings = warnings;

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error: any) {
      console.error('Contract simulation failed:', error);

      const errorMessage = this.parseError(error);

      return {
        success: false,
        gasUsed: BigInt(0),
        error: errorMessage,
        warnings: ['Simulation failed - transaction will likely fail'],
        logs: [],
      };
    }
  }

  async simulateNativeTransfer(
    chainId: number,
    to: `0x${string}`,
    value: bigint,
    from?: `0x${string}`,
    options: SimulationOptions = {}
  ): Promise<SimulationResult> {
    const cacheKey = this.getCacheKey(
      chainId,
      'nativeTransfer',
      `${to}:${value.toString()}`
    );

    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    const client = this.createClient(chainId);
    const warnings: string[] = [];

    try {
      // For native transfers, use estimateGas
      const gasEstimate = await client.estimateGas({
        account: from || '0x0000000000000000000000000000000000000000',
        to,
        value,
        data: '0x',
        blockNumber: options.blockNumber,
      });

      const result: SimulationResult = {
        success: true,
        gasUsed: gasEstimate,
        warnings: [],
        logs: [],
      };

      // Add warnings for native transfers
      if (value > BigInt(0)) {
        warnings.push(`Transferring ${this.formatEther(value)} native tokens`);
      }

      if (value === BigInt(0)) {
        warnings.push('Zero value transfer');
      }

      result.warnings = warnings;

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error: any) {
      console.error('Native transfer simulation failed:', error);

      const errorMessage = this.parseError(error);

      return {
        success: false,
        gasUsed: BigInt(0),
        error: errorMessage,
        warnings: ['Transfer simulation failed'],
        logs: [],
      };
    }
  }

  async validateTransaction(
    chainId: number,
    transaction: {
      to?: `0x${string}`;
      value?: bigint;
      data?: `0x${string}`;
      from?: `0x${string}`;
    }
  ): Promise<SimulationResult> {
    const client = this.createClient(chainId);
    const warnings: string[] = [];

    try {
      // Basic validation checks
      if (!transaction.to) {
        return {
          success: false,
          gasUsed: BigInt(0),
          error: 'Missing recipient address',
          warnings: ['Invalid transaction: no recipient'],
          logs: [],
        };
      }

      if (transaction.value && transaction.value < BigInt(0)) {
        return {
          success: false,
          gasUsed: BigInt(0),
          error: 'Invalid value: cannot be negative',
          warnings: ['Invalid transaction: negative value'],
          logs: [],
        };
      }

      // Check if recipient is a contract
      const code = await client.getCode({ address: transaction.to });
      const isContract = code && code !== '0x';

      if (isContract && !transaction.data) {
        warnings.push('Sending ETH to contract without data');
      }

      if (!isContract && transaction.data && transaction.data !== '0x') {
        warnings.push('Sending data to EOA address');
      }

      // Estimate gas
      const gasEstimate = await client.estimateGas({
        ...transaction,
        account: transaction.from,
      });

      return {
        success: true,
        gasUsed: gasEstimate,
        warnings,
        logs: [],
      };
    } catch (error: any) {
      console.error('Transaction validation failed:', error);

      const errorMessage = this.parseError(error);

      return {
        success: false,
        gasUsed: BigInt(0),
        error: errorMessage,
        warnings: ['Transaction validation failed'],
        logs: [],
      };
    }
  }

  private parseError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      // Common error patterns
      const message = error.message.toLowerCase();

      if (message.includes('insufficient funds')) {
        return 'Insufficient funds for transaction';
      }

      if (message.includes('gas required exceeds allowance')) {
        return 'Gas limit too low';
      }

      if (message.includes('execution reverted')) {
        return 'Transaction would revert';
      }

      if (message.includes('nonce too low')) {
        return 'Nonce too low - transaction already processed';
      }

      if (message.includes('nonce too high')) {
        return 'Nonce too high - missing previous transactions';
      }

      if (message.includes('invalid signature')) {
        return 'Invalid signature';
      }

      if (message.includes('revert')) {
        return 'Contract execution would revert';
      }

      return error.message;
    }

    return 'Unknown error occurred during simulation';
  }

  private formatEther(value: bigint): string {
    const ether = Number(value) / 1e18;
    return ether.toFixed(6);
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
export const transactionSimulationService = new TransactionSimulationServiceImpl();
