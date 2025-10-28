"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EventFilter } from "@/lib/types";
import { Plus, X } from "lucide-react";

interface EventFilterBuilderProps {
  eventParameters: any[]; // Event ABI inputs
  filters: EventFilter[];
  onChange: (filters: EventFilter[]) => void;
}

export function EventFilterBuilder({
  eventParameters,
  filters,
  onChange,
}: EventFilterBuilderProps) {
  const addFilter = () => {
    if (eventParameters.length === 0) return;

    const firstParam = eventParameters[0];
    const newFilter: EventFilter = {
      parameter: firstParam.name || 'parameter0',
      parameterIndex: 0,
      operator: 'eq',
      value: '',
      indexed: firstParam.indexed || false,
    };

    onChange([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<EventFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const getOperatorOptions = (parameterType: string) => {
    const type = parameterType.toLowerCase();

    if (type.includes('uint') || type.includes('int')) {
      return [
        { value: 'eq', label: 'Equals (=)' },
        { value: 'ne', label: 'Not Equals (≠)' },
        { value: 'gt', label: 'Greater Than (>)' },
        { value: 'lt', label: 'Less Than (<)' },
        { value: 'gte', label: 'Greater or Equal (≥)' },
        { value: 'lte', label: 'Less or Equal (≤)' },
      ];
    } else if (type === 'address') {
      return [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' },
      ];
    } else if (type === 'string') {
      return [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' },
        { value: 'contains', label: 'Contains' },
      ];
    } else if (type === 'bool') {
      return [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' },
      ];
    }

    return [
      { value: 'eq', label: 'Equals' },
      { value: 'ne', label: 'Not Equals' },
    ];
  };

  const getInputType = (parameterType: string) => {
    if (parameterType.toLowerCase() === 'bool') {
      return 'select';
    }
    return 'text';
  };

  const getPlaceholder = (parameterType: string, parameterName: string) => {
    if (parameterType.toLowerCase() === 'address') {
      return '0x...';
    } else if (parameterType.includes('uint') || parameterType.includes('int')) {
      return '0';
    } else if (parameterType.toLowerCase() === 'bool') {
      return 'true/false';
    }
    return `Enter ${parameterName}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Event Filters (Optional)</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFilter}
          disabled={eventParameters.length === 0}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Filter
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Filter events by parameter values. Indexed parameters can be filtered at the webhook level for better performance.
      </p>

      {filters.length === 0 && (
        <div className="text-sm text-muted-foreground p-4 border border-white/10 rounded-lg text-center">
          No filters configured. All events matching the event signature will be processed.
        </div>
      )}

      {filters.map((filter, index) => {
        const param = eventParameters.find(p => p.name === filter.parameter);
        const paramType = param?.type || 'string';
        const operatorOptions = getOperatorOptions(paramType);
        const inputType = getInputType(paramType);

        return (
          <div
            key={index}
            className="p-4 border border-white/10 rounded-lg space-y-3 bg-white/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Filter {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(index)}
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Parameter Selection */}
              <div className="space-y-2">
                <Label className="text-xs">Parameter</Label>
                <Select
                  value={filter.parameter}
                  onValueChange={(value) => {
                    const selectedParam = eventParameters.find(p => p.name === value);
                    if (selectedParam) {
                      const paramIndex = eventParameters.findIndex(p => p.name === value);
                      updateFilter(index, {
                        parameter: value,
                        parameterIndex: paramIndex,
                        indexed: selectedParam.indexed || false,
                        operator: 'eq', // Reset operator for new parameter
                        value: '',
                      });
                    }
                  }}
                >
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventParameters.map((param, paramIndex) => (
                      <SelectItem key={paramIndex} value={param.name || `param${paramIndex}`}>
                        <div className="flex items-center gap-2">
                          <span>{param.name || `param${paramIndex}`}</span>
                          <span className="text-xs text-muted-foreground">
                            ({param.type})
                          </span>
                          {param.indexed && (
                            <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Indexed
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator Selection */}
              <div className="space-y-2">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={filter.operator}
                  onValueChange={(value: any) =>
                    updateFilter(index, { operator: value })
                  }
                >
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Input */}
              <div className="space-y-2">
                <Label className="text-xs">Value</Label>
                {inputType === 'select' && paramType === 'bool' ? (
                  <Select
                    value={String(filter.value)}
                    onValueChange={(value) =>
                      updateFilter(index, { value: value })
                    }
                  >
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    placeholder={getPlaceholder(paramType, param?.name || 'value')}
                    value={String(filter.value)}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    className="glass"
                  />
                )}
              </div>
            </div>

            {/* Indexed Indicator */}
            {filter.indexed && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Indexed
                </Badge>
                <span>This filter will be applied at the webhook level for better performance</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

