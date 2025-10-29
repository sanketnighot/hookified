"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const CODE_LANGUAGES = [
  { value: 'plain', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'yaml', label: 'YAML' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
];

interface CodeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (language: string, code: string) => void;
}

export function CodeBlockDialog({
  open,
  onOpenChange,
  onInsert,
}: CodeBlockDialogProps) {
  const [language, setLanguage] = useState('plain');
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (code.trim()) {
      // Convert 'plain' to empty string for Telegram
      const lang = language === 'plain' ? '' : language;
      onInsert(lang, code.trim());
      setLanguage('plain');
      setCode('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setLanguage('plain');
    setCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Insert Code Block</DialogTitle>
          <DialogDescription>
            Add a code block with syntax highlighting. Select the programming language.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code-language">Language (Optional)</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="code-language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {CODE_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="code-content">Code</Label>
            <textarea
              id="code-content"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code here..."
              className="w-full min-h-[200px] px-3 py-2 rounded-lg border bg-background font-mono text-sm resize-none"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!code.trim()}>
            Insert Code Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

