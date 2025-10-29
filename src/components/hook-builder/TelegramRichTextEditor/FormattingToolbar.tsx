"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Bold,
    Code,
    Code2,
    Eraser,
    EyeOff,
    Italic,
    Link,
    Plus,
    Strikethrough,
    Underline,
} from 'lucide-react';
import { VariablePicker } from '../VariableInput';

interface FormattingToolbarProps {
  onFormat: (format: string) => void;
  onInsertLink: () => void;
  onInsertCodeBlock: () => void;
  onInsertVariable: (node: any) => void;
  onClearFormatting: () => void;
  activeFormats?: Set<string>;
}

export function FormattingToolbar({
  onFormat,
  onInsertLink,
  onInsertCodeBlock,
  onInsertVariable,
  onClearFormatting,
  activeFormats = new Set(),
}: FormattingToolbarProps) {
  const buttonClass = "h-8 w-8 p-0 hover:bg-white/10";

  return (
    <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5 rounded-t-lg">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(buttonClass, activeFormats.has('bold') && 'bg-white/20')}
        onClick={() => onFormat('bold')}
        title="Bold (Cmd/Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(buttonClass, activeFormats.has('italic') && 'bg-white/20')}
        onClick={() => onFormat('italic')}
        title="Italic (Cmd/Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(buttonClass, activeFormats.has('underline') && 'bg-white/20')}
        onClick={() => onFormat('underline')}
        title="Underline (Cmd/Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(buttonClass, activeFormats.has('strikethrough') && 'bg-white/20')}
        onClick={() => onFormat('strikethrough')}
        title="Strikethrough (Cmd/Ctrl+Shift+S)"
      >
        <Strikethrough className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-white/20 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(buttonClass, activeFormats.has('code') && 'bg-white/20')}
        onClick={() => onFormat('code')}
        title="Inline Code (Cmd/Ctrl+E)"
      >
        <Code className="w-4 h-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={onInsertCodeBlock}
        title="Code Block (Cmd/Ctrl+Shift+E)"
      >
        <Code2 className="w-4 h-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(buttonClass, activeFormats.has('spoiler') && 'bg-white/20')}
        onClick={() => onFormat('spoiler')}
        title="Spoiler (Cmd/Ctrl+Shift+P)"
      >
        <EyeOff className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-white/20 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={onInsertLink}
        title="Insert Link (Cmd/Ctrl+K)"
      >
        <Link className="w-4 h-4" />
      </Button>

      <VariablePicker onSelect={onInsertVariable}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={buttonClass}
          title="Add Variable"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </VariablePicker>

      <div className="w-px h-6 bg-white/20 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={onClearFormatting}
        title="Clear Formatting"
      >
        <Eraser className="w-4 h-4" />
      </Button>
    </div>
  );
}

