"use client";

import { Label } from "@/components/ui/label";
import { InputParameter } from "@/lib/types";

interface BoolInputProps {
  parameter: InputParameter;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
}

export function BoolInput({ parameter, value, onChange, error }: BoolInputProps) {
  const handleChange = (newValue: boolean) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`param-${parameter.name}`}>
        {parameter.name || 'Boolean'}
        {parameter.name && (
          <span className="text-xs text-muted-foreground ml-2">
            ({parameter.type})
          </span>
        )}
      </Label>
      <div className="flex gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={`param-${parameter.name}`}
            checked={value === true}
            onChange={() => handleChange(true)}
            className="w-4 h-4 text-blue-600 bg-transparent border-white/30 focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm">True</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={`param-${parameter.name}`}
            checked={value === false}
            onChange={() => handleChange(false)}
            className="w-4 h-4 text-blue-600 bg-transparent border-white/30 focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm">False</span>
        </label>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Select true or false
      </p>
    </div>
  );
}
