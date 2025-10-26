/**
 * User-friendly descriptions for common smart contract functions
 * This helps naive users understand what each function does without
 * needing to understand Solidity or blockchain technicalities
 */

export interface FunctionDescription {
  name: string;
  description: string;
  example: string;
  category: 'token-transfer' | 'token-management' | 'ownership' | 'utility' | 'approval' | 'other';
}

export const FUNCTION_DESCRIPTIONS: Record<string, FunctionDescription> = {
  // Token Transfer Functions
  'transfer': {
    name: 'transfer',
    description: 'Send tokens to another address',
    example: 'Send 10 tokens to 0x123...',
    category: 'token-transfer',
  },
  'transferFrom': {
    name: 'transferFrom',
    description: 'Send tokens on behalf of another address',
    example: 'Send tokens from Alice to Bob (requires approval)',
    category: 'token-transfer',
  },

  // Token Management Functions
  'mint': {
    name: 'mint',
    description: 'Create new tokens',
    example: 'Mint 100 new tokens to an address',
    category: 'token-management',
  },
  'burn': {
    name: 'burn',
    description: 'Destroy your own tokens',
    example: 'Burn 50 tokens from your balance',
    category: 'token-management',
  },
  'burnFrom': {
    name: 'burnFrom',
    description: 'Destroy tokens from another address',
    example: 'Burn tokens from a specific address',
    category: 'token-management',
  },

  // Approval Functions
  'approve': {
    name: 'approve',
    description: 'Allow another address to spend your tokens',
    example: 'Allow DEX to spend 1000 of your tokens',
    category: 'approval',
  },
  'permit': {
    name: 'permit',
    description: 'Approve tokens using a signature (gas-free approval)',
    example: 'Allow spending with a signed message',
    category: 'approval',
  },

  // Ownership Functions
  'transferOwnership': {
    name: 'transferOwnership',
    description: 'Transfer ownership of the contract',
    example: 'Transfer contract ownership to a new address',
    category: 'ownership',
  },
  'renounceOwnership': {
    name: 'renounceOwnership',
    description: 'Give up ownership permanently',
    example: 'Make the contract ownerless (cannot be undone)',
    category: 'ownership',
  },

  // Utility Functions
  'pause': {
    name: 'pause',
    description: 'Temporarily stop all token transfers',
    example: 'Emergency stop - halt all transfers',
    category: 'utility',
  },
  'unpause': {
    name: 'unpause',
    description: 'Resume token transfers',
    example: 'Re-enable transfers after a pause',
    category: 'utility',
  },
};

/**
 * Get a user-friendly description for a function
 */
export function getFunctionDescription(functionName: string): FunctionDescription | null {
  return FUNCTION_DESCRIPTIONS[functionName] || null;
}

/**
 * Get a simple, user-friendly name for function parameters
 */
export function getUserFriendlyParameterName(paramName: string, paramType: string): string {
  // Common parameter name mappings
  const mappings: Record<string, string> = {
    'to': 'Recipient Address',
    'from': 'Sender Address',
    'spender': 'Allowed Address',
    'owner': 'Token Owner',
    'account': 'Account Address',
    'recipient': 'Recipient Address',
    'amount': 'Amount (tokens)',
    'value': 'Amount (tokens)',
    'deadline': 'Expiration Time',
    'newOwner': 'New Owner Address',
  };

  // Return friendly name if mapped, otherwise capitalize
  return mappings[paramName.toLowerCase()] || paramName.charAt(0).toUpperCase() + paramName.slice(1);
}

/**
 * Get a simplified description of what a parameter accepts
 */
export function getParameterDescription(paramType: string): string {
  if (paramType.startsWith('address')) {
    return 'Ethereum address (0x...)';
  }
  if (paramType.startsWith('uint')) {
    return 'Number';
  }
  if (paramType.startsWith('int')) {
    return 'Integer';
  }
  if (paramType === 'bool') {
    return 'True or False';
  }
  if (paramType.startsWith('bytes')) {
    return 'Hex data';
  }
  if (paramType === 'string') {
    return 'Text';
  }
  return paramType;
}

