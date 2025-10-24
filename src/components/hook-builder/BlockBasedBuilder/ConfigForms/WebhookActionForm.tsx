"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionConfig } from "@/lib/types";
import { useState } from "react";

interface WebhookActionFormProps {
  config: ActionConfig;
  onChange: (config: ActionConfig) => void;
}

const HTTP_METHODS = ["GET", "POST", "PUT"];

export function WebhookActionForm({ config, onChange }: WebhookActionFormProps) {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || "");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT">(config.method || "POST");
  const [headers, setHeaders] = useState(
    config.headers ? JSON.stringify(config.headers, null, 2) : ""
  );

  const handleUrlChange = (value: string) => {
    setWebhookUrl(value);
    onChange({
      ...config,
      webhookUrl: value,
    });
  };

  const handleMethodChange = (value: "GET" | "POST" | "PUT") => {
    setMethod(value);
    onChange({
      ...config,
      method: value,
    });
  };

  const handleHeadersChange = (value: string) => {
    setHeaders(value);
    try {
      const parsedHeaders = JSON.parse(value);
      onChange({
        ...config,
        headers: parsedHeaders,
      });
    } catch {
      // Invalid JSON, don't update config
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-url">Webhook URL</Label>
        <Input
          id="webhook-url"
          placeholder="https://api.example.com/webhook"
          value={webhookUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="glass"
        />
        <p className="text-xs text-muted-foreground">
          The endpoint to send data to
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">HTTP Method</Label>
        <Select value={method} onValueChange={handleMethodChange}>
          <SelectTrigger className="glass">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headers">Headers (JSON)</Label>
        <textarea
          id="headers"
          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
          value={headers}
          onChange={(e) => handleHeadersChange(e.target.value)}
          className="w-full min-h-[80px] p-3 rounded-md glass border border-white/10 bg-transparent text-sm resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Optional custom headers as JSON object
        </p>
      </div>
    </div>
  );
}
