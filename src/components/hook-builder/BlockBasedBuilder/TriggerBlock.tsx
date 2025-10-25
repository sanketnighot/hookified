"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { slideUpVariants } from "@/lib/animations";
import { registry } from "@/lib/plugins";
import { TriggerConfig, TriggerType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Blocks,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  MousePointer,
  Webhook,
} from "lucide-react";
import { useState } from "react";
import { DynamicForm } from "../DynamicForm";

const TRIGGER_ICONS = {
  ONCHAIN: Blocks,
  CRON: Clock,
  WEBHOOK: Webhook,
  MANUAL: MousePointer,
};

interface TriggerBlockProps {
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  onChange: (type: TriggerType, config: TriggerConfig) => void;
  isValid: boolean;
  errors?: string[];
}

export function TriggerBlock({
  triggerType,
  triggerConfig,
  onChange,
  isValid,
  errors,
}: TriggerBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const trigger = registry.getTrigger(triggerType);

  const handleTypeChange = (newType: TriggerType) => {
    // Reset config when type changes
    const newConfig: TriggerConfig = { type: newType };
    onChange(newType, newConfig);
  };

  const handleConfigChange = (newValues: any) => {
    onChange(triggerType, { ...triggerConfig, ...newValues });
  };

  const renderConfigForm = () => {
    if (!trigger) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>Select a trigger type to configure.</p>
        </div>
      );
    }

    const schema = trigger.getConfigSchema();

    if (schema.fields.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>No configuration required for this trigger type.</p>
        </div>
      );
    }

    return (
      <DynamicForm
        schema={schema}
        values={triggerConfig}
        onChange={handleConfigChange}
        errors={errors}
      />
    );
  };

  return (
    <motion.div variants={slideUpVariants}>
      <Card
        className={cn(
          "glass border-white/10 transition-all duration-300",
          isValid
            ? "border-green-500/30"
            : errors?.length
            ? "border-red-500/30"
            : "border-white/10"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg aurora-gradient-1 flex items-center justify-center">
                {trigger &&
                  (() => {
                    const Icon =
                      TRIGGER_ICONS[triggerType as keyof typeof TRIGGER_ICONS];
                    return Icon ? (
                      <Icon className="w-5 h-5 text-white" />
                    ) : null;
                  })()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">🎯 Trigger</h3>
                  {isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : errors?.length ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {trigger?.name || "Select trigger type"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={triggerType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px] glass">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {registry.getAllTriggers().map((t) => {
                    const Icon =
                      TRIGGER_ICONS[t.type as keyof typeof TRIGGER_ICONS];
                    return (
                      <SelectItem key={t.type} value={t.type}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4" />}
                          <span>{t.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              {renderConfigForm()}
              {errors && errors.length > 0 && (
                <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      Configuration Issues
                    </span>
                  </div>
                  <ul className="text-xs text-red-400 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
