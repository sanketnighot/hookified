"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputParameter } from "@/lib/types";

interface StringInputProps {
  parameter: InputParameter;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function StringInput({ parameter, value, onChange, error }: StringInputProps) {
  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`param-${parameter.name}`}>
        {parameter.name || 'String'}
        {parameter.name && (
          <span className="text-xs text-muted-foreground ml-2">
            ({parameter.type})
          </span>
        )}
      </Label>
      <Input
        id={`param-${parameter.name}`}
        type="text"
        placeholder="Enter text..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="glass"
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Enter text value
      </p>
    </div>
  );
}
