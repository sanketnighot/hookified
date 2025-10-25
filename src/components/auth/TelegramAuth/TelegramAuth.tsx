"use client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface TelegramAuthProps {
  botName: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function TelegramAuth({
  botName,
  onSuccess,
  onError,
  className,
}: TelegramAuthProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Declare the callback function on window
    (window as any).onTelegramAuth = async (user: any) => {
      try {
        setLoading(true);

        // Send the Telegram auth data to our backend
        const response = await fetch("/api/user/telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to authenticate Telegram");
        }

        toast.success(`Successfully connected to Telegram!`);

        if (onSuccess) {
          onSuccess(data);
        }
      } catch (error: any) {
        console.error("Telegram auth error:", error);
        toast.error(error.message || "Failed to authenticate Telegram");

        if (onError) {
          onError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Load Telegram widget script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(script);
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      delete (window as any).onTelegramAuth;
    };
  }, [botName, onSuccess, onError]);

  // Show a button while loading or if widget fails
  if (loading) {
    return (
      <Button disabled className={className}>
        <Send className="w-4 h-4 mr-2" />
        Connecting...
      </Button>
    );
  }

  return <div ref={containerRef} className={className} />;
}
