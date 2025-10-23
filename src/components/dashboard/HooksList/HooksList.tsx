"use client";

import { HookCard } from "@/components/features/hook-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { useHookStore } from "@/store/useHookStore";
import { motion } from "framer-motion";

export function HooksList() {
  const { getFilteredHooks, updateHook, filterStatus, setFilterStatus } = useHookStore();
  const hooks = getFilteredHooks();

  const handleToggle = (hookId: string, isActive: boolean) => {
    updateHook(hookId, {
      isActive,
      status: isActive ? "ACTIVE" : "PAUSED"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Hooks</h2>
      </div>

      <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
        <TabsList className="glass">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="PAUSED">Paused</TabsTrigger>
          <TabsTrigger value="ERROR">Error</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="mt-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hooks.map((hook) => (
              <motion.div key={hook.id} variants={slideUpVariants}>
                <HookCard hook={hook} onToggle={handleToggle} />
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>

      {hooks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hooks found. Create your first hook to get started!</p>
        </div>
      )}
    </div>
  );
}

