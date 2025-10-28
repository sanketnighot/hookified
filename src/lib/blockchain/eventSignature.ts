import { keccak256, toBytes, toHex } from 'viem';

/**
 * Compute the event signature hash (topics[0]) from event name and parameter types
 * Example: computeEventSignature('Transfer', ['address', 'address', 'uint256'])
 * Returns: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 */
export function computeEventSignature(eventName: string, params?: string[]): string {
  if (!params || params.length === 0) {
    // Return hash of just the event name (unlikely to match actual events, but keeps it simple)
    const signature = toBytes(eventName);
    return keccak256(signature);
  }

  // Build signature string: EventName(type1,type2,...)
  const paramsStr = params.join(',');
  const signatureString = `${eventName}(${paramsStr})`;

  // Convert to bytes and hash
  const signature = toBytes(signatureString);
  return keccak256(signature);
}

/**
 * Compute keccak256 hash of a string
 */
export function computeHash(data: string): string {
  return keccak256(toBytes(data));
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  return toBytes(hex);
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return toHex(bytes);
}

/**
 * Standard event signatures for common ERC events
 */
export const ERC20_EVENT_SIGNATURES = {
  Transfer: computeEventSignature('Transfer', ['address', 'address', 'uint256']),
  Approval: computeEventSignature('Approval', ['address', 'address', 'uint256']),
};

export const ERC721_EVENT_SIGNATURES = {
  Transfer: computeEventSignature('Transfer', ['address', 'address', 'uint256']),
  Approval: computeEventSignature('Approval', ['address', 'address', 'uint256']),
  ApprovalForAll: computeEventSignature('ApprovalForAll', ['address', 'address', 'bool']),
};

/**
 * Get event signature hash for a known event
 */
export function getKnownEventSignature(eventName: string): string | undefined {
  const allSignatures = {
    ...ERC20_EVENT_SIGNATURES,
    ...ERC721_EVENT_SIGNATURES,
  };

  return allSignatures[eventName as keyof typeof allSignatures];
}

