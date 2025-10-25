export interface ParsedError {
  code: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  category: 'gas' | 'validation' | 'execution' | 'network' | 'authentication' | 'unknown';
  suggestions: string[];
  documentation?: string;
  retryable: boolean;
}

export interface ErrorParserService {
  parseError(error: any, context?: {
    chainId?: number;
    contractAddress?: string;
    functionName?: string;
    gasLimit?: bigint;
    gasPrice?: bigint;
  }): ParsedError;
  getErrorSuggestions(error: ParsedError): string[];
  isRetryableError(error: ParsedError): boolean;
}

class ErrorParserServiceImpl implements ErrorParserService {
  private errorPatterns = new Map<string, ParsedError>([
    // Gas-related errors
    ['insufficient funds', {
      code: 'INSUFFICIENT_FUNDS',
      title: 'Insufficient Funds',
      message: 'Your account does not have enough ETH to cover the transaction cost',
      severity: 'error',
      category: 'gas',
      suggestions: [
        'Add more ETH to your account',
        'Reduce the transaction amount',
        'Lower the gas price',
        'Wait for gas prices to decrease'
      ],
      retryable: false
    }],
    ['gas required exceeds allowance', {
      code: 'GAS_LIMIT_TOO_LOW',
      title: 'Gas Limit Too Low',
      message: 'The gas limit is too low for this transaction',
      severity: 'error',
      category: 'gas',
      suggestions: [
        'Increase the gas limit',
        'Use a gas estimation service',
        'Try the transaction again with higher gas limit'
      ],
      retryable: true
    }],
    ['out of gas', {
      code: 'OUT_OF_GAS',
      title: 'Out of Gas',
      message: 'The transaction ran out of gas during execution',
      severity: 'error',
      category: 'gas',
      suggestions: [
        'Increase the gas limit significantly',
        'Check if the contract function is too complex',
        'Consider breaking the operation into smaller transactions'
      ],
      retryable: true
    }],

    // Execution errors
    ['execution reverted', {
      code: 'EXECUTION_REVERTED',
      title: 'Transaction Reverted',
      message: 'The contract execution was reverted',
      severity: 'error',
      category: 'execution',
      suggestions: [
        'Check the contract function requirements',
        'Verify all parameters are correct',
        'Ensure you have the necessary permissions',
        'Check if the contract is paused or has restrictions'
      ],
      retryable: false
    }],
    ['revert', {
      code: 'REVERT',
      title: 'Contract Reverted',
      message: 'The smart contract rejected the transaction',
      severity: 'error',
      category: 'execution',
      suggestions: [
        'Review the contract logic',
        'Check if conditions are met',
        'Verify token allowances',
        'Ensure sufficient token balance'
      ],
      retryable: false
    }],

    // Validation errors
    ['invalid signature', {
      code: 'INVALID_SIGNATURE',
      title: 'Invalid Signature',
      message: 'The transaction signature is invalid',
      severity: 'error',
      category: 'validation',
      suggestions: [
        'Re-sign the transaction',
        'Check your wallet connection',
        'Ensure you are using the correct account',
        'Try refreshing your wallet'
      ],
      retryable: true
    }],
    ['nonce too low', {
      code: 'NONCE_TOO_LOW',
      title: 'Nonce Too Low',
      message: 'The transaction nonce is too low',
      severity: 'error',
      category: 'validation',
      suggestions: [
        'Wait for pending transactions to complete',
        'Reset your wallet nonce',
        'Use a higher nonce value'
      ],
      retryable: true
    }],
    ['nonce too high', {
      code: 'NONCE_TOO_HIGH',
      title: 'Nonce Too High',
      message: 'The transaction nonce is too high',
      severity: 'error',
      category: 'validation',
      suggestions: [
        'Use the correct nonce value',
        'Check for missing transactions',
        'Reset your wallet nonce'
      ],
      retryable: true
    }],

    // Network errors
    ['network error', {
      code: 'NETWORK_ERROR',
      title: 'Network Error',
      message: 'Unable to connect to the blockchain network',
      severity: 'error',
      category: 'network',
      suggestions: [
        'Check your internet connection',
        'Try switching to a different RPC endpoint',
        'Wait a moment and try again',
        'Check if the network is experiencing issues'
      ],
      retryable: true
    }],
    ['timeout', {
      code: 'TIMEOUT',
      title: 'Request Timeout',
      message: 'The request timed out',
      severity: 'error',
      category: 'network',
      suggestions: [
        'Try again with higher gas price',
        'Check network congestion',
        'Use a different RPC provider',
        'Wait for network conditions to improve'
      ],
      retryable: true
    }],

    // Authentication errors
    ['unauthorized', {
      code: 'UNAUTHORIZED',
      title: 'Unauthorized',
      message: 'You do not have permission to perform this action',
      severity: 'error',
      category: 'authentication',
      suggestions: [
        'Check if you are the contract owner',
        'Verify you have the required role',
        'Ensure you have approved token spending',
        'Check if the contract requires specific permissions'
      ],
      retryable: false
    }],
    ['access denied', {
      code: 'ACCESS_DENIED',
      title: 'Access Denied',
      message: 'Access to this resource is denied',
      severity: 'error',
      category: 'authentication',
      suggestions: [
        'Verify your permissions',
        'Check if the contract is paused',
        'Ensure you have the required tokens',
        'Contact the contract administrator'
      ],
      retryable: false
    }]
  ]);

