"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { slideUpVariants } from "@/lib/animations";
import { registry } from "@/lib/plugins";
import { ActionBlock, ActionConfig, ActionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Code,
  Edit2,
  GitBranch,
  GripVertical,
  Send,
  Trash2,
  Webhook,
} from "lucide-react";
import { useState } from "react";
import { DynamicForm } from "../DynamicForm";
import { ActionVariableContext } from "../VariableInput";
import { ContractCallActionForm } from "./ConfigForms/ContractCallActionForm";

interface ActionBlockProps {
  action: ActionBlock;
  onUpdate: (action: ActionBlock) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  index: number;
  totalActions: number;
  // For variable context
  triggerType?: string;
  triggerConfig?: any;
  allActions?: Array<{
    id: string;
    type: string;
    config?: any;
    customName?: string;
  }>;
}

const ACTION_ICONS = {
  TELEGRAM: Send,
  WEBHOOK: Webhook,
  CONTRACT_CALL: Code,
  CHAIN: GitBranch,
};

export function ActionBlockComponent({
  action,
  onUpdate,
  onDelete,
  onReorder,
  index,
  totalActions,
  triggerType,
  triggerConfig,
  allActions = [],
}: ActionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(action.isExpanded);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(action.customName || "");
  const pluginAction = registry.getAction(action.type);

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

  const displayName =
    action.customName || action.defaultName || `Action ${action.order + 1}`;

  const handleTypeChange = (newType: ActionType) => {
    const newConfig: ActionConfig = { type: newType };
    onUpdate({
      ...action,
      type: newType,
      config: newConfig,
    });
  };

  const handleConfigChange = (newValues: any) => {
    onUpdate({
      ...action,
      config: { ...action.config, ...newValues },
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
    if (!pluginAction) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>Select an action type to configure.</p>
        </div>
      );
    }

    // Use custom form for CONTRACT_CALL actions
    if (action.type === "CONTRACT_CALL") {
      return (
        <ContractCallActionForm
          config={action.config}
          onChange={handleConfigChange}
        />
      );
    }

    const schema = pluginAction.getConfigSchema();

    if (schema.fields.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>No configuration required for this action type.</p>
        </div>
      );
    }

    return (
      <ActionVariableContext
        actionIndex={index}
        triggerType={triggerType}
        triggerConfig={triggerConfig}
        actions={allActions.map((a, i) => ({
          id: a.id,
          type: a.type,
          config: a.config,
          index: i,
          customName: (a as any).customName,
        }))}
      >
        <DynamicForm
          schema={schema}
          values={action.config}
          onChange={handleConfigChange}
          errors={action.errors}
          actionType={action.type}
          actionIndex={index}
        />
      </ActionVariableContext>
    );
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
      className={cn("relative group", isDndDragging && "z-50 opacity-0")}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-8 top-1/2 -translate-y-1/2 transition-all duration-200 cursor-grab active:cursor-grabbing",
          isDndDragging
            ? "opacity-100 scale-110"
            : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            isDndDragging ? "bg-white/20 shadow-lg" : "hover:bg-white/10"
          )}
        >
          <GripVertical
            className={cn(
              "w-4 h-4 transition-colors duration-200",
              isDndDragging ? "text-white" : "text-muted-foreground"
            )}
          />
        </div>
      </div>

      <Card
        className={cn(
          "glass border-white/10 transition-all duration-300",
          action.isValid
            ? "border-green-500/30"
            : action.errors?.length
            ? "border-red-500/30"
            : "border-white/10",
          isDndDragging && "border-blue-500/50 shadow-2xl bg-white/5",
          isOver && !isDndDragging && "border-blue-400/40 bg-blue-500/5"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg aurora-gradient-2 flex items-center justify-center">
                {pluginAction &&
                  (() => {
                    const Icon =
                      ACTION_ICONS[action.type as keyof typeof ACTION_ICONS];
                    return Icon ? (
                      <Icon className="w-5 h-5 text-white" />
                    ) : null;
                  })()}
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
                  {pluginAction?.name || "Select action type"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={action.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px] glass">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {registry.getAllActions().map((a) => {
                    const Icon =
                      ACTION_ICONS[a.type as keyof typeof ACTION_ICONS];
                    return (
                      <SelectItem key={a.type} value={a.type}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4" />}
                          <span>{a.name}</span>
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
                    <span className="text-sm font-medium text-red-500">
                      Configuration Issues
                    </span>
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
