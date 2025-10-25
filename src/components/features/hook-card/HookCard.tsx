"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { HookCardProps } from "./HookCard.types";

export function HookCard({ hook, onToggle }: HookCardProps) {
  // Debug log
  console.log("HookCard rendering:", {
    id: hook.id,
    name: hook.name,
    actions: hook.actions,
    actionConfig: hook.actionConfig,
  });

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
              <p className="text-sm text-muted-foreground line-clamp-1 text-gray-300">
                {hook.description || "No description"}
              </p>
            </div>
            <Badge className={cn("text-xs", statusColor[hook.status])}>
              {hook.status}
            </Badge>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground text-gray-300">
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
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

