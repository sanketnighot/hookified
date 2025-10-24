"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TriggerConfig } from "@/lib/types";
import { useState } from "react";

interface WebhookTriggerFormProps {
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
}

export function WebhookTriggerForm({ config, onChange }: WebhookTriggerFormProps) {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || "");

  const handleUrlChange = (value: string) => {
    setWebhookUrl(value);
    onChange({
      ...config,
      webhookUrl: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-url">Webhook URL</Label>
        <Input
          id="webhook-url"
          placeholder="https://your-domain.com/webhook"
          value={webhookUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="glass"
        />
        <p className="text-xs text-muted-foreground">
          The HTTPS endpoint where external services can send data to trigger your hook
        </p>
      </div>
    </div>
  );
}
