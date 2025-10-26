import { PrismaClient } from "../../generated/prisma";

export interface CachedABI {
  contractAddress: string;
  chainId: number;
  abi: any[];
  contractName?: string;
  isVerified: boolean;
  lastFetched: Date;
  source: "etherscan" | "database" | "template";
  metadata?: {
    compilerVersion?: string;
    sourceCodeUrl?: string;
    license?: string;
  };
}

export interface ABICacheStats {
  totalCached: number;
  verifiedContracts: number;
  unverifiedContracts: number;
  oldestCache: Date | null;
  newestCache: Date | null;
  cacheHitRate: number;
}

export interface ABICachingService {
  getCachedABI(
    contractAddress: string,
    chainId: number
  ): Promise<CachedABI | null>;
  setCachedABI(abi: CachedABI): Promise<void>;
  invalidateCache(contractAddress: string, chainId: number): Promise<void>;
  clearExpiredCache(maxAge?: number): Promise<number>;
  getCacheStats(): Promise<ABICacheStats>;
  searchContracts(query: string, chainId?: number): Promise<CachedABI[]>;
  getPopularContracts(chainId?: number, limit?: number): Promise<CachedABI[]>;
}

class ABICachingServiceImpl implements ABICachingService {
  private memoryCache = new Map<string, CachedABI>();
  private prisma: PrismaClient;
  private readonly MEMORY_CACHE_TTL = 300000; // 5 minutes
  private readonly DATABASE_CACHE_TTL = 86400000; // 24 hours
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private getCacheKey(contractAddress: string, chainId: number): string {
    return `${chainId}:${contractAddress.toLowerCase()}`;
  }

  private isMemoryCacheValid(abi: CachedABI): boolean {
    return Date.now() - abi.lastFetched.getTime() < this.MEMORY_CACHE_TTL;
  }

  private isDatabaseCacheValid(abi: CachedABI): boolean {
    return Date.now() - abi.lastFetched.getTime() < this.DATABASE_CACHE_TTL;
  }

  async getCachedABI(
    contractAddress: string,
    chainId: number
  ): Promise<CachedABI | null> {
    const cacheKey = this.getCacheKey(contractAddress, chainId);

    // Check memory cache first
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached && this.isMemoryCacheValid(memoryCached)) {
      this.cacheHits++;
      return memoryCached;
    }

