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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string, url: string) => void;
  defaultText?: string;
  defaultUrl?: string;
}

export function LinkDialog({
  open,
  onOpenChange,
  onInsert,
  defaultText = '',
  defaultUrl = 'https://',
}: LinkDialogProps) {
  const [linkText, setLinkText] = useState(defaultText);
  const [linkUrl, setLinkUrl] = useState(defaultUrl);

  const handleSubmit = () => {
    if (linkText.trim() && linkUrl.trim()) {
      onInsert(linkText.trim(), linkUrl.trim());
      setLinkText('');
      setLinkUrl('https://');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setLinkText(defaultText);
    setLinkUrl(defaultUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>
            Add a link with custom text. The link will be clickable in Telegram.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="link-text">Link Text</Label>
            <Input
              id="link-text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Click here"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!linkText.trim() || !linkUrl.trim()}>
            Insert Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

