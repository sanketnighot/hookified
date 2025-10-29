"use client";

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { VariableTreeNode as VariableTreeNodeType } from './types';
import { useVariableContext } from './VariableContext';
import { VariableTreeNode } from './VariableTreeNode';

interface VariablePickerProps {
  onSelect: (variable: VariableTreeNodeType) => void;
  children: React.ReactNode;
}

export function VariablePicker({ onSelect, children }: VariablePickerProps) {
  const { variables } = useVariableContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (node: VariableTreeNodeType) => {
    if (node.isLeaf) {
      onSelect(node);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="start"
        side="bottom"
      >
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {variables.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No variables available. Configure your trigger and actions first.
            </div>
          ) : (
            variables.map((node) => (
              <VariableTreeNode
                key={node.id}
                node={node}
                onSelect={handleSelect}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

