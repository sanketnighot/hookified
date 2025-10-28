import { EventFilter } from '@/lib/types';

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'DeFi' | 'DAO' | 'NFT';
  events: PresetEvent[];
  popularContracts?: PopularContract[];
}

export interface PresetEvent {
  name: string;
  signature: string;
  description: string;
  parameterHints: Record<string, string>;
  isCommon?: boolean;
  filterExamples?: FilterExample[];
  abi: any; // Event ABI definition
}

export interface FilterExample {
  name: string;
  description: string;
  filters: EventFilter[];
}

export interface PopularContract {
  name: string;
  address: string;
  chainId: number;
  description: string;
  verified: boolean;
}

// ERC-20 Template
export const ERC20_EVENT_TEMPLATE: EventTemplate = {
  id: 'erc20-events',
  name: 'ERC-20 Token Events',
  description: 'Standard ERC-20 token events for transfers and approvals',
  category: 'ERC-20',
  events: [
    {
      name: 'Transfer',
      signature: 'Transfer(address indexed from, address indexed to, uint256 value)',
      description: 'Emitted when tokens are transferred between addresses',
      parameterHints: {
        from: 'Address sending tokens (indexed)',
        to: 'Address receiving tokens (indexed)',
        value: 'Amount of tokens transferred'
      },
      isCommon: true,
      filterExamples: [
        {
          name: 'Transfers from specific address',
          description: 'Monitor all outgoing transfers from an address',
          filters: [{
            parameter: 'from',
            parameterIndex: 0,
            operator: 'eq',
            value: '0x0000000000000000000000000000000000000000',
            indexed: true
          }]
        },
        {
          name: 'Large transfers',
          description: 'Monitor transfers above a certain amount',
          filters: [{
            parameter: 'value',
            parameterIndex: 2,
            operator: 'gte',
            value: '1000000000000000000', // 1 token (18 decimals)
            indexed: false
          }]
        }
      ],
      abi: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      }
    },
    {
      name: 'Approval',
      signature: 'Approval(address indexed owner, address indexed spender, uint256 value)',
      description: 'Emitted when an approval is granted or revoked',
      parameterHints: {
        owner: 'Token owner granting approval',
        spender: 'Address approved to spend tokens',
        value: 'Approved amount'
      },
      isCommon: true,
      abi: {
        type: 'event',
        name: 'Approval',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'spender', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      }
    }
  ],
  popularContracts: [
    {
      name: 'USDC',
      address: '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C',
      chainId: 1,
      verified: true,
      description: 'USD Coin - Stablecoin pegged to USD'
    },
    {
      name: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      chainId: 1,
      verified: true,
      description: 'Tether USD - Stablecoin pegged to USD'
    },
    {
      name: 'DAI',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      chainId: 1,
      verified: true,
      description: 'Dai Stablecoin - Decentralized stablecoin'
    },
    {
      name: 'WETH',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      chainId: 1,
      verified: true,
      description: 'Wrapped Ether - Wrapped ETH token'
    }
  ]
};

// ERC-721 Template
export const ERC721_EVENT_TEMPLATE: EventTemplate = {
  id: 'erc721-events',
  name: 'ERC-721 NFT Events',
  description: 'Standard ERC-721 NFT events for transfers and approvals',
  category: 'ERC-721',
  events: [
    {
      name: 'Transfer',
      signature: 'Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      description: 'Emitted when an NFT is transferred between addresses',
      parameterHints: {
        from: 'Previous owner address (indexed)',
        to: 'New owner address (indexed)',
        tokenId: 'NFT token ID (indexed)'
      },
      isCommon: true,
      filterExamples: [
        {
          name: 'Mints to address',
          description: 'Monitor NFTs minted to a specific address',
          filters: [{
            parameter: 'from',
            parameterIndex: 0,
            operator: 'eq',
            value: '0x0000000000000000000000000000000000000000',
            indexed: true
          }]
        },
        {
          name: 'Specific token transfers',
          description: 'Monitor transfers of a specific NFT token',
          filters: [{
            parameter: 'tokenId',
            parameterIndex: 2,
            operator: 'eq',
            value: '1',
            indexed: true
          }]
        }
      ],
      abi: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'tokenId', type: 'uint256', indexed: true }
        ]
      }
    },
    {
      name: 'Approval',
      signature: 'Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
      description: 'Emitted when an approval is granted for a specific NFT',
      parameterHints: {
        owner: 'NFT owner',
        approved: 'Address approved to transfer this NFT',
        tokenId: 'NFT token ID'
      },
      isCommon: true,
      abi: {
        type: 'event',
        name: 'Approval',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'approved', type: 'address', indexed: true },
          { name: 'tokenId', type: 'uint256', indexed: true }
        ]
      }
    },
    {
      name: 'ApprovalForAll',
      signature: 'ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
      description: 'Emitted when an operator is approved or revoked for all NFTs owned by an address',
      parameterHints: {
        owner: 'NFT owner',
        operator: 'Address approved/revoked as operator',
        approved: 'True if approved, false if revoked'
      },
      isCommon: false,
      abi: {
        type: 'event',
        name: 'ApprovalForAll',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'operator', type: 'address', indexed: true },
          { name: 'approved', type: 'bool', indexed: false }
        ]
      }
    }
  ],
  popularContracts: [
    {
      name: 'Bored Ape Yacht Club',
      address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      chainId: 1,
      verified: true,
      description: 'Bored Ape Yacht Club NFT Collection'
    },
    {
      name: 'CryptoPunks',
      address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
      chainId: 1,
      verified: true,
      description: 'CryptoPunks NFT Collection'
    }
  ]
};

