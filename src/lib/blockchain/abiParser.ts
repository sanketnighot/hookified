import { FunctionDefinition, InputParameter, ParsedABI } from '@/lib/types';

/**
 * Parse raw ABI and extract useful information
 */
export function parseABI(abi: any[]): ParsedABI {
  const functions: FunctionDefinition[] = [];
  const events: any[] = [];

  for (const item of abi) {
    if (item.type === 'function') {
      functions.push(item as FunctionDefinition);
    } else if (item.type === 'event') {
      events.push(item);
    }
  }

  return {
    functions,
    events,
    isERC20: detectERC20Functions(abi),
    isERC721: detectERC721Functions(abi),
  };
}

/**
 * Extract only write functions (non-view, non-pure)
 */
export function getWriteFunctions(abi: any[]): FunctionDefinition[] {
  const parsed = parseABI(abi);
  return parsed.functions.filter(
    (func) => func.stateMutability !== 'view' && func.stateMutability !== 'pure'
  );
}

/**
 * Get function input parameters
 */
export function getFunctionInputs(func: FunctionDefinition): InputParameter[] {
  return func.inputs || [];
}

/**
 * Generate human-readable function signature
 */
export function generateFunctionSignature(func: FunctionDefinition): string {
  const inputs = func.inputs.map((input) => `${input.type} ${input.name || ''}`).join(', ');
  return `${func.name}(${inputs})`;
}

/**
 * Generate function signature without parameter names (for matching)
 */
export function generateFunctionSelector(func: FunctionDefinition): string {
  const inputs = func.inputs.map((input) => input.type).join(',');
  return `${func.name}(${inputs})`;
}

/**
 * Check if contract implements ERC-20 standard
 */
export function detectERC20Functions(abi: any[]): boolean {
  const requiredFunctions = [
    'transfer',
    'approve',
    'transferFrom',
    'allowance',
    'balanceOf',
    'totalSupply',
  ];

  const functionNames = abi
    .filter((item) => item.type === 'function')
    .map((item) => item.name);

  return requiredFunctions.every((func) => functionNames.includes(func));
}

/**
 * Check if contract implements ERC-721 standard
 */
export function detectERC721Functions(abi: any[]): boolean {
  const requiredFunctions = [
    'transferFrom',
    'safeTransferFrom',
    'approve',
    'setApprovalForAll',
    'getApproved',
    'isApprovedForAll',
    'ownerOf',
    'balanceOf',
  ];

  const functionNames = abi
    .filter((item) => item.type === 'function')
    .map((item) => item.name);

  return requiredFunctions.every((func) => functionNames.includes(func));
}

/**
 * Get function by name from ABI
 */
export function getFunctionByName(abi: any[], functionName: string): FunctionDefinition | null {
  const parsed = parseABI(abi);
  return parsed.functions.find((func) => func.name === functionName) || null;
}

/**
 * Get function by signature from ABI
 */
export function getFunctionBySignature(abi: any[], signature: string): FunctionDefinition | null {
  const parsed = parseABI(abi);
  return parsed.functions.find((func) => generateFunctionSelector(func) === signature) || null;
}

/**
 * Check if a function is payable
 */
export function isPayableFunction(func: FunctionDefinition): boolean {
  return func.stateMutability === 'payable';
}

/**
 * Check if a function is view/pure (read-only)
 */
export function isReadOnlyFunction(func: FunctionDefinition): boolean {
  return func.stateMutability === 'view' || func.stateMutability === 'pure';
}

/**
 * Get all events from ABI
 */
export function getEvents(abi: any[]): any[] {
  return abi.filter((item) => item.type === 'event');
}

/**
 * Get event by name from ABI
 */
export function getEventByName(abi: any[], eventName: string): any | null {
  const events = getEvents(abi);
  return events.find((event) => event.name === eventName) || null;
}

/**
 * Validate function parameters against ABI
 */
export function validateFunctionParameters(
  func: FunctionDefinition,
  parameters: any[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const expectedInputs = func.inputs;

  if (parameters.length !== expectedInputs.length) {
    errors.push(
      `Expected ${expectedInputs.length} parameters, got ${parameters.length}`
    );
    return { isValid: false, errors };
  }

  for (let i = 0; i < expectedInputs.length; i++) {
    const expected = expectedInputs[i];
    const provided = parameters[i];

    if (!validateParameterType(expected.type, provided)) {
      errors.push(
        `Parameter ${i + 1} (${expected.name || 'unnamed'}): expected ${expected.type}, got ${typeof provided}`
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate parameter type
 */
function validateParameterType(expectedType: string, value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  // Handle address type
  if (expectedType === 'address') {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
  }

  // Handle uint types
  if (expectedType.startsWith('uint')) {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint';
  }

  // Handle int types
  if (expectedType.startsWith('int')) {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint';
  }

  // Handle bool type
  if (expectedType === 'bool') {
    return typeof value === 'boolean';
  }

  // Handle string type
  if (expectedType === 'string') {
    return typeof value === 'string';
  }

  // Handle bytes types
  if (expectedType.startsWith('bytes')) {
    return typeof value === 'string' && /^0x[a-fA-F0-9]*$/.test(value);
  }

  // Handle array types
  if (expectedType.endsWith('[]')) {
    return Array.isArray(value);
  }

  // Default to true for other types (let the blockchain handle validation)
  return true;
}

/**
 * Format function parameters for display
 */
export function formatFunctionParameters(func: FunctionDefinition): string {
  return func.inputs
    .map((input, index) => {
      const name = input.name || `param${index + 1}`;
      return `${input.type} ${name}`;
    })
    .join(', ');
}

/**
 * Get parameter placeholder text
 */
export function getParameterPlaceholder(param: InputParameter): string {
  switch (param.type) {
    case 'address':
      return '0x...';
    case 'uint256':
    case 'uint':
      return '0';
    case 'bool':
      return 'true/false';
    case 'string':
      return 'Enter text...';
    case 'bytes':
      return '0x...';
    default:
      if (param.type.endsWith('[]')) {
        return '[]';
      }
      return 'Enter value...';
  }
}

/**
 * Get parameter description based on common patterns
 */
export function getParameterDescription(param: InputParameter, functionName: string): string {
  const name = param.name?.toLowerCase() || '';
  const type = param.type;

  // Common parameter patterns
  if (name.includes('to') || name.includes('recipient')) {
    return 'Recipient address';
  }
  if (name.includes('from') || name.includes('sender')) {
    return 'Sender address';
  }
  if (name.includes('amount') || name.includes('value')) {
    return type.startsWith('uint') ? 'Amount to transfer' : 'Value to send';
  }
  if (name.includes('spender') || name.includes('operator')) {
    return 'Address to approve';
  }
  if (name.includes('tokenid') || name.includes('token_id')) {
    return 'Token ID';
  }
  if (name.includes('deadline')) {
    return 'Transaction deadline (timestamp)';
  }
  if (name.includes('slippage')) {
    return 'Maximum slippage tolerance';
  }

  // Type-based descriptions
  switch (type) {
    case 'address':
      return 'Ethereum address';
    case 'uint256':
    case 'uint':
      return 'Numeric value';
    case 'bool':
      return 'Boolean value (true/false)';
    case 'string':
      return 'Text value';
    case 'bytes':
      return 'Hex-encoded data';
    default:
      return `${type} value`;
  }
}
