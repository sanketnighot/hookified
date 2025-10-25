"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hook } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Edit, Pause, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HookHeaderProps {
  hook: Hook;
  onUpdate?: (hook: Hook) => void;
}

export function HookHeader({ hook, onUpdate }: HookHeaderProps) {
  const router = useRouter();
  const [localHook, setLocalHook] = useState(hook);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalHook(hook);
  }, [hook]);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hooks/${hook.id}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !localHook.isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle hook status");
      }

      const data = await response.json();
      const updatedHook = {
        ...localHook,
        isActive: data.hook.isActive,
        status: data.hook.status,
      };
      setLocalHook(updatedHook);
      if (onUpdate) {
        onUpdate(updatedHook);
      }
      toast.success(localHook.isActive ? "Hook paused" : "Hook activated");
    } catch (error) {
      console.error("Error toggling hook:", error);
      toast.error("Failed to update hook status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this hook?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/hooks/${hook.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete hook");
      }

      toast.success("Hook deleted");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting hook:", error);
      toast.error("Failed to delete hook");
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate to the hook builder page with edit mode
    router.push(`/hook?edit=${hook.id}`);
  };

  const statusColor = {
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    PAUSED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    ERROR: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-4">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-white">{localHook.name}</h1>
            <Badge className={cn("text-xs", statusColor[localHook.status])}>
              {localHook.status}
            </Badge>
          </div>
          {localHook.description && (
            <p className="text-muted-foreground">{localHook.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            disabled={loading}
            className="glass"
          >
            {localHook.isActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            disabled={loading}
            className="glass"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="glass text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

