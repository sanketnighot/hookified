import { getEtherscanConfig, isEtherscanConfigured } from "@/lib/config";
import { ContractInfo } from '@/lib/types';
import axios from 'axios';

export interface EtherscanResponse {
  status: string;
  message: string;
  result: string;
}

export interface ContractSourceResponse {
  status: string;
  message: string;
  result: Array<{
    SourceCode: string;
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    Runs: string;
    ConstructorArguments: string;
    EVMVersion: string;
    Library: string;
    LicenseType: string;
    Proxy: string;
    Implementation: string;
    SwarmSource: string;
  }>;
}

export class EtherscanService {
  private static instance: EtherscanService;
  private cache = new Map<string, any>();

  static getInstance(): EtherscanService {
    if (!EtherscanService.instance) {
      EtherscanService.instance = new EtherscanService();
    }
    return EtherscanService.instance;
  }

  /**
   * Get the appropriate explorer URL for a given chain ID
   * Updated to use Etherscan unified V2 API for all supported chains
   */
  getChainExplorerUrl(chainId: number): string {
    // Use unified Etherscan V2 API for all supported chains
    return 'https://api.etherscan.io/v2/api';
  }

  /**
   * Get the appropriate API key for a given chain ID
   * All Etherscan-compatible explorers use the same API key
   */
  getChainExplorerApiKey(chainId: number): string {
    return getEtherscanConfig().apiKey;
  }

  /**
   * Check if the API key is configured for the given chain
   * All Etherscan-compatible explorers use the same API key
   */
  isApiKeyConfigured(chainId: number): boolean {
    return isEtherscanConfigured();
  }

  /**
   * Fetch contract ABI from the appropriate block explorer
   */
  async fetchContractABI(contractAddress: string, chainId: number): Promise<any[]> {
    const cacheKey = `${chainId}:${contractAddress}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (!this.isApiKeyConfigured(chainId)) {
      throw new Error(`API key not configured for chain ${chainId}`);
    }

    const baseUrl = this.getChainExplorerUrl(chainId);
    const apiKey = this.getChainExplorerApiKey(chainId);

    try {
      const response = await axios.get<ContractSourceResponse>(baseUrl, {
        params: {
          chainid: chainId, // Required for API V2
          module: 'contract',
          action: 'getsourcecode',
          address: contractAddress,
          apikey: apiKey,
        },
        timeout: 10000,
      });

      if (response.data.status !== '1') {
        throw new Error(`Failed to fetch ABI: ${response.data.message}`);
      }

      const contractData = response.data.result[0];

      if (!contractData.ABI || contractData.ABI === 'Contract source code not verified') {
        throw new Error('Contract is not verified on the block explorer');
      }

      let abi: any[];
      try {
        abi = JSON.parse(contractData.ABI);
      } catch (parseError) {
        throw new Error('Invalid ABI format received from block explorer');
      }

      // Cache the result
      this.cache.set(cacheKey, abi);

      return abi;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Network error fetching ABI: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate if a contract exists and is verified
   */
  async validateContract(contractAddress: string, chainId: number): Promise<boolean> {
    try {
      await this.fetchContractABI(contractAddress, chainId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get detailed contract information
   */
  async getContractInfo(contractAddress: string, chainId: number): Promise<ContractInfo> {
    if (!this.isApiKeyConfigured(chainId)) {
      throw new Error(`API key not configured for chain ${chainId}`);
    }

    const baseUrl = this.getChainExplorerUrl(chainId);
    const apiKey = this.getChainExplorerApiKey(chainId);

    try {
      const response = await axios.get<ContractSourceResponse>(baseUrl, {
        params: {
          chainid: chainId, // Required for API V2
          module: "contract",
          action: "getsourcecode",
          address: contractAddress,
          apikey: apiKey,
        },
        timeout: 10000,
      });

      if (response.data.status !== '1') {
        throw new Error(`Failed to fetch contract info: ${response.data.message}`);
      }

      const contractData = response.data.result[0];
      const isVerified = contractData.ABI !== 'Contract source code not verified';

      return {
        address: contractAddress,
        name: contractData.ContractName || undefined,
        isVerified,
        compilerVersion: contractData.CompilerVersion || undefined,
        sourceCodeUrl: isVerified ? this.getSourceCodeUrl(contractAddress, chainId) : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Network error fetching contract info: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the source code URL for a verified contract
   */
  getSourceCodeUrl(contractAddress: string, chainId: number): string {
    const explorerMap: Record<number, string> = {
      1: 'https://etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      56: 'https://bscscan.com',
      97: 'https://testnet.bscscan.com',
      137: 'https://polygonscan.com',
      80002: 'https://amoy.polygonscan.com',
      8453: 'https://basescan.org',
      84532: 'https://sepolia.basescan.org',
    };

    const explorer = explorerMap[chainId] || explorerMap[1];
    return `${explorer}/address/${contractAddress}#code`;
  }

  /**
   * Clear cache for a specific contract or all contracts
   */
  clearCache(contractAddress?: string, chainId?: number): void {
    if (contractAddress && chainId) {
      const cacheKey = `${chainId}:${contractAddress}`;
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const etherscanService = EtherscanService.getInstance();
