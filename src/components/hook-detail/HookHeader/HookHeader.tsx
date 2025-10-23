"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hook } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useHookStore } from "@/store/useHookStore";
import { ArrowLeft, Edit, Pause, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface HookHeaderProps {
  hook: Hook;
}

export function HookHeader({ hook }: HookHeaderProps) {
  const router = useRouter();
  const { updateHook, deleteHook } = useHookStore();

  const handleToggle = () => {
    updateHook(hook.id, {
      isActive: !hook.isActive,
      status: !hook.isActive ? "ACTIVE" : "PAUSED",
    });
    toast.success(hook.isActive ? "Hook paused" : "Hook activated");
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this hook?")) {
      deleteHook(hook.id);
      toast.success("Hook deleted");
      router.push("/dashboard");
    }
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
            <h1 className="text-4xl font-bold">{hook.name}</h1>
            <Badge className={cn("text-xs", statusColor[hook.status])}>
              {hook.status}
            </Badge>
          </div>
          {hook.description && (
            <p className="text-muted-foreground">{hook.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className="glass"
          >
            {hook.isActive ? (
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
          <Button variant="outline" size="sm" className="glass">
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="glass text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

