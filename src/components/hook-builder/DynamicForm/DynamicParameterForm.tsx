"use client";

import { InputParameter } from "@/lib/types";
import {
    AddressInput,
    ArrayInput,
    BoolInput,
    BytesInput,
    StringInput,
    UintInput
} from "./ContractParams";

interface DynamicParameterFormProps {
  parameters: InputParameter[];
  values: any[];
  onChange: (values: any[]) => void;
  errors?: string[];
  tokenDecimals?: number;
  tokenSymbol?: string;
}

export function DynamicParameterForm({
  parameters,
  values,
  onChange,
  errors = [],
  tokenDecimals,
  tokenSymbol
}: DynamicParameterFormProps) {
  const updateValue = (index: number, value: any) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  const renderParameterInput = (param: InputParameter, index: number) => {
    const value = values[index] || '';
    const error = errors[index];

    // Handle array types
    if (param.type.endsWith('[]')) {
      return (
        <ArrayInput
          key={index}
          parameter={param}
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(index, newValue)}
          error={error}
        />
      );
    }

    // Handle different parameter types
    switch (param.type) {
      case 'address':
        return (
          <AddressInput
            key={index}
            parameter={param}
            value={value}
            onChange={(newValue) => updateValue(index, newValue)}
            error={error}
          />
        );

      case 'uint256':
      case 'uint':
      case 'uint8':
      case 'uint16':
      case 'uint32':
      case 'uint64':
      case 'uint128':
        return (
          <UintInput
            key={index}
            parameter={param}
            value={value}
            onChange={(newValue) => updateValue(index, newValue)}
            error={error}
            decimals={tokenDecimals}
            tokenSymbol={tokenSymbol}
          />
        );

      case 'bool':
        return (
          <BoolInput
            key={index}
            parameter={param}
            value={value}
            onChange={(newValue) => updateValue(index, newValue)}
            error={error}
          />
        );

      case 'string':
        return (
          <StringInput
            key={index}
            parameter={param}
            value={value}
            onChange={(newValue) => updateValue(index, newValue)}
            error={error}
          />
        );

      case 'bytes':
      case 'bytes32':
        return (
          <BytesInput
            key={index}
            parameter={param}
            value={value}
            onChange={(newValue) => updateValue(index, newValue)}
            error={error}
          />
        );

      default:
        // Fallback to string input for unknown types
        return (
          <StringInput
            key={index}
            parameter={param}
            value={value}
            onChange={(newValue) => updateValue(index, newValue)}
            error={error}
          />
        );
    }
  };

  if (parameters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        This function has no parameters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parameters.map((param, index) => renderParameterInput(param, index))}
    </div>
  );
}
