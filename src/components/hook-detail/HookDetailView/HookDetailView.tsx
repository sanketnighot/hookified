"use client";

import { slideUpVariants } from "@/lib/animations";
import { Hook } from "@/lib/types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ExecutionTimeline } from "../ExecutionTimeline";
import { HookFlowVisualization } from "../HookFlowVisualization";
import { HookHeader } from "../HookHeader";
import { MetricsPanel } from "../MetricsPanel";

interface HookDetailViewProps {
  hook: Hook;
}

export function HookDetailView({ hook }: HookDetailViewProps) {
  const [currentHook, setCurrentHook] = useState(hook);

  useEffect(() => {
    setCurrentHook(hook);
  }, [hook]);

  const handleHookUpdate = (updatedHook: Hook) => {
    setCurrentHook(updatedHook);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpVariants}
      className="space-y-6"
    >
      <HookHeader hook={currentHook} onUpdate={handleHookUpdate} />
      <HookFlowVisualization hook={currentHook} />
      <MetricsPanel hook={currentHook} />
      <ExecutionTimeline hookId={currentHook.id} />
    </motion.div>
  );
}

