"use client";

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { VariableTreeNode as VariableTreeNodeType } from './types';

interface VariableTreeNodeProps {
  node: VariableTreeNodeType;
  onSelect?: (node: VariableTreeNodeType) => void;
  level?: number;
  searchQuery?: string;
}

export function VariableTreeNode({
  node,
  onSelect,
  level = 0,
  searchQuery = '',
}: VariableTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;

  // Helper function to check if a node matches search query
  const matchesSearch = (n: VariableTreeNodeType, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    if (n.name.toLowerCase().includes(lowerQuery) || n.path.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (n.children) {
      return n.children.some((child) => matchesSearch(child, query));
    }
    return false;
  };

  // Filter children if search query exists
  const filteredChildren = hasChildren && searchQuery
    ? node.children!.filter((child) =>
        matchesSearch(child, searchQuery)
      )
    : node.children;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else if (onSelect) {
      onSelect(node);
    }
  };

  // Don't render if search doesn't match and has no matching children
  if (searchQuery && !matchesSearch(node, searchQuery)) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer',
          'hover:bg-white/5 transition-colors',
          !hasChildren && 'text-sm',
          level === 0 && 'font-medium'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )
        ) : (
          <div className="w-3" /> // Spacer for alignment
        )}

        {node.icon && <span className="text-xs mr-1">{node.icon}</span>}

        <span
          className={cn(
            'flex-1',
            !hasChildren && onSelect && 'hover:text-primary'
          )}
        >
          {node.name}
        </span>

        {node.description && !node.isLeaf && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {node.description}
          </span>
        )}
      </div>

      {isExpanded && filteredChildren && filteredChildren.length > 0 && (
        <div>
          {filteredChildren.map((child) => (
            <VariableTreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              level={level + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

