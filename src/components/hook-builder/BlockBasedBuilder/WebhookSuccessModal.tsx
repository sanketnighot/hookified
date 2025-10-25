"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Copy, ExternalLink, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WebhookSuccessModalProps {
  webhookUrl: string;
  webhookSecret: string;
  hookId: string;
  onClose: () => void;
}

export function WebhookSuccessModal({
  webhookUrl,
  webhookSecret,
  hookId,
  onClose,
}: WebhookSuccessModalProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const copyToClipboard = async (text: string, type: 'url' | 'secret') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      }
      toast.success(`${type === 'url' ? 'Webhook URL' : 'Secret'} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const exampleCurl = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{"message": "Hello from webhook!", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl glass border-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <CardTitle className="text-green-400">Webhook Created Successfully!</CardTitle>
          </div>
          <CardDescription>
            Your webhook is ready to receive requests. Save the configuration details securely.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-400 mb-1">Important Security Notice</p>
              <p className="text-yellow-300/80">
                Save this secret securely. You can regenerate it anytime from the hook details page,
                but this will break existing integrations.
              </p>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="glass font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
                {copiedUrl ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Webhook Secret</Label>
            <div className="flex gap-2">
              <Input
                type={showSecret ? "text" : "password"}
                value={webhookSecret}
                readOnly
                className="glass font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecret(!showSecret)}
                className="shrink-0"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookSecret, 'secret')}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
                {copiedSecret ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Example Usage */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Example Usage (cURL)</Label>
            <div className="relative">
              <pre className="p-3 rounded-lg glass border border-white/10 text-xs font-mono overflow-x-auto">
                {exampleCurl}
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(exampleCurl, 'url')}
                className="absolute top-2 right-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => window.open(`/hook/${hookId}`, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Hook Details
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
