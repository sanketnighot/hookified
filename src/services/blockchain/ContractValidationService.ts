import { FunctionDefinition, InputParameter } from '@/lib/types';
import { isAddress, isHex } from 'viem';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ParameterValidationResult {
  parameter: InputParameter;
  value: any;
  isValid: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
}

export interface ContractValidationService {
  validateAddress(address: string): ValidationResult;
  validateUint(value: string, type: string): ValidationResult;
  validateBytes(value: string, type: string): ValidationResult;
  validateArray(value: any[], itemType: string): ValidationResult;
  validateFunctionParameters(
    functionDef: FunctionDefinition,
    parameters: any[]
  ): ParameterValidationResult[];
  validateContractAddress(address: string, chainId: number): Promise<ValidationResult>;
  validateTransactionValue(value: bigint, chainId: number): ValidationResult;
  validateGasLimit(gasLimit: bigint, estimatedGas: bigint): ValidationResult;
}

class ContractValidationServiceImpl implements ContractValidationService {
  private readonly MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  private readonly MAX_INT256 = BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  private readonly MIN_INT256 = BigInt('-0x8000000000000000000000000000000000000000000000000000000000000000');

  validateAddress(address: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!address) {
      errors.push('Address is required');
      return { isValid: false, errors, warnings, suggestions };
    }

    if (!isAddress(address)) {
      errors.push('Invalid address format');
      suggestions.push('Address should be a valid Ethereum address (0x followed by 40 hex characters)');
      return { isValid: false, errors, warnings, suggestions };
    }

    // Check for common issues
    if (address === '0x0000000000000000000000000000000000000000') {
      warnings.push('Using zero address - this will likely cause transaction failure');
    }

    if (address === '0x000000000000000000000000000000000000dEaD') {
      warnings.push('Using dead address - tokens sent here will be permanently lost');
    }

