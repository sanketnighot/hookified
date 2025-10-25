"use client";

import { Card, CardContent } from "@/components/ui/card";
import { registry } from "@/lib/plugins";
import { Hook } from "@/lib/types";
import {
    ArrowRight,
    Bot,
    Calendar,
    Code,
    Globe,
    Link as LinkIcon,
    Radio,
    Webhook,
} from "lucide-react";

interface HookFlowVisualizationProps {
  hook: Hook;
}

// Icon mapping for trigger types
const TRIGGER_ICONS: Record<string, any> = {
  ONCHAIN: Radio,
  CRON: Calendar,
  WEBHOOK: Webhook,
  MANUAL: Bot,
};

// Icon mapping for action types
const ACTION_ICONS: Record<string, any> = {
  TELEGRAM: Bot,
  WEBHOOK: LinkIcon,
  CONTRACT_CALL: Code,
  CHAIN: Globe,
};

export function HookFlowVisualization({ hook }: HookFlowVisualizationProps) {
  const triggerDef = registry.getTrigger(hook.triggerType);
  const TriggerIcon = TRIGGER_ICONS[hook.triggerType] || Radio;

  // Get actions from the new format (actions array) or fallback to legacy format
  const actions = hook.actions || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-semibold text-white">Hook Flow</h3>
        <span className="text-sm text-muted-foreground">(Read-only)</span>
      </div>

      {/* Flow Container */}
      <div className="relative">
        {/* Trigger Block */}
        <Card className="glass border-purple-500/30 bg-purple-500/10 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <TriggerIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-400">
                    TRIGGER
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white">
                  {triggerDef?.name || hook.triggerType}
                </h4>
                {triggerDef?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {triggerDef.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {actions.map((action, index) => {
            const actionDef = registry.getAction(action.type);
            const ActionIcon = ACTION_ICONS[action.type] || Code;
            const actionName = action.name || `Action ${index + 1}`;

            return (
              <div key={index} className="relative">
                {/* Arrow */}
                <div className="flex items-center justify-center mb-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-400">
                      THEN
                    </span>
                  </div>
                </div>

                {/* Action Block */}
                <Card className="glass border-cyan-500/30 bg-cyan-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                        <ActionIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-cyan-400">
                            ACTION {index + 1}
                          </span>
                          {action.order !== undefined && (
                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                              Order: {action.order}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-semibold text-white">
                          {actionName}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {actionDef?.name || action.type}
                        </p>
                      </div>
                    </div>

                    {/* Show additional config details if available */}
                    {action.config && Object.keys(action.config).length > 1 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(action.config)
                            .filter(([key]) => key !== "type")
                            .slice(0, 3)
                            .map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {key}:
                                </span>
                                <span className="text-white truncate max-w-[100px]">
                                  {String(value).substring(0, 20)}
                                  {String(value).length > 20 ? "..." : ""}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {/* Empty State */}
          {actions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No actions configured for this hook
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
