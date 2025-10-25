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
    <Card className="glass border-white/10">
      <CardContent className="p-3">
        <div className="flex items-center gap-4">
          {/* Compact Label */}
          <div className="flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground">
              Flow:
            </span>
          </div>

          {/* Flow Chain */}
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
            {/* Trigger */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/30">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <TriggerIcon className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium text-white whitespace-nowrap">
                {triggerDef?.name || hook.triggerType}
              </span>
            </div>

            {/* Actions */}
            {actions.map((action, index) => {
              const actionDef = registry.getAction(action.type);
              const ActionIcon = ACTION_ICONS[action.type] || Code;
              const actionName = action.name || action.type;

              return (
                <div
                  key={index}
                  className="flex items-center gap-1.5 flex-shrink-0"
                >
                  {/* Compact Arrow */}
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />

                  {/* Action */}
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                      <ActionIcon className="w-3 h-3 text-white" />
                    </div>
                    <span
                      className="text-xs font-medium text-white whitespace-nowrap max-w-[120px] truncate"
                      title={actionName}
                    >
                      {actionName}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {actions.length === 0 && (
              <span className="text-xs text-muted-foreground italic">
                No actions
              </span>
            )}
          </div>

          {/* Total Count Badge */}
          {actions.length > 0 && (
            <div className="flex-shrink-0 px-2 py-1 rounded-md bg-white/5 border border-white/10">
              <span className="text-xs font-medium text-muted-foreground">
                {actions.length} {actions.length === 1 ? "action" : "actions"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
