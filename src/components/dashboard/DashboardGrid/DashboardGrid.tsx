"use client";

import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { useHookStore } from "@/store/useHookStore";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { HooksList } from "../HooksList";
import { StatsCard } from "../StatsCard";

export function DashboardGrid() {
  const { hooks, fetchHooks } = useHookStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

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

  // Calculate stats from actual hooks
  const totalHooks = hooks.length;
  const activeHooks = hooks.filter((h) => h.isActive).length;
  const totalRuns = hooks.reduce((sum, hook) => {
    // Assuming runs data would be available
    // For now, using a placeholder
    return sum + 0;
  }, 0);

  // Calculate success rate based on hook status
  const successfulHooks = hooks.filter((h) => h.status === "ACTIVE").length;
  const successRate =
    totalHooks > 0 ? Math.round((successfulHooks / totalHooks) * 100) : 0;

  const stats = [
    {
      title: "Total Hooks",
      value: isMounted ? totalHooks : 0,
      icon: Zap,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Active Hooks",
      value: isMounted ? activeHooks : 0,
      icon: Activity,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Total Runs",
      value: isMounted ? totalRuns.toLocaleString() : "0",
      icon: TrendingUp,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Success Rate",
      value: isMounted ? `${successRate}%` : "0%",
      icon: CheckCircle2,
      trend: { value: 0, isPositive: true },
    },
  ];

  if (!isMounted) {
    return (
      <div className="space-y-8 max-w-full">
        <div className="text-center py-12 text-muted-foreground">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-full">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={slideUpVariants}>
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      <HooksList />
    </div>
  );
}

