"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { slideUpVariants } from "@/lib/animations";
import { ActionBlock, ActionConfig, ActionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Code, Edit2, GitBranch, GripVertical, Send, Trash2, Webhook } from "lucide-react";
import { useState } from "react";
import { ContractCallActionForm, TelegramActionForm, WebhookActionForm } from "./ConfigForms";

interface ActionBlockProps {
  action: ActionBlock;
  onUpdate: (action: ActionBlock) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  index: number;
  totalActions: number;
}

const ACTION_OPTIONS = [
  {
    type: "TELEGRAM" as ActionType,
    icon: Send,
    title: "Telegram Message",
    description: "Send messages to Telegram",
  },
  {
    type: "WEBHOOK" as ActionType,
    icon: Webhook,
    title: "Webhook",
    description: "POST to external APIs",
  },
  {
    type: "CONTRACT_CALL" as ActionType,
    icon: Code,
    title: "Contract Call",
    description: "Execute smart contract",
  },
  {
    type: "CHAIN" as ActionType,
    icon: GitBranch,
    title: "Chain Hook",
    description: "Trigger another hook",
  },
];

export function ActionBlockComponent({ action, onUpdate, onDelete, onReorder, index, totalActions }: ActionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(action.isExpanded);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(action.customName || "");
  const selectedAction = ACTION_OPTIONS.find(a => a.type === action.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDndDragging,
    isOver,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayName = action.customName || action.defaultName || `Action ${action.order + 1}`;

  const handleTypeChange = (newType: ActionType) => {
    const newConfig: ActionConfig = { type: newType };
    onUpdate({
      ...action,
      type: newType,
      config: newConfig,
    });
  };

  const handleConfigChange = (newConfig: ActionConfig) => {
    onUpdate({
      ...action,
      config: newConfig,
    });
  };

  const handleExpandedChange = (expanded: boolean) => {
    setIsExpanded(expanded);
    onUpdate({
      ...action,
      isExpanded: expanded,
    });
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    setCustomName(action.customName || `Action ${index + 1}`);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    onUpdate({
      ...action,
      customName: customName.trim() || undefined,
    });
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setCustomName(action.customName || "");
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  const renderConfigForm = () => {
    switch (action.type) {
      case "TELEGRAM":
        return (
          <TelegramActionForm
            config={action.config}
            onChange={handleConfigChange}
          />
        );
      case "WEBHOOK":
        return (
          <WebhookActionForm
            config={action.config}
            onChange={handleConfigChange}
          />
        );
      case "CONTRACT_CALL":
        return (
          <ContractCallActionForm
            config={action.config}
            onChange={handleConfigChange}
          />
        );
      case "CHAIN":
        return (
          <div className="p-4 text-center text-muted-foreground">
            <GitBranch className="w-8 h-8 mx-auto mb-2" />
            <p>Chain hook configuration coming soon.</p>
            <p className="text-xs">This will trigger another hook in your workflow.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={slideUpVariants}
      layout
      className={cn(
        "relative group",
        isDndDragging && "z-50 opacity-0"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-8 top-1/2 -translate-y-1/2 transition-all duration-200 cursor-grab active:cursor-grabbing",
          isDndDragging ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div className={cn(
          "p-2 rounded-lg transition-all duration-200",
          isDndDragging
            ? "bg-white/20 shadow-lg"
            : "hover:bg-white/10"
        )}>
          <GripVertical className={cn(
            "w-4 h-4 transition-colors duration-200",
            isDndDragging ? "text-white" : "text-muted-foreground"
          )} />
        </div>
      </div>

      <Card className={cn(
        "glass border-white/10 transition-all duration-300",
        action.isValid ? "border-green-500/30" : action.errors?.length ? "border-red-500/30" : "border-white/10",
        isDndDragging && "border-blue-500/50 shadow-2xl bg-white/5",
        isOver && !isDndDragging && "border-blue-400/40 bg-blue-500/5"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg aurora-gradient-2 flex items-center justify-center">
                {selectedAction && <selectedAction.icon className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={handleNameKeyDown}
                      className="h-6 text-sm font-semibold bg-transparent border-none p-0 focus:ring-0"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{displayName}</h3>
                      <button
                        onClick={handleNameEdit}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                      >
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  {action.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : action.errors?.length ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedAction?.title || "Select action type"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={action.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px] glass">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((actionOption) => {
                    const Icon = actionOption.icon;
                    return (
                      <SelectItem key={actionOption.type} value={actionOption.type}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{actionOption.title}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExpandedChange(!isExpanded)}
                  className="p-1 hover:bg-white/5 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onDelete(action.id)}
                  className="p-1 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
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
              {action.errors && action.errors.length > 0 && (
                <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">Configuration Issues</span>
                  </div>
                  <ul className="text-xs text-red-400 space-y-1">
                    {action.errors.map((error, index) => (
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
