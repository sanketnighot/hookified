"use client";

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { VariableReference } from './types';

interface VariableChipProps {
  variable: VariableReference;
  onRemove?: () => void;
  readOnly?: boolean;
  className?: string;
}

const SOURCE_COLORS = {
  trigger: 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 text-purple-300',
  action: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
  builtin: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300',
};

const SOURCE_ICONS = {
  trigger: '📡',
  action: '🔗',
  builtin: '⚡',
};

export function VariableChip({
  variable,
  onRemove,
  readOnly = false,
  className,
}: VariableChipProps) {
  const colorClass = SOURCE_COLORS[variable.source];
  const icon = SOURCE_ICONS[variable.source];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
        colorClass,
        !readOnly && 'cursor-pointer hover:opacity-80',
        className
      )}
      title={variable.path}
    >
      <span className="text-[10px]">{icon}</span>
      <span>{variable.displayName}</span>
      {!readOnly && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-white/10 rounded p-0.5 transition-colors"
          aria-label={`Remove variable ${variable.displayName}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

