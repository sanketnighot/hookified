"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionConfig } from "@/lib/types";
import { useState } from "react";

interface TelegramActionFormProps {
  config: ActionConfig;
  onChange: (config: ActionConfig) => void;
}

export function TelegramActionForm({ config, onChange }: TelegramActionFormProps) {
  const [botToken, setBotToken] = useState(config.botToken || "");
  const [chatId, setChatId] = useState(config.chatId || "");
  const [messageTemplate, setMessageTemplate] = useState(config.messageTemplate || "");

  const handleBotTokenChange = (value: string) => {
    setBotToken(value);
    onChange({
      ...config,
      botToken: value,
    });
  };

  const handleChatIdChange = (value: string) => {
    setChatId(value);
    onChange({
      ...config,
      chatId: value,
    });
  };

  const handleMessageChange = (value: string) => {
    setMessageTemplate(value);
    onChange({
      ...config,
      messageTemplate: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bot-token">Bot Token</Label>
        <Input
          id="bot-token"
          type="password"
          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
          value={botToken}
          onChange={(e) => handleBotTokenChange(e.target.value)}
          className="glass"
        />
        <p className="text-xs text-muted-foreground">
          Get this from @BotFather on Telegram
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chat-id">Chat ID</Label>
        <Input
          id="chat-id"
          placeholder="123456789 or @channelname"
          value={chatId}
          onChange={(e) => handleChatIdChange(e.target.value)}
          className="glass"
        />
        <p className="text-xs text-muted-foreground">
          Your Telegram chat ID or channel username
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message-template">Message Template</Label>
        <Input
          id="message-template"
          placeholder="🚨 Alert: {eventName} detected!"
          value={messageTemplate}
          onChange={(e) => handleMessageChange(e.target.value)}
          className="glass"
        />
        <p className="text-xs text-muted-foreground">
          Use {"{variable}"} for dynamic values (e.g., {"{eventName}"}, {"{contractAddress}"})
        </p>
      </div>
    </div>
  );
}
