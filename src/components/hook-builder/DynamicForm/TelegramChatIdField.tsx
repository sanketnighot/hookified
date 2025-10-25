"use client";

import { TelegramAuth } from "@/components/auth/TelegramAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";

interface TelegramChatIdFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  botName: string;
}

export function TelegramChatIdField({
  value,
  onChange,
  error,
  botName,
}: TelegramChatIdFieldProps) {
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    // Check if user has connected Telegram
    const checkTelegramConnection = async () => {
      try {
        const response = await fetch("/api/user/telegram");
        const data = await response.json();

        if (data.success && data.telegram?.isConnected) {
          setTelegramConnected(true);
          // Auto-populate with user's chat ID
          if (data.telegram.chatId && !value) {
            onChange(data.telegram.chatId);
          }
        }
      } catch (error) {
        console.error("Failed to check Telegram connection:", error);
      } finally {
        setLoading(false);
      }
    };

    checkTelegramConnection();
  }, [value]);

  const handleAuthSuccess = (data: any) => {
    if (data.telegram?.chatId) {
      setTelegramConnected(true);
      onChange(data.telegram.chatId);
      setManualMode(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Chat ID *</Label>
        <div className="flex items-center justify-center py-8 border border-white/10 rounded-lg">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if we're in development/localhost
  const isDevelopment = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  // Show manual input for development, or auth widget for production
  if (!telegramConnected && !manualMode && !isDevelopment) {
    return (
      <div className="space-y-2">
        <Label>Connect Telegram Account</Label>
        <div className="p-4 border border-blue-500/30 rounded-lg bg-blue-500/10 space-y-3">
          <p className="text-sm text-white">
            Connect your Telegram account to automatically use your chat ID for
            notifications.
          </p>
          <TelegramAuth botName={botName} onSuccess={handleAuthSuccess} />
          <button
            onClick={() => setManualMode(true)}
            className="text-xs text-muted-foreground hover:text-white underline"
          >
            Enter chat ID manually instead
          </button>
        </div>
      </div>
    );
  }

  // Show manual input (either manual mode or user wants to override)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="telegram-chat-id">Chat ID</Label>
        {telegramConnected && (
          <button
            onClick={() => setManualMode(!manualMode)}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            {manualMode ? "Use connected account" : "Use custom ID"}
          </button>
        )}
      </div>

      {isDevelopment && !telegramConnected && (
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <p className="text-xs text-purple-400">
            <strong>Development Mode:</strong> BotFather doesn't support localhost domains.
            Enter your Telegram chat ID manually, or deploy to production to use Telegram authentication.
          </p>
        </div>
      )}

      {!isDevelopment && !telegramConnected && manualMode && (
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <p className="text-xs text-orange-400">
            <strong>Important:</strong> Before using Telegram actions, send a message to your bot (<code className="px-1 py-0.5 bg-white/10 rounded">@{botName}</code>) on Telegram.
            This allows the bot to send you messages. Just say "Hi" or start a conversation.
          </p>
        </div>
      )}

      {telegramConnected && !manualMode ? (
        <div className="p-3 border border-green-500/30 rounded-lg bg-green-500/10 flex items-center gap-2">
          <Send className="w-4 h-4 text-green-400" />
          <span className="text-sm text-white font-mono">{value}</span>
          <span className="text-xs text-green-400 ml-auto">Connected</span>
        </div>
      ) : (
        <>
          <Input
            id="telegram-chat-id"
            placeholder="123456789 or @channelname"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn("glass", error && "border-red-500")}
          />
          <p className="text-xs text-muted-foreground">
            Your Telegram chat ID or channel username
          </p>
        </>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
