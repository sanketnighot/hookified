"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputParameter } from "@/lib/types";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface ArrayInputProps {
  parameter: InputParameter;
  value: any[];
  onChange: (value: any[]) => void;
  error?: string;
}

export function ArrayInput({ parameter, value, onChange, error }: ArrayInputProps) {
  const [arrayValue, setArrayValue] = useState<string[]>(
    value.length > 0 ? value.map(String) : ['']
  );

  useEffect(() => {
    onChange(arrayValue.filter(item => item !== ''));
  }, [arrayValue, onChange]);

  const addItem = () => {
    setArrayValue([...arrayValue, '']);
  };

  const removeItem = (index: number) => {
    if (arrayValue.length > 1) {
      const newArray = arrayValue.filter((_, i) => i !== index);
      setArrayValue(newArray);
    }
  };

  const updateItem = (index: number, newValue: string) => {
    const newArray = [...arrayValue];
    newArray[index] = newValue;
    setArrayValue(newArray);
  };

  const getPlaceholder = () => {
    const baseType = parameter.type.replace('[]', '');
    switch (baseType) {
      case 'address':
        return '0x...';
      case 'uint256':
      case 'uint':
        return '0';
      case 'string':
        return 'Enter text...';
      case 'bytes':
        return '0x...';
      default:
        return 'Enter value...';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`param-${parameter.name}`}>
        {parameter.name || 'Array'}
        {parameter.name && (
          <span className="text-xs text-muted-foreground ml-2">
            ({parameter.type})
          </span>
        )}
      </Label>

      <div className="space-y-2">
        {arrayValue.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder={getPlaceholder()}
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="glass flex-1"
            />
            {arrayValue.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Minus className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addItem}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Array of {parameter.type.replace('[]', '')} values
      </p>
    </div>
  );
}
