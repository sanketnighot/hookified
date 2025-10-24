"use client";

import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { mockAnalytics } from "@/lib/mockData";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { HooksList } from "../HooksList";
import { StatsCard } from "../StatsCard";

export function DashboardGrid() {
  const stats = [
    {
      title: "Total Hooks",
      value: mockAnalytics.totalHooks,
      icon: Zap,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Active Hooks",
      value: mockAnalytics.activeHooks,
      icon: Activity,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Total Runs",
      value: mockAnalytics.totalRuns.toLocaleString(),
      icon: TrendingUp,
      trend: { value: 24, isPositive: true },
    },
    {
      title: "Success Rate",
      value: `${mockAnalytics.successRate}%`,
      icon: CheckCircle2,
      trend: { value: 2.5, isPositive: true },
    },
  ];

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

