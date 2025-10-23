"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { ActionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Code, GitBranch, Send, Webhook } from "lucide-react";

interface ActionOption {
  type: ActionType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const actions: ActionOption[] = [
  {
    type: "TELEGRAM",
    icon: Send,
    title: "Telegram Message",
    description: "Send messages to Telegram chats or channels",
  },
  {
    type: "WEBHOOK",
    icon: Webhook,
    title: "Webhook",
    description: "POST data to external services and APIs",
  },
  {
    type: "CHAIN",
    icon: GitBranch,
    title: "Chain Hook",
    description: "Trigger another hook in your workflow",
  },
  {
    type: "CONTRACT_CALL",
    icon: Code,
    title: "Contract Call",
    description: "Execute smart contract functions onchain",
  },
];

interface ActionSelectorProps {
  selected: ActionType | null;
  onSelect: (type: ActionType) => void;
}

export function ActionSelector({ selected, onSelect }: ActionSelectorProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose an Action</h2>
        <p className="text-muted-foreground">
          Select what happens when your trigger fires
        </p>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          const isSelected = selected === action.type;

          return (
            <motion.div key={action.type} variants={slideUpVariants}>
              <Card
                onClick={() => onSelect(action.type)}
                className={cn(
                  "glass cursor-pointer transition-all duration-300",
                  "hover:scale-105 hover:shadow-lg",
                  isSelected
                    ? "border-2 holographic-border ring-2 ring-cyan-500/50"
                    : "border-white/10 hover:border-white/20"
                )}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl aurora-gradient-2 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
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

