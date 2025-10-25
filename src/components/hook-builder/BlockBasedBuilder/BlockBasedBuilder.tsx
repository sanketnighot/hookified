"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { registry } from "@/lib/plugins";
import {
  ActionBlock,
  ActionType,
  BlockValidationResult,
  HookBuilderState,
  Template,
  TriggerType,
} from "@/lib/types";
import { useHookStore } from "@/store/useHookStore";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Save, Sparkles, TestTube } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ActionBlockComponent } from "./ActionBlock";
import { AddBlockMenu } from "./AddBlockMenu";
import { TemplateQuickStart } from "./TemplateQuickStart";
import { TriggerBlock } from "./TriggerBlock";
import { ValidationPanel } from "./ValidationPanel";

export function BlockBasedBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editHookId = searchParams.get("edit");
  const { addHook, templates } = useHookStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [builderState, setBuilderState] = useState<HookBuilderState>({
    name: "",
    description: "",
    triggerType: "ONCHAIN",
    triggerConfig: { type: "ONCHAIN" },
    actions: [],
  });

  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoadingEditHook, setIsLoadingEditHook] = useState(false);
  const lastOverId = useRef<string | null>(null);

  // Load hook data in edit mode
  useEffect(() => {
    const loadHookForEdit = async () => {
      if (!editHookId) return;

      setIsLoadingEditHook(true);
      try {
        const response = await fetch(`/api/hooks/${editHookId}`);
        if (response.ok) {
          const data = await response.json();
          const hook = data.hook;

          // Transform actions from hook format to builder format
          const transformedActions = (hook.actions || []).map(
            (action: any, index: number) => ({
              id: `action-${index}`,
              order: action.order !== undefined ? action.order : index,
              type: action.type,
              config: action.config || { type: action.type },
              isExpanded: false,
              isValid: false,
              errors: [],
              customName: action.name, // Restore saved custom name
              defaultName: `Action ${index + 1}`,
            })
          );

          // Transform hook data to builder state
          setBuilderState({
            name: hook.name || "",
            description: hook.description || "",
            triggerType: hook.triggerType,
            triggerConfig: hook.triggerConfig || { type: hook.triggerType },
            actions: transformedActions,
          });
        } else {
          toast.error("Failed to load hook for editing");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error loading hook:", error);
        toast.error("Failed to load hook for editing");
        router.push("/dashboard");
      } finally {
        setIsLoadingEditHook(false);
      }
    };

    loadHookForEdit();
  }, [editHookId, router]);

  // Auto-save draft to localStorage (only when not in edit mode)
  useEffect(() => {
    if (editHookId) return; // Don't save drafts when editing

    const draftKey = "hook-builder-draft";
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setBuilderState(parsedDraft);
      } catch (error) {
        console.error("Failed to parse saved draft:", error);
      }
    }
  }, [editHookId]);

  useEffect(() => {
    const draftKey = "hook-builder-draft";
    localStorage.setItem(draftKey, JSON.stringify(builderState));
  }, [builderState]);

  // Validation logic using registry
  const validateBuilder = useCallback((): BlockValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check hook name
    if (!builderState.name.trim()) {
      errors.push("Hook name is required");
    }

    // Validate trigger configuration using registry
    const triggerValidation = registry.validateTriggerConfig(
      builderState.triggerType,
      builderState.triggerConfig
    );
    errors.push(...triggerValidation.errors);

    // Check actions
    if (builderState.actions.length === 0) {
      errors.push("At least one action is required");
    }

    // Validate each action using registry
    builderState.actions.forEach((action, index) => {
      const actionValidation = registry.validateActionConfig(
        action.type,
        action.config
      );
      actionValidation.errors.forEach((err) =>
        errors.push(`Action ${index + 1}: ${err}`)
      );
    });

    // Warnings
    if (builderState.actions.length > 5) {
      warnings.push("Consider breaking complex workflows into multiple hooks");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [builderState]);

  const validation = validateBuilder();

  const handleTriggerChange = (type: TriggerType, config: any) => {
    setBuilderState((prev) => ({
      ...prev,
      triggerType: type,
      triggerConfig: config,
    }));
  };

  const handleAddAction = (type: ActionType) => {
    const newAction: ActionBlock = {
      id: `action-${Date.now()}`,
      order: builderState.actions.length,
      type,
      config: { type },
      isExpanded: true,
      isValid: false,
      errors: [],
      defaultName: `Action ${builderState.actions.length + 1}`,
    };

    setBuilderState((prev) => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));
  };

  const handleUpdateAction = (updatedAction: ActionBlock) => {
    setBuilderState((prev) => ({
      ...prev,
      actions: prev.actions.map((action) =>
        action.id === updatedAction.id ? updatedAction : action
      ),
    }));
  };

  const handleDeleteAction = (actionId: string) => {
    setBuilderState((prev) => ({
      ...prev,
      actions: prev.actions
        .filter((action) => action.id !== actionId)
        .map((action, index) => ({ ...action, order: index })),
    }));
  };

  const handleDragOver = useCallback((event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Prevent unnecessary updates if we're already over the same item
    if (lastOverId.current === over.id) return;
    lastOverId.current = over.id;

    setBuilderState((prev) => {
      const oldIndex = prev.actions.findIndex(
        (action) => action.id === active.id
      );
      const newIndex = prev.actions.findIndex(
        (action) => action.id === over.id
      );

      if (oldIndex !== newIndex) {
        const newActions = arrayMove(prev.actions, oldIndex, newIndex);
        return {
          ...prev,
          actions: newActions.map((action, index) => ({
            ...action,
            order: index,
          })),
        };
      }

      return prev;
    });
  }, []);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    lastOverId.current = null; // Reset the last over ID when starting a new drag
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    lastOverId.current = null; // Reset the last over ID when drag ends

    // The reordering is already handled in handleDragOver for real-time updates
    // This just ensures the final state is correct
    if (active.id !== over?.id) {
      setBuilderState((prev) => {
        const oldIndex = prev.actions.findIndex(
          (action) => action.id === active.id
        );
        const newIndex = prev.actions.findIndex(
          (action) => action.id === over.id
        );

        if (oldIndex !== newIndex) {
          const newActions = arrayMove(prev.actions, oldIndex, newIndex);
          return {
            ...prev,
            actions: newActions.map((action, index) => ({
              ...action,
              order: index,
            })),
          };
        }

        return prev;
      });
    }
  };

  const handleReorderActions = (fromIndex: number, toIndex: number) => {
    setBuilderState((prev) => {
      const newActions = [...prev.actions];
      const [movedAction] = newActions.splice(fromIndex, 1);
      newActions.splice(toIndex, 0, movedAction);

      return {
        ...prev,
        actions: newActions.map((action, index) => ({
          ...action,
          order: index,
        })),
      };
    });
  };

  const handleApplyTemplate = (template: Template) => {
    setBuilderState({
      name: template.name,
      description: template.description,
      triggerType: template.triggerConfig.type,
      triggerConfig: template.triggerConfig,
      actions: [
        {
          id: `action-${Date.now()}`,
          order: 0,
          type: template.actionConfig.type,
          config: template.actionConfig,
          isExpanded: true,
          isValid: false,
          errors: [],
          defaultName: "Action 1",
        },
      ],
    });
  };

  const handleSave = async () => {
    if (!validation.isValid) {
      toast.error("Please fix all errors before saving");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare hook data for API
      const hookData = {
        name: builderState.name,
        description: builderState.description,
        triggerType: builderState.triggerType,
        triggerConfig: builderState.triggerConfig,
        actions: builderState.actions.map((action) => ({
          order: action.order,
          type: action.type,
          config: action.config,
          name: action.customName, // Include custom name if set
        })),
      };

      let response;
      if (editHookId) {
        // Update existing hook
        response = await fetch(`/api/hooks/${editHookId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(hookData),
        });
      } else {
        // Create new hook
        response = await fetch("/api/hooks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(hookData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Failed to ${editHookId ? "update" : "create"} hook`
        );
      }

      toast.success(`Hook ${editHookId ? "updated" : "created"} successfully!`);

      // Clear draft if not editing
      if (!editHookId) {
        localStorage.removeItem("hook-builder-draft");
      }

      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to save hook");
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state when fetching hook for editing
  if (isLoadingEditHook) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading hook...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideUpVariants}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="glass border-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {editHookId ? "Edit Hook" : "Create Hook"}
            </h1>
            <p className="text-muted-foreground">
              {editHookId
                ? "Update your automation hook"
                : "Build your automation with blocks"}
            </p>
          </div>
          <Button
            onClick={() => setIsTemplateOpen(true)}
            variant="outline"
            className="glass border-white/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </Button>
        </div>

        {/* Hook Name */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="hook-name">Hook Name</Label>
          <Input
            id="hook-name"
            placeholder="My Awesome Hook"
            value={builderState.name}
            onChange={(e) =>
              setBuilderState((prev) => ({ ...prev, name: e.target.value }))
            }
            className="glass text-lg"
          />
        </div>

        {/* Hook Description */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="hook-description">Description (Optional)</Label>
          <textarea
            id="hook-description"
            placeholder="What does this hook do? (optional)"
            value={builderState.description || ""}
            onChange={(e) =>
              setBuilderState((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows={3}
            className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
        </div>
      </motion.div>

      {/* Blocks Container */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
        className="space-y-6"
      >
        {/* Trigger Block */}
        <TriggerBlock
          triggerType={builderState.triggerType}
          triggerConfig={builderState.triggerConfig}
          onChange={handleTriggerChange}
          isValid={
            validation.isValid &&
            builderState.triggerConfig.type === builderState.triggerType
          }
          errors={validation.errors.filter(
            (error) =>
              error.includes("trigger") ||
              error.includes("contract") ||
              error.includes("cron") ||
              error.includes("webhook")
          )}
        />

        {/* Action Blocks */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={builderState.actions.map((action) => action.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
              {builderState.actions.map((action, index) => (
                <ActionBlockComponent
                  key={action.id}
                  action={action}
                  onUpdate={handleUpdateAction}
                  onDelete={handleDeleteAction}
                  onReorder={handleReorderActions}
                  index={index}
                  totalActions={builderState.actions.length}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {/* Add Action Block */}
        <AddBlockMenu
          onAddAction={handleAddAction}
          disabled={!builderState.triggerType}
        />
      </motion.div>

      {/* Validation Status */}
      <ValidationPanel validation={validation} className="mt-8 mb-6" />

      {/* Save Button */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideUpVariants}
        className="flex justify-end gap-3"
      >
        <Button variant="outline" className="glass border-white/20">
          <TestTube className="w-4 h-4 mr-2" />
          Test Hook
        </Button>
        <Button
          onClick={handleSave}
          disabled={!validation.isValid || isSaving}
          className="aurora-gradient-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Hook"}
        </Button>
      </motion.div>

      {/* Template Quick Start */}
      <TemplateQuickStart
        templates={templates}
        onApplyTemplate={handleApplyTemplate}
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
      />
    </div>
  );
}
