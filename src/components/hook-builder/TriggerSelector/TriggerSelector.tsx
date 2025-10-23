"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { TriggerType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Blocks, Clock, MousePointer, Webhook } from "lucide-react";

interface TriggerOption {
  type: TriggerType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const triggers: TriggerOption[] = [
  {
    type: "ONCHAIN",
    icon: Blocks,
    title: "Onchain Event",
    description: "Monitor smart contract events and token transfers",
  },
  {
    type: "CRON",
    icon: Clock,
    title: "Schedule",
    description: "Run hooks at specific times or intervals",
  },
  {
    type: "MANUAL",
    icon: MousePointer,
    title: "Manual",
    description: "Trigger hooks manually when you need them",
  },
  {
    type: "WEBHOOK",
    icon: Webhook,
    title: "Webhook",
    description: "Trigger from external services via HTTP requests",
  },
];

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
        {triggers.map((trigger) => {
          const Icon = trigger.icon;
          const isSelected = selected === trigger.type;

          return (
            <motion.div key={trigger.type} variants={slideUpVariants}>
              <Card
                onClick={() => onSelect(trigger.type)}
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
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{trigger.title}</CardTitle>
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