// ERC-1155 Template
export const ERC1155_EVENT_TEMPLATE: EventTemplate = {
  id: 'erc1155-events',
  name: 'ERC-1155 Multi-Token Events',
  description: 'Standard ERC-1155 events for multi-token transfers and approvals',
  category: 'ERC-1155',
  events: [
    {
      name: 'TransferSingle',
      signature: 'TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
      description: 'Emitted when a single token type is transferred',
      parameterHints: {
        operator: 'Address performing the transfer',
        from: 'Source address',
        to: 'Destination address',
        id: 'Token ID being transferred',
        value: 'Amount being transferred'
      },
      isCommon: true,
      abi: {
        type: 'event',
        name: 'TransferSingle',
        inputs: [
          { name: 'operator', type: 'address', indexed: true },
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'id', type: 'uint256', indexed: false },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      }
    },
    {
      name: 'TransferBatch',
      signature: 'TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
      description: 'Emitted when multiple token types are transferred in a batch',
      parameterHints: {
        operator: 'Address performing the transfer',
        from: 'Source address',
        to: 'Destination address',
        ids: 'Array of token IDs',
        values: 'Array of amounts'
      },
      isCommon: false,
      abi: {
        type: 'event',
        name: 'TransferBatch',
        inputs: [
          { name: 'operator', type: 'address', indexed: true },
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'ids', type: 'uint256[]', indexed: false },
          { name: 'values', type: 'uint256[]', indexed: false }
        ]
      }
    }
  ],
  popularContracts: []
};

// Uniswap V2 Template
export const UNISWAP_V2_EVENT_TEMPLATE: EventTemplate = {
  id: 'uniswap-v2-events',
  name: 'Uniswap V2 DEX Events',
  description: 'Uniswap V2 DEX events for swaps and liquidity operations',
  category: 'DeFi',
  events: [
    {
      name: 'Swap',
      signature: 'Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
      description: 'Emitted when tokens are swapped on Uniswap V2',
      parameterHints: {
        sender: 'Address initiating the swap',
        amount0In: 'Amount of token0 sent in',
        amount1In: 'Amount of token1 sent in',
        amount0Out: 'Amount of token0 received',
        amount1Out: 'Amount of token1 received',
        to: 'Recipient of output tokens'
      },
      isCommon: true,
      abi: {
        type: 'event',
        name: 'Swap',
        inputs: [
          { name: 'sender', type: 'address', indexed: true },
          { name: 'amount0In', type: 'uint256', indexed: false },
          { name: 'amount1In', type: 'uint256', indexed: false },
          { name: 'amount0Out', type: 'uint256', indexed: false },
          { name: 'amount1Out', type: 'uint256', indexed: false },
          { name: 'to', type: 'address', indexed: true }
        ]
      }
    },
    {
      name: 'Mint',
      signature: 'Mint(address indexed sender, uint256 amount0, uint256 amount1)',
      description: 'Emitted when liquidity is added to a pair',
      parameterHints: {
        sender: 'Address providing liquidity',
        amount0: 'Amount of token0 added',
        amount1: 'Amount of token1 added'
      },
      isCommon: true,
      abi: {
        type: 'event',
        name: 'Mint',
        inputs: [
          { name: 'sender', type: 'address', indexed: true },
          { name: 'amount0', type: 'uint256', indexed: false },
          { name: 'amount1', type: 'uint256', indexed: false }
        ]
      }
    },
    {
      name: 'Burn',
      signature: 'Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)',
      description: 'Emitted when liquidity is removed from a pair',
      parameterHints: {
        sender: 'Address removing liquidity',
        amount0: 'Amount of token0 removed',
        amount1: 'Amount of token1 removed',
        to: 'Recipient of removed tokens'
      },
      isCommon: false,
      abi: {
        type: 'event',
        name: 'Burn',
        inputs: [
          { name: 'sender', type: 'address', indexed: true },
          { name: 'amount0', type: 'uint256', indexed: false },
          { name: 'amount1', type: 'uint256', indexed: false },
          { name: 'to', type: 'address', indexed: true }
        ]
      }
    }
  ],
  popularContracts: [
    {
      name: 'Uniswap V2 Router',
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      chainId: 1,
      verified: true,
      description: 'Uniswap V2 Router for token swaps'
    }
  ]
};

// Combine all templates
export const ALL_EVENT_TEMPLATES: EventTemplate[] = [
  ERC20_EVENT_TEMPLATE,
  ERC721_EVENT_TEMPLATE,
  ERC1155_EVENT_TEMPLATE,
  UNISWAP_V2_EVENT_TEMPLATE
];

// Template utility functions
export function getEventTemplateById(id: string): EventTemplate | undefined {
  return ALL_EVENT_TEMPLATES.find(template => template.id === id);
}

export function getEventTemplatesByCategory(category: string): EventTemplate[] {
  return ALL_EVENT_TEMPLATES.filter(template => template.category === category);
}

export function getPresetEventByName(templateId: string, eventName: string): PresetEvent | undefined {
  const template = getEventTemplateById(templateId);
  return template?.events.find(event => event.name === eventName);
}

export function getPopularEvents(): PresetEvent[] {
  const popular: PresetEvent[] = [];
  ALL_EVENT_TEMPLATES.forEach(template => {
    template.events
      .filter(event => event.isCommon)
      .forEach(event => popular.push(event));
  });
  return popular;
}

