"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseTemplate, serializeTemplate } from '@/lib/variables/templateSerializer';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { VariableChip } from './VariableChip';
import { VariablePicker } from './VariablePicker';
import { TemplateSegment, VariableReference, VariableTreeNode } from './types';

interface VariablePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}

export function VariablePickerInput({
  value = '',
  onChange,
  placeholder = 'Type text or add variables...',
  className,
  multiline = false,
}: VariablePickerInputProps) {
  const [segments, setSegments] = useState<TemplateSegment[]>(() => parseTemplate(value));
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const lastSyncedValueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync value prop changes to segments (only if value changed externally)
  useEffect(() => {
    // Skip if this is the value we just set
    if (lastSyncedValueRef.current === value) {
      return;
    }

    // Value changed externally, update segments
    const newSegments = parseTemplate(value);
    setSegments(newSegments);
    lastSyncedValueRef.current = value;
  }, [value]);

  // Convert segments back to template string on change
  useEffect(() => {
    const templateString = serializeTemplate(segments);
    const lastSynced = lastSyncedValueRef.current;

    // Only update if different and not already synced
    if (templateString !== lastSynced) {
      lastSyncedValueRef.current = templateString;
      onChangeRef.current(templateString);
    }
  }, [segments]);

  const handleVariableSelect = (node: VariableTreeNode) => {
    if (!node.isLeaf) return;

    const newVariable: VariableReference = {
      id: `var-${Date.now()}`,
      path: node.path,
      displayName: node.name,
      source: node.source,
      sourceIndex: node.sourceIndex,
      type: node.type,
      description: node.description,
    };

    // Insert variable at cursor position
    const newSegments: TemplateSegment[] = [...segments];

    // If we have a text segment at the end, split it at cursor
    const lastSegment = newSegments[newSegments.length - 1];
    if (lastSegment && lastSegment.type === 'text') {
      const text = lastSegment.value as string;
      // For simplicity, just append variable at the end
      // TODO: Implement proper cursor-based insertion
      newSegments[newSegments.length - 1] = {
        ...lastSegment,
        value: text,
      };
    }

    // Add variable
      newSegments.push({
      type: 'variable',
      value: newVariable,
      id: newVariable.id,
    });

    setSegments(newSegments);

    // Focus input after inserting
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleTextChange = (newText: string) => {
    // Parse the new text value and merge with variables
    // For now, simple approach: replace all with new parse
    const newSegments = parseTemplate(newText);
    setSegments(newSegments);
  };

  const handleRemoveVariable = (segmentId: string) => {
    setSegments(segments.filter((seg) => seg.id !== segmentId));
  };

  // Render mode: show chips for variables
  const renderContent = () => {
    return (
      <div className="flex flex-wrap items-center gap-2 min-h-[40px] p-2 border rounded-md bg-background">
        {segments.map((segment) => {
          if (segment.type === 'variable') {
            const variable = segment.value as VariableReference;
            return (
              <VariableChip
                key={segment.id}
                variable={variable}
                onRemove={() => handleRemoveVariable(segment.id)}
              />
            );
          } else {
            const text = segment.value as string;
            if (!text) return null;
            return (
              <span key={segment.id} className="text-sm">
                {text}
              </span>
            );
          }
        })}

        <VariablePicker onSelect={handleVariableSelect}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Variable
          </Button>
        </VariablePicker>
      </div>
    );
  };

  // Edit mode: show text input for editing template string directly
  // This is simpler for initial implementation
  if (multiline) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'w-full px-3 py-2 rounded-lg glass border border-white/10 bg-white/5',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none',
              'min-h-[100px] font-mono text-sm',
              className
            )}
            rows={6}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Use {'{{'} for variables, e.g., {'{{'}trigger.value{'}}'}
          </p>
          <VariablePicker onSelect={handleVariableSelect}>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Insert Variable
            </Button>
          </VariablePicker>
        </div>
      </div>
    );
  }

  // For single-line inputs, use the chip-based renderer for now
  // TODO: Improve to support inline editing
  return (
    <div className="space-y-2">
      {renderContent()}
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="hidden"
        value={value}
      />
    </div>
  );
}

