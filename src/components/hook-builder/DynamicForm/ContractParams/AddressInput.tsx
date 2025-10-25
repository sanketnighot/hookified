"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputParameter } from "@/lib/types";
import { useEffect, useState } from "react";

interface AddressInputProps {
  parameter: InputParameter;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function AddressInput({ parameter, value, onChange, error }: AddressInputProps) {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (value) {
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(value);
      setIsValid(isValidAddress);
    } else {
      setIsValid(true);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`param-${parameter.name}`}>
        {parameter.name || 'Address'}
        {parameter.name && (
          <span className="text-xs text-muted-foreground ml-2">
            ({parameter.type})
          </span>
        )}
      </Label>
      <Input
        id={`param-${parameter.name}`}
        type="text"
        placeholder="0x..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={`glass ${!isValid ? 'border-red-500' : ''}`}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {!isValid && value && (
        <p className="text-xs text-red-500">Invalid address format</p>
      )}
      <p className="text-xs text-muted-foreground">
        Enter a valid Ethereum address
      </p>
    </div>
  );
}
