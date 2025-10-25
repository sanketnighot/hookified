import { ERC20Metadata, NFTMetadata } from '@/lib/types';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia, bsc, bscTestnet, mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains';

export interface TokenMetadataService {
  fetchERC20Metadata(address: string, chainId: number): Promise<ERC20Metadata>;
  fetchERC721Metadata(address: string, tokenId: string, chainId: number): Promise<NFTMetadata>;
  getTokenBalance(address: string, tokenAddress: string, chainId: number): Promise<string>;
  getTokenAllowance(owner: string, spender: string, tokenAddress: string, chainId: number): Promise<string>;
}

class TokenMetadataServiceImpl implements TokenMetadataService {
  private cache = new Map<string, any>();

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

    // Use public RPC endpoints for metadata fetching
    let rpcUrl = chain.rpcUrls.default.http[0];

    return createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }

  async fetchERC20Metadata(address: string, chainId: number): Promise<ERC20Metadata> {
    const cacheKey = `erc20:${chainId}:${address}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const client = this.createClient(chainId);

    try {
      // ERC-20 standard ABI for metadata functions
      const erc20Abi = [
        {
          "type": "function",
          "name": "name",
          "inputs": [],
          "outputs": [{ "type": "string" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "symbol",
          "inputs": [],
          "outputs": [{ "type": "string" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "decimals",
          "inputs": [],
          "outputs": [{ "type": "uint8" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "totalSupply",
          "inputs": [],
          "outputs": [{ "type": "uint256" }],
          "stateMutability": "view"
        }
      ];

      const contract = {
        address: address as `0x${string}`,
        abi: erc20Abi,
      };

      // Fetch metadata in parallel
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        client.readContract({ ...contract, functionName: 'name' }).catch(() => 'Unknown'),
        client.readContract({ ...contract, functionName: 'symbol' }).catch(() => 'UNKNOWN'),
        client.readContract({ ...contract, functionName: 'decimals' }).catch(() => 18),
        client.readContract({ ...contract, functionName: 'totalSupply' }).catch(() => '0'),
      ]);

      const metadata: ERC20Metadata = {
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        totalSupply: totalSupply?.toString(),
      };

      // Cache the result
      this.cache.set(cacheKey, metadata);

      return metadata;
    } catch (error) {
      console.error('Error fetching ERC-20 metadata:', error);

      // Return default metadata if fetching fails
      return {
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 18,
        totalSupply: '0',
      };
    }
  }

  async fetchERC721Metadata(address: string, tokenId: string, chainId: number): Promise<NFTMetadata> {
    const cacheKey = `erc721:${chainId}:${address}:${tokenId}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const client = this.createClient(chainId);

    try {
      // ERC-721 standard ABI for metadata functions
      const erc721Abi = [
        {
          "type": "function",
          "name": "name",
          "inputs": [],
          "outputs": [{ "type": "string" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "tokenURI",
          "inputs": [{ "name": "tokenId", "type": "uint256" }],
          "outputs": [{ "type": "string" }],
          "stateMutability": "view"
        }
      ];

      const contract = {
        address: address as `0x${string}`,
        abi: erc721Abi,
      };

      // Fetch contract name and token URI
      const [contractName, tokenURI] = await Promise.all([
        client.readContract({ ...contract, functionName: 'name' }).catch(() => 'Unknown NFT'),
        client.readContract({
          ...contract,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        }).catch(() => ''),
      ]);

      let metadata: NFTMetadata = {
        name: `${contractName} #${tokenId}`,
        description: `NFT #${tokenId} from ${contractName}`,
      };

      // Try to fetch metadata from tokenURI if available
      if (tokenURI) {
        try {
          const metadataResponse = await fetch(tokenURI as string);
          if (metadataResponse.ok) {
            const tokenMetadata = await metadataResponse.json();
            metadata = {
              name: tokenMetadata.name || metadata.name,
              description: tokenMetadata.description || metadata.description,
              image: tokenMetadata.image,
              attributes: tokenMetadata.attributes,
            };
          }
        } catch (error) {
          console.warn('Failed to fetch token metadata from URI:', error);
        }
      }

      // Cache the result
      this.cache.set(cacheKey, metadata);

      return metadata;
    } catch (error) {
      console.error('Error fetching ERC-721 metadata:', error);

      // Return default metadata if fetching fails
      return {
        name: `NFT #${tokenId}`,
        description: `NFT #${tokenId}`,
      };
    }
  }

  async getTokenBalance(address: string, tokenAddress: string, chainId: number): Promise<string> {
    const client = this.createClient(chainId);

    try {
      // ERC-20 balanceOf function
      const erc20Abi = [
        {
          "type": "function",
          "name": "balanceOf",
          "inputs": [{ "name": "account", "type": "address" }],
          "outputs": [{ "type": "uint256" }],
          "stateMutability": "view"
        }
      ];

      const contract = {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
      };

      const balance = await client.readContract({
        ...contract,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      return (balance as bigint).toString();
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  }

  async getTokenAllowance(owner: string, spender: string, tokenAddress: string, chainId: number): Promise<string> {
    const client = this.createClient(chainId);

    try {
      // ERC-20 allowance function
      const erc20Abi = [
        {
          "type": "function",
          "name": "allowance",
          "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "spender", "type": "address" }
          ],
          "outputs": [{ "type": "uint256" }],
          "stateMutability": "view"
        }
      ];

      const contract = {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
      };

      const allowance = await client.readContract({
        ...contract,
        functionName: 'allowance',
        args: [owner as `0x${string}`, spender as `0x${string}`],
      });

      return (allowance as bigint).toString();
    } catch (error) {
      console.error('Error fetching token allowance:', error);
      return '0';
    }
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
export const tokenMetadataService = new TokenMetadataServiceImpl();
