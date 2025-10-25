"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { registry } from "@/lib/plugins";
import { TriggerType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Blocks, Clock, MousePointer, Webhook } from "lucide-react";

const TRIGGER_ICONS = {
  ONCHAIN: Blocks,
  CRON: Clock,
  WEBHOOK: Webhook,
  MANUAL: MousePointer,
};

interface TriggerSelectorProps {
  selected: TriggerType | null;
  onSelect: (type: TriggerType) => void;
}

export function TriggerSelector({ selected, onSelect }: TriggerSelectorProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose a Trigger</h2>
        <p className="text-muted-foreground">
          Select what will start your automation
        </p>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {registry.getAllTriggers().map((trigger) => {
          const Icon =
            TRIGGER_ICONS[trigger.type as keyof typeof TRIGGER_ICONS];
          const isSelected = selected === trigger.type;

          return (
            <motion.div key={trigger.type} variants={slideUpVariants}>
              <Card
                onClick={() => onSelect(trigger.type as TriggerType)}
                className={cn(
                  "glass cursor-pointer transition-all duration-300",
                  "hover:scale-105 hover:shadow-lg",
                  isSelected
                    ? "border-2 holographic-border ring-2 ring-purple-500/50"
                    : "border-white/10 hover:border-white/20"
                )}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl aurora-gradient-1 flex items-center justify-center mb-4">
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                  </div>
                  <CardTitle>{trigger.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {trigger.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