    // Check for checksum
    if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
      if (address !== this.toChecksumAddress(address)) {
        warnings.push('Address checksum is invalid');
        suggestions.push(`Use checksummed address: ${this.toChecksumAddress(address)}`);
      }
    }

    return { isValid: true, errors, warnings, suggestions };
  }

  validateUint(value: string, type: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!value) {
      errors.push('Value is required');
      return { isValid: false, errors, warnings, suggestions };
    }

    try {
      const bigIntValue = BigInt(value);

      // Check bounds based on type
      if (type.startsWith('uint')) {
        const bits = parseInt(type.replace('uint', ''));

        if (bits === 8) {
          if (bigIntValue > BigInt(255)) {
            errors.push('Value exceeds uint8 maximum (255)');
          }
        } else if (bits === 16) {
          if (bigIntValue > BigInt(65535)) {
            errors.push('Value exceeds uint16 maximum (65,535)');
          }
        } else if (bits === 32) {
          if (bigIntValue > BigInt(4294967295)) {
            errors.push('Value exceeds uint32 maximum (4,294,967,295)');
          }
        } else if (bits === 64) {
          if (bigIntValue > BigInt('18446744073709551615')) {
            errors.push('Value exceeds uint64 maximum');
          }
        } else if (bits === 128) {
          if (bigIntValue > BigInt('340282366920938463463374607431768211455')) {
            errors.push('Value exceeds uint128 maximum');
          }
        } else if (bits === 256) {
          if (bigIntValue > this.MAX_UINT256) {
            errors.push('Value exceeds uint256 maximum');
          }
        }

        if (bigIntValue < BigInt(0)) {
          errors.push('Unsigned integer cannot be negative');
        }
      } else if (type.startsWith('int')) {
        const bits = parseInt(type.replace('int', ''));

        if (bits === 8) {
          if (bigIntValue > BigInt(127) || bigIntValue < BigInt(-128)) {
            errors.push('Value exceeds int8 range (-128 to 127)');
          }
        } else if (bits === 16) {
          if (bigIntValue > BigInt(32767) || bigIntValue < BigInt(-32768)) {
            errors.push('Value exceeds int16 range (-32,768 to 32,767)');
          }
        } else if (bits === 32) {
          if (bigIntValue > BigInt(2147483647) || bigIntValue < BigInt(-2147483648)) {
            errors.push('Value exceeds int32 range');
          }
        } else if (bits === 64) {
          if (bigIntValue > BigInt('9223372036854775807') || bigIntValue < BigInt('-9223372036854775808')) {
            errors.push('Value exceeds int64 range');
          }
        } else if (bits === 128) {
          if (bigIntValue > BigInt('170141183460469231731687303715884105727') || bigIntValue < BigInt('-170141183460469231731687303715884105728')) {
            errors.push('Value exceeds int128 range');
          }
        } else if (bits === 256) {
          if (bigIntValue > this.MAX_INT256 || bigIntValue < this.MIN_INT256) {
            errors.push('Value exceeds int256 range');
          }
        }
      }

      // Add warnings for large values
      if (bigIntValue > BigInt('1000000000000000000000000')) { // 1M tokens with 18 decimals
        warnings.push('Very large value detected - double-check the amount');
      }

      if (bigIntValue === BigInt(0)) {
        warnings.push('Zero value - ensure this is intentional');
      }

    } catch (error) {
      errors.push('Invalid number format');
      suggestions.push('Enter a valid integer value');
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  validateBytes(value: string, type: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!value) {
      errors.push('Value is required');
      return { isValid: false, errors, warnings, suggestions };
    }

    if (!isHex(value)) {
      errors.push('Invalid hex format');
      suggestions.push('Value should be a valid hex string starting with 0x');
      return { isValid: false, errors, warnings, suggestions };
    }

    // Check length based on type
    if (type.startsWith('bytes')) {
      const length = parseInt(type.replace('bytes', ''));
      const hexLength = (value.length - 2) / 2; // Remove 0x and divide by 2

      if (hexLength !== length) {
        errors.push(`Expected ${length} bytes, got ${hexLength}`);
        suggestions.push(`Use exactly ${length} bytes (${length * 2} hex characters)`);
      }
    } else if (type === 'bytes') {
      // Dynamic bytes - no length restriction
      if (value.length < 2) {
        errors.push('Empty bytes value');
      }
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  validateArray(value: any[], itemType: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!Array.isArray(value)) {
      errors.push('Value must be an array');
      return { isValid: false, errors, warnings, suggestions };
    }

    if (value.length === 0) {
      warnings.push('Empty array - ensure this is intentional');
    }

    if (value.length > 100) {
      warnings.push('Large array detected - this may cause high gas costs');
    }

    // Validate each item
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      let itemValidation: ValidationResult;

      if (itemType.startsWith('uint') || itemType.startsWith('int')) {
        itemValidation = this.validateUint(String(item), itemType);
      } else if (itemType.startsWith('bytes')) {
        itemValidation = this.validateBytes(item, itemType);
      } else if (itemType === 'address') {
        itemValidation = this.validateAddress(item);
      } else {
        // For other types, basic validation
        itemValidation = { isValid: true, errors: [], warnings: [], suggestions: [] };
      }

      if (!itemValidation.isValid) {
        errors.push(`Item ${i}: ${itemValidation.errors.join(', ')}`);
      }

      warnings.push(...itemValidation.warnings.map(w => `Item ${i}: ${w}`));
      suggestions.push(...itemValidation.suggestions.map(s => `Item ${i}: ${s}`));
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  validateFunctionParameters(
    functionDef: FunctionDefinition,
    parameters: any[]
  ): ParameterValidationResult[] {
    const results: ParameterValidationResult[] = [];

    for (let i = 0; i < functionDef.inputs.length; i++) {
      const input = functionDef.inputs[i];
      const value = parameters[i];
      const result: ParameterValidationResult = {
        parameter: input,
        value,
        isValid: true,
      };

      let validation: ValidationResult;

      if (input.type.startsWith('address')) {
        validation = this.validateAddress(value);
      } else if (input.type.startsWith('uint') || input.type.startsWith('int')) {
        validation = this.validateUint(String(value), input.type);
      } else if (input.type.startsWith('bytes')) {
        validation = this.validateBytes(value, input.type);
      } else if (input.type.endsWith('[]')) {
        const itemType = input.type.slice(0, -2);
        validation = this.validateArray(value, itemType);
      } else if (input.type === 'bool') {
        validation = { isValid: typeof value === 'boolean', errors: [], warnings: [], suggestions: [] };
        if (!validation.isValid) {
          validation.errors.push('Value must be true or false');
        }
      } else if (input.type === 'string') {
        validation = { isValid: typeof value === 'string', errors: [], warnings: [], suggestions: [] };
        if (!validation.isValid) {
          validation.errors.push('Value must be a string');
        }
      } else {
        validation = { isValid: true, errors: [], warnings: [], suggestions: [] };
      }

      result.isValid = validation.isValid;
      if (validation.errors.length > 0) {
        result.error = validation.errors.join(', ');
      }
      if (validation.warnings.length > 0) {
        result.warning = validation.warnings.join(', ');
      }
      if (validation.suggestions.length > 0) {
        result.suggestion = validation.suggestions.join(', ');
      }

      results.push(result);
    }

    return results;
  }

  async validateContractAddress(address: string, chainId: number): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic address validation
    const addressValidation = this.validateAddress(address);
    if (!addressValidation.isValid) {
      return addressValidation;
    }

    errors.push(...addressValidation.errors);
    warnings.push(...addressValidation.warnings);
    suggestions.push(...addressValidation.suggestions);

    // Additional contract-specific validations could be added here
    // For example, checking if the contract exists on the chain
    // or if it's a known contract address

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  validateTransactionValue(value: bigint, chainId: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (value < BigInt(0)) {
      errors.push('Transaction value cannot be negative');
    }

    if (value > BigInt('1000000000000000000000')) { // 1000 ETH
      warnings.push('Very large transaction value detected');
    }

    if (value === BigInt(0)) {
      warnings.push('Zero value transaction - ensure this is intentional');
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  validateGasLimit(gasLimit: bigint, estimatedGas: bigint): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (gasLimit < BigInt(21000)) {
      errors.push('Gas limit too low - minimum is 21,000');
    }

    if (gasLimit > BigInt(30000000)) {
      warnings.push('Very high gas limit - transaction may fail');
    }

    const buffer = Number(gasLimit - estimatedGas) / Number(estimatedGas);
    if (buffer < 0.1) {
      warnings.push('Gas limit is close to estimated gas - transaction may fail');
      suggestions.push('Consider increasing gas limit by at least 10%');
    }

    if (buffer > 2) {
      warnings.push('Gas limit is much higher than estimated - you may overpay');
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  private toChecksumAddress(address: string): string {
    // Simple checksum implementation
    // In production, use a proper checksum library
    return address.toLowerCase();
  }
}

// Export singleton instance
export const contractValidationService = new ContractValidationServiceImpl();
