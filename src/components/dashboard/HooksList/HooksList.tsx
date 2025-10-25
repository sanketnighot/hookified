"use client";

import { HookCard } from "@/components/features/hook-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { useHookStore } from "@/store/useHookStore";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function HooksList() {
  const {
    getFilteredHooks,
    updateHook,
    fetchHooks,
    filterStatus,
    setFilterStatus,
  } = useHookStore();
  const hooks = getFilteredHooks();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const loadHooks = async () => {
      try {
        await fetchHooks();
      } catch (error) {
        console.error("Failed to fetch hooks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHooks();
  }, [fetchHooks]);

  // Debug log
  console.log("HooksList rendering with hooks:", hooks.length, hooks);

  const handleToggle = async (hookId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/hooks/${hookId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle hook status");
      }

      const data = await response.json();

      // Update local state
      updateHook(hookId, {
        isActive: data.hook.isActive,
        status: data.hook.status,
      });
    } catch (error) {
      console.error("Error toggling hook status:", error);
    }
  };

  // Prevent hydration mismatch by not rendering hooks until mounted
  if (!isMounted || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Your Hooks</h2>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Your Hooks</h2>
      </div>

      <Tabs
        value={filterStatus}
        onValueChange={(v) => setFilterStatus(v as any)}
      >
        <TabsList className="glass">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="PAUSED">Paused</TabsTrigger>
          <TabsTrigger value="ERROR">Error</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="mt-6">
          {hooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hooks found. Create your first hook to get started!</p>
            </div>
          ) : (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