    try {
      // Check database cache
      const dbCached = await this.prisma.contractABI.findFirst({
        where: {
          contractAddress: contractAddress.toLowerCase(),
          chainId,
        },
      });

      if (
        dbCached &&
        this.isDatabaseCacheValid({
          ...dbCached,
          source: "database" as const,
        } as CachedABI)
      ) {
        const cachedABI: CachedABI = {
          contractAddress: dbCached.contractAddress,
          chainId: dbCached.chainId,
          abi: dbCached.abi as any[],
          contractName: dbCached.contractName || undefined,
          isVerified: dbCached.isVerified,
          lastFetched: dbCached.lastFetched,
          source: "database",
          metadata: dbCached.metadata as any,
        };

        // Update memory cache
        this.memoryCache.set(cacheKey, cachedABI);
        this.cacheHits++;

        return cachedABI;
      }

      this.cacheMisses++;
      return null;
    } catch (error) {
      console.error("Error fetching cached ABI from database:", error);
      this.cacheMisses++;
      return null;
    }
  }

  async setCachedABI(abi: CachedABI): Promise<void> {
    const cacheKey = this.getCacheKey(abi.contractAddress, abi.chainId);

    try {
      // Update memory cache
      this.memoryCache.set(cacheKey, abi);

      // Update database cache
      await this.prisma.contractABI.upsert({
        where: {
          contractAddress_chainId: {
            contractAddress: abi.contractAddress.toLowerCase(),
            chainId: abi.chainId,
          },
        },
        update: {
          abi: abi.abi,
          contractName: abi.contractName,
          isVerified: abi.isVerified,
          lastFetched: abi.lastFetched,
          metadata: abi.metadata,
        },
        create: {
          contractAddress: abi.contractAddress.toLowerCase(),
          chainId: abi.chainId,
          abi: abi.abi,
          contractName: abi.contractName,
          isVerified: abi.isVerified,
          lastFetched: abi.lastFetched,
          metadata: abi.metadata,
        },
      });
    } catch (error) {
      console.error("Error caching ABI:", error);
    }
  }

  async invalidateCache(
    contractAddress: string,
    chainId: number
  ): Promise<void> {
    const cacheKey = this.getCacheKey(contractAddress, chainId);

    try {
      // Remove from memory cache
      this.memoryCache.delete(cacheKey);

      // Remove from database cache
      await this.prisma.contractABI.deleteMany({
        where: {
          contractAddress: contractAddress.toLowerCase(),
          chainId,
        },
      });
    } catch (error) {
      console.error("Error invalidating cache:", error);
    }
  }

  async clearExpiredCache(
    maxAge: number = this.DATABASE_CACHE_TTL
  ): Promise<number> {
    const cutoffTime = new Date(Date.now() - maxAge);
    let deletedCount = 0;

    try {
      // Clear expired memory cache
      for (const [key, abi] of this.memoryCache.entries()) {
        if (abi.lastFetched < cutoffTime) {
          this.memoryCache.delete(key);
        }
      }

      // Clear expired database cache
      const result = await this.prisma.contractABI.deleteMany({
        where: {
          lastFetched: {
            lt: cutoffTime,
          },
        },
      });

      deletedCount = result.count;
    } catch (error) {
      console.error("Error clearing expired cache:", error);
    }

    return deletedCount;
  }

  async getCacheStats(): Promise<ABICacheStats> {
    try {
      const totalCached = await this.prisma.contractABI.count();
      const verifiedContracts = await this.prisma.contractABI.count({
        where: { isVerified: true },
      });
      const unverifiedContracts = totalCached - verifiedContracts;

      const oldestCache = await this.prisma.contractABI.findFirst({
        orderBy: { lastFetched: "asc" },
        select: { lastFetched: true },
      });

      const newestCache = await this.prisma.contractABI.findFirst({
        orderBy: { lastFetched: "desc" },
        select: { lastFetched: true },
      });

      const cacheHitRate =
        this.cacheHits + this.cacheMisses > 0
          ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
          : 0;

      return {
        totalCached,
        verifiedContracts,
        unverifiedContracts,
        oldestCache: oldestCache?.lastFetched || null,
        newestCache: newestCache?.lastFetched || null,
        cacheHitRate,
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        totalCached: 0,
        verifiedContracts: 0,
        unverifiedContracts: 0,
        oldestCache: null,
        newestCache: null,
        cacheHitRate: 0,
      };
    }
  }

  async searchContracts(query: string, chainId?: number): Promise<CachedABI[]> {
    try {
      const whereClause: any = {
        OR: [
          { contractName: { contains: query, mode: "insensitive" } },
          { contractAddress: { contains: query.toLowerCase() } },
        ],
      };

      if (chainId) {
        whereClause.chainId = chainId;
      }

      const contracts = await this.prisma.contractABI.findMany({
        where: whereClause,
        orderBy: [{ isVerified: "desc" }, { lastFetched: "desc" }],
        take: 20,
      });

      return contracts.map((contract) => ({
        contractAddress: contract.contractAddress,
        chainId: contract.chainId,
        abi: contract.abi as any[],
        contractName: contract.contractName || undefined,
        isVerified: contract.isVerified,
        lastFetched: contract.lastFetched,
        source: "database" as const,
        metadata: contract.metadata as any,
      }));
    } catch (error) {
      console.error("Error searching contracts:", error);
      return [];
    }
  }

  async getPopularContracts(
    chainId?: number,
    limit: number = 10
  ): Promise<CachedABI[]> {
    try {
      const whereClause: any = {
        isVerified: true,
      };

      if (chainId) {
        whereClause.chainId = chainId;
      }

      const contracts = await this.prisma.contractABI.findMany({
        where: whereClause,
        orderBy: { lastFetched: "desc" },
        take: limit,
      });

      return contracts.map((contract) => ({
        contractAddress: contract.contractAddress,
        chainId: contract.chainId,
        abi: contract.abi as any[],
        contractName: contract.contractName || undefined,
        isVerified: contract.isVerified,
        lastFetched: contract.lastFetched,
        source: "database" as const,
        metadata: contract.metadata as any,
      }));
    } catch (error) {
      console.error("Error getting popular contracts:", error);
      return [];
    }
  }

  // Utility methods
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  getMemoryCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    };
  }

  resetCacheStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  async preloadPopularContracts(): Promise<void> {
    try {
      // Preload popular contracts for each chain
      const popularAddresses = [
        {
          address: "0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C",
          chainId: 1,
          name: "USDC",
        },
        {
          address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          chainId: 1,
          name: "USDT",
        },
        {
          address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          chainId: 1,
          name: "Uniswap V2 Router",
        },
        {
          address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
          chainId: 1,
          name: "Aave V3 Pool",
        },
      ];
    } catch (error) {
      console.error("Error preloading popular contracts:", error);
    }
  }
}

// Export singleton instance
export const abiCachingService = new ABICachingServiceImpl();
