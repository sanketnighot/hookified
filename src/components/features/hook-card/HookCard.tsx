"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Pause, Play, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { HookCardProps } from "./HookCard.types";

export function HookCard({ hook, onToggle }: HookCardProps) {
  const [running, setRunning] = useState(false);

  // Debug log
  console.log("HookCard rendering:", {
    id: hook.id,
    name: hook.name,
    actions: hook.actions,
    actionConfig: hook.actionConfig,
  });

  const handleRunNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setRunning(true);
      const response = await fetch(`/api/hooks/${hook.id}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          triggeredBy: "manual",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute hook");
      }

      const data = await response.json();

      if (data.status === "SUCCESS") {
        toast.success("Hook executed successfully!");
      } else {
        toast.error(data.error || "Hook execution failed");
      }
    } catch (error) {
      console.error("Error executing hook:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to execute hook"
      );
    } finally {
      setRunning(false);
    }
  };

  const statusColor = {
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    PAUSED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    ERROR: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/hook/${hook.id}`}>
        <Card className="glass neo-flat border-white/10 hover:border-white/20 transition-all cursor-pointer bg-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-white">{hook.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {hook.description || "No description"}
              </p>
            </div>
            <Badge className={cn("text-xs", statusColor[hook.status])}>
              {hook.status}
            </Badge>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{hook.triggerType}</span>
                <span>→</span>
                <span>
                  {(hook.actions &&
                  Array.isArray(hook.actions) &&
                  hook.actions.length > 0
                    ? hook.actions[0].type
                    : hook.actionConfig?.type) || "No action"}
                  {hook.actions &&
                    Array.isArray(hook.actions) &&
                    hook.actions.length > 1 && (
                      <span className="ml-1 text-xs">
                        +{hook.actions.length - 1}
                      </span>
                    )}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Run Now button for manual triggers */}
                {hook.triggerType === "MANUAL" && hook.isActive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRunNow}
                    disabled={running}
                    className="hover:bg-green-500/20 text-green-400 hover:text-green-300"
                    title="Run Now"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    onToggle?.(hook.id, !hook.isActive);
                  }}
                  className="hover:bg-white/5"
                >
                  {hook.isActive ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

