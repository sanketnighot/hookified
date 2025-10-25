import { ChainInfo } from '@/lib/types';

export const SUPPORTED_CHAINS: ChainInfo[] = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
    testnet: false,
  },
  {
    id: 11155111,
    name: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    testnet: true,
  },
  {
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com'],
    testnet: false,
  },
  {
    id: 97,
    name: 'BSC Testnet',
    nativeCurrency: {
      name: 'Test BNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    testnet: true,
  },
  {
    id: 137,
    name: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com'],
    testnet: false,
  },
  {
    id: 80002,
    name: 'Polygon Amoy',
    nativeCurrency: {
      name: 'Amoy MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology/'],
    blockExplorerUrls: ['https://amoy.polygonscan.com'],
    testnet: true,
  },
  {
    id: 8453,
    name: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    testnet: false,
  },
  {
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
    testnet: true,
  },
];

export function getChainById(chainId: number): ChainInfo | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
}

export function getChainName(chainId: number): string {
  const chain = getChainById(chainId);
  return chain?.name || `Chain ${chainId}`;
}

export function getNativeCurrencySymbol(chainId: number): string {
  const chain = getChainById(chainId);
  return chain?.nativeCurrency.symbol || 'ETH';
}

export function isTestnet(chainId: number): boolean {
  const chain = getChainById(chainId);
  return chain?.testnet || false;
}

export function getRpcUrl(chainId: number, apiKey?: string): string {
  const chain = getChainById(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  let rpcUrl = chain.rpcUrls[0];

  // Add API key for Infura/Alchemy URLs
  if (rpcUrl.includes('infura.io') && apiKey) {
    rpcUrl = rpcUrl.replace('v3/', `v3/${apiKey}`);
  }

  return rpcUrl;
}
