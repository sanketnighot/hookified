
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ERC-20' | 'ERC-721' | 'DeFi' | 'DAO' | 'NFT' | 'Utility';
  abi: any[];
  presetFunctions: PresetFunction[];
  popularContracts?: PopularContract[];
}

export interface PresetFunction {
  name: string;
  signature: string;
  description: string;
  parameterHints: Record<string, string>;
  isCommon?: boolean;
  examples?: FunctionExample[];
}

export interface FunctionExample {
  name: string;
  description: string;
  parameters: any[];
  explanation: string;
}

export interface PopularContract {
  name: string;
  address: string;
  chainId: number;
  description: string;
  verified: boolean;
}

// ERC-20 Token Templates
export const ERC20_TEMPLATES: ContractTemplate[] = [
  {
    id: 'erc20-basic',
    name: 'ERC-20 Token',
    description: 'Standard ERC-20 token with transfer, approve, and allowance functions',
    category: 'ERC-20',
    abi: [
      {
        "type": "function",
        "name": "transfer",
        "inputs": [
          { "name": "to", "type": "address" },
          { "name": "amount", "type": "uint256" }
        ],
        "outputs": [{ "type": "bool" }],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "approve",
        "inputs": [
          { "name": "spender", "type": "address" },
          { "name": "amount", "type": "uint256" }
        ],
        "outputs": [{ "type": "bool" }],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "transferFrom",
        "inputs": [
          { "name": "from", "type": "address" },
          { "name": "to", "type": "address" },
          { "name": "amount", "type": "uint256" }
        ],
        "outputs": [{ "type": "bool" }],
        "stateMutability": "nonpayable"
      }
    ],
    presetFunctions: [
      {
        name: 'transfer',
        signature: 'transfer(address to, uint256 amount)',
        description: 'Transfer tokens to another address',
        parameterHints: {
          to: 'Recipient address',
          amount: 'Amount to transfer (in token units)'
        },
        isCommon: true,
        examples: [
          {
            name: 'Send 100 tokens',
            description: 'Transfer 100 tokens to a recipient',
            parameters: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', '100000000000000000000'],
            explanation: 'Sends 100 tokens (assuming 18 decimals) to the specified address'
          }
        ]
      },
      {
        name: 'approve',
        signature: 'approve(address spender, uint256 amount)',
        description: 'Approve another address to spend your tokens',
        parameterHints: {
          spender: 'Address to approve',
          amount: 'Maximum amount they can spend'
        },
        isCommon: true,
        examples: [
          {
            name: 'Approve DEX',
            description: 'Approve a DEX to spend your tokens',
            parameters: ['0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '1000000000000000000000'],
            explanation: 'Allows Uniswap V2 Router to spend up to 1000 tokens'
          }
        ]
      },
      {
        name: 'transferFrom',
        signature: 'transferFrom(address from, address to, uint256 amount)',
        description: 'Transfer tokens on behalf of another address (requires approval)',
        parameterHints: {
          from: 'Address to transfer from',
          to: 'Address to transfer to',
          amount: 'Amount to transfer'
        },
        isCommon: false
      }
    ],
    popularContracts: [
      {
        name: 'USDC',
        address: '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C',
        chainId: 1,
        description: 'USD Coin - Stablecoin pegged to USD',
        verified: true
      },
      {
        name: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        chainId: 1,
        description: 'Tether USD - Stablecoin pegged to USD',
        verified: true
      }
    ]
  }
];

// ERC-721 NFT Templates
export const ERC721_TEMPLATES: ContractTemplate[] = [
  {
    id: 'erc721-basic',
    name: 'ERC-721 NFT',
    description: 'Standard ERC-721 NFT with transfer, approve, and ownership functions',
    category: 'ERC-721',
    abi: [
      {
        "type": "function",
        "name": "transferFrom",
        "inputs": [
          { "name": "from", "type": "address" },
          { "name": "to", "type": "address" },
          { "name": "tokenId", "type": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "safeTransferFrom",
        "inputs": [
          { "name": "from", "type": "address" },
          { "name": "to", "type": "address" },
          { "name": "tokenId", "type": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "approve",
        "inputs": [
          { "name": "to", "type": "address" },
          { "name": "tokenId", "type": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "setApprovalForAll",
        "inputs": [
          { "name": "operator", "type": "address" },
          { "name": "approved", "type": "bool" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      }
    ],
    presetFunctions: [
      {
        name: 'transferFrom',
        signature: 'transferFrom(address from, address to, uint256 tokenId)',
        description: 'Transfer an NFT to another address',
        parameterHints: {
          from: 'Current owner address',
          to: 'New owner address',
          tokenId: 'ID of the NFT to transfer'
        },
        isCommon: true,
        examples: [
          {
            name: 'Transfer NFT',
            description: 'Transfer NFT #123 to a new owner',
            parameters: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', '0x8ba1f109551bD432803012645Hac136c', '123'],
            explanation: 'Transfers NFT with ID 123 from the current owner to the new address'
          }
        ]
      },
      {
        name: 'approve',
        signature: 'approve(address to, uint256 tokenId)',
        description: 'Approve another address to transfer a specific NFT',
        parameterHints: {
          to: 'Address to approve',
          tokenId: 'ID of the NFT to approve'
        },
        isCommon: true
      },
      {
        name: 'setApprovalForAll',
        signature: 'setApprovalForAll(address operator, bool approved)',
        description: 'Approve or revoke approval for an operator to manage all your NFTs',
        parameterHints: {
          operator: 'Address to approve/revoke',
          approved: 'true to approve, false to revoke'
        },
        isCommon: false
      }
    ],
    popularContracts: [
      {
        name: 'Bored Ape Yacht Club',
        address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        chainId: 1,
        description: 'Bored Ape Yacht Club NFT Collection',
        verified: true
      }
    ]
  }
];

// DeFi Templates
export const DEFI_TEMPLATES: ContractTemplate[] = [
  {
    id: 'uniswap-v2',
    name: 'Uniswap V2',
    description: 'Uniswap V2 DEX for token swaps and liquidity provision',
    category: 'DeFi',
    abi: [
      {
        "type": "function",
        "name": "swapExactTokensForTokens",
        "inputs": [
          { "name": "amountIn", "type": "uint256" },
          { "name": "amountOutMin", "type": "uint256" },
          { "name": "path", "type": "address[]" },
          { "name": "to", "type": "address" },
          { "name": "deadline", "type": "uint256" }
        ],
        "outputs": [{ "name": "amounts", "type": "uint256[]" }],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "addLiquidity",
        "inputs": [
          { "name": "tokenA", "type": "address" },
          { "name": "tokenB", "type": "address" },
          { "name": "amountADesired", "type": "uint256" },
          { "name": "amountBDesired", "type": "uint256" },
          { "name": "amountAMin", "type": "uint256" },
          { "name": "amountBMin", "type": "uint256" },
          { "name": "to", "type": "address" },
          { "name": "deadline", "type": "uint256" }
        ],
        "outputs": [
          { "name": "amountA", "type": "uint256" },
          { "name": "amountB", "type": "uint256" },
          { "name": "liquidity", "type": "uint256" }
        ],
        "stateMutability": "nonpayable"
      }
    ],
    presetFunctions: [
      {
        name: 'swapExactTokensForTokens',
        signature: 'swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
        description: 'Swap exact amount of tokens for another token',
        parameterHints: {
          amountIn: 'Exact amount of input tokens',
          amountOutMin: 'Minimum amount of output tokens (slippage protection)',
          path: 'Array of token addresses [tokenIn, tokenOut]',
          to: 'Recipient address',
          deadline: 'Transaction deadline (timestamp)'
        },
        isCommon: true,
        examples: [
          {
            name: 'Swap USDC for ETH',
            description: 'Swap 100 USDC for ETH',
            parameters: [
              '100000000', // 100 USDC (6 decimals)
              '50000000000000000', // 0.05 ETH minimum
              ['0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'], // USDC -> WETH
              '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
              Math.floor(Date.now() / 1000) + 1800 // 30 minutes from now
            ],
            explanation: 'Swaps exactly 100 USDC for ETH with 0.05 ETH minimum output'
          }
        ]
      },
      {
        name: 'addLiquidity',
        signature: 'addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline)',
        description: 'Add liquidity to a token pair',
        parameterHints: {
          tokenA: 'First token address',
          tokenB: 'Second token address',
          amountADesired: 'Desired amount of token A',
          amountBDesired: 'Desired amount of token B',
          amountAMin: 'Minimum amount of token A',
          amountBMin: 'Minimum amount of token B',
          to: 'Recipient of LP tokens',
          deadline: 'Transaction deadline'
        },
        isCommon: false
      }
    ],
    popularContracts: [
      {
        name: 'Uniswap V2 Router',
        address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        chainId: 1,
        description: 'Uniswap V2 Router for token swaps',
        verified: true
      }
    ]
  },
  {
    id: 'aave-v3',
    name: 'Aave V3',
    description: 'Aave V3 lending protocol for supplying and borrowing assets',
    category: 'DeFi',
    abi: [
      {
        "type": "function",
        "name": "supply",
        "inputs": [
          { "name": "asset", "type": "address" },
          { "name": "amount", "type": "uint256" },
          { "name": "onBehalfOf", "type": "address" },
          { "name": "referralCode", "type": "uint16" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "withdraw",
        "inputs": [
          { "name": "asset", "type": "address" },
          { "name": "amount", "type": "uint256" },
          { "name": "to", "type": "address" }
        ],
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "borrow",
        "inputs": [
          { "name": "asset", "type": "address" },
          { "name": "amount", "type": "uint256" },
          { "name": "interestRateMode", "type": "uint256" },
          { "name": "referralCode", "type": "uint16" },
          { "name": "onBehalfOf", "type": "address" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      }
    ],
    presetFunctions: [
      {
        name: 'supply',
        signature: 'supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
        description: 'Supply assets to earn interest',
        parameterHints: {
          asset: 'Token address to supply',
          amount: 'Amount to supply',
          onBehalfOf: 'Address to receive aTokens',
          referralCode: 'Referral code (0 for none)'
        },
        isCommon: true,
        examples: [
          {
            name: 'Supply USDC',
            description: 'Supply 1000 USDC to earn interest',
            parameters: [
              '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C', // USDC
              '1000000000', // 1000 USDC (6 decimals)
              '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Your address
              0 // No referral
            ],
            explanation: 'Supplies 1000 USDC to Aave to earn interest'
          }
        ]
      },
      {
        name: 'withdraw',
        signature: 'withdraw(address asset, uint256 amount, address to)',
        description: 'Withdraw supplied assets',
        parameterHints: {
          asset: 'Token address to withdraw',
          amount: 'Amount to withdraw (type(-1) for max)',
          to: 'Recipient address'
        },
        isCommon: true
      },
      {
        name: 'borrow',
        signature: 'borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
        description: 'Borrow assets against collateral',
        parameterHints: {
          asset: 'Token address to borrow',
          amount: 'Amount to borrow',
          interestRateMode: '1 for stable, 2 for variable',
          referralCode: 'Referral code (0 for none)',
          onBehalfOf: 'Address to receive borrowed tokens'
        },
        isCommon: false
      }
    ],
    popularContracts: [
      {
        name: 'Aave V3 Pool',
        address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        chainId: 1,
        description: 'Aave V3 Lending Pool',
        verified: true
      }
    ]
  }
];

// Combine all templates
export const ALL_TEMPLATES: ContractTemplate[] = [
  ...ERC20_TEMPLATES,
  ...ERC721_TEMPLATES,
  ...DEFI_TEMPLATES
];

// Template utility functions
export function getTemplateById(id: string): ContractTemplate | undefined {
  return ALL_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): ContractTemplate[] {
  return ALL_TEMPLATES.filter(template => template.category === category);
}

export function getPopularTemplates(): ContractTemplate[] {
  return ALL_TEMPLATES.filter(template =>
    template.presetFunctions.some(func => func.isCommon)
  );
}

export function getPresetFunction(templateId: string, functionName: string): PresetFunction | undefined {
  const template = getTemplateById(templateId);
  return template?.presetFunctions.find(func => func.name === functionName);
}

export function getPopularContracts(chainId?: number): PopularContract[] {
  const contracts: PopularContract[] = [];

  ALL_TEMPLATES.forEach(template => {
    if (template.popularContracts) {
      template.popularContracts.forEach(contract => {
        if (!chainId || contract.chainId === chainId) {
          contracts.push({
            ...contract,
            name: `${template.name} - ${contract.name}`
          });
        }
      });
    }
  });

  return contracts;
}