  parseError(error: any, context?: {
    chainId?: number;
    contractAddress?: string;
    functionName?: string;
    gasLimit?: bigint;
    gasPrice?: bigint;
  }): ParsedError {
    const errorMessage = this.extractErrorMessage(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Try to find a matching pattern
    for (const [pattern, parsedError] of this.errorPatterns) {
      if (lowerMessage.includes(pattern)) {
        return this.enhanceErrorWithContext(parsedError, context);
      }
    }

    // Check for specific error codes
    if (error.code) {
      const codeError = this.parseErrorCode(error.code, errorMessage);
      if (codeError) {
        return this.enhanceErrorWithContext(codeError, context);
      }
    }

    // Check for revert reasons
    const revertReason = this.extractRevertReason(errorMessage);
    if (revertReason) {
      return {
        code: 'CUSTOM_REVERT',
        title: 'Contract Reverted',
        message: `Contract reverted with reason: ${revertReason}`,
        severity: 'error',
        category: 'execution',
        suggestions: [
          'Check the contract documentation',
          'Verify all parameters are correct',
          'Ensure you meet the contract requirements',
          'Contact the contract developer for help'
        ],
        retryable: false
      };
    }

    // Default error
    return {
      code: 'UNKNOWN_ERROR',
      title: 'Unknown Error',
      message: errorMessage,
      severity: 'error',
      category: 'unknown',
      suggestions: [
        'Try the transaction again',
        'Check your network connection',
        'Verify all parameters are correct',
        'Contact support if the issue persists'
      ],
      retryable: true
    };
  }

  getErrorSuggestions(error: ParsedError): string[] {
    return error.suggestions;
  }

  isRetryableError(error: ParsedError): boolean {
    return error.retryable;
  }

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.data?.message) {
      return error.data.message;
    }

    if (error?.reason) {
      return error.reason;
    }

    return 'An unknown error occurred';
  }

  private extractRevertReason(message: string): string | null {
    // Common revert reason patterns
    const patterns = [
      /revert\s+(.+)/i,
      /execution reverted:\s*(.+)/i,
      /reverted\s+(.+)/i,
      /reason:\s*(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private parseErrorCode(code: string | number, message: string): ParsedError | null {
    const codeMap: Record<string, ParsedError> = {
      'INSUFFICIENT_FUNDS': {
        code: 'INSUFFICIENT_FUNDS',
        title: 'Insufficient Funds',
        message: 'Not enough ETH to cover transaction costs',
        severity: 'error',
        category: 'gas',
        suggestions: ['Add more ETH to your account', 'Reduce transaction amount'],
        retryable: false
      },
      'GAS_LIMIT_TOO_LOW': {
        code: 'GAS_LIMIT_TOO_LOW',
        title: 'Gas Limit Too Low',
        message: 'Increase the gas limit for this transaction',
        severity: 'error',
        category: 'gas',
        suggestions: ['Increase gas limit', 'Use gas estimation'],
        retryable: true
      },
      'NONCE_TOO_LOW': {
        code: 'NONCE_TOO_LOW',
        title: 'Nonce Too Low',
        message: 'Transaction nonce is too low',
        severity: 'error',
        category: 'validation',
        suggestions: ['Wait for pending transactions', 'Reset wallet nonce'],
        retryable: true
      },
      'NONCE_TOO_HIGH': {
        code: 'NONCE_TOO_HIGH',
        title: 'Nonce Too High',
        message: 'Transaction nonce is too high',
        severity: 'error',
        category: 'validation',
        suggestions: ['Use correct nonce', 'Check for missing transactions'],
        retryable: true
      }
    };

    return codeMap[String(code)] || null;
  }

  private enhanceErrorWithContext(error: ParsedError, context?: {
    chainId?: number;
    contractAddress?: string;
    functionName?: string;
    gasLimit?: bigint;
    gasPrice?: bigint;
  }): ParsedError {
    const enhanced = { ...error };

    // Add context-specific suggestions
    if (context?.chainId) {
      const chainName = this.getChainName(context.chainId);
      if (chainName) {
        enhanced.suggestions.push(`Check ${chainName} network status`);
      }
    }

    if (context?.functionName) {
      enhanced.suggestions.push(`Review the ${context.functionName} function requirements`);
    }

    if (context?.gasLimit && context?.gasPrice) {
      const gasCost = context.gasLimit * context.gasPrice;
      if (gasCost > BigInt('1000000000000000000')) { // 1 ETH
        enhanced.suggestions.push('Consider using a lower gas price');
      }
    }

    return enhanced;
  }

  private getChainName(chainId: number): string | null {
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      56: 'BSC',
      97: 'BSC Testnet',
      137: 'Polygon',
      80002: 'Polygon Amoy',
      8453: 'Base',
      84532: 'Base Sepolia',
    };

    return chainNames[chainId] || null;
  }

  // Utility methods
  addCustomErrorPattern(pattern: string, error: ParsedError): void {
    this.errorPatterns.set(pattern, error);
  }

  removeErrorPattern(pattern: string): void {
    this.errorPatterns.delete(pattern);
  }

  getAllErrorPatterns(): Map<string, ParsedError> {
    return new Map(this.errorPatterns);
  }
}

// Export singleton instance
export const errorParserService = new ErrorParserServiceImpl();
