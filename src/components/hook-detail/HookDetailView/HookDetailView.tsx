"use client";

import { slideUpVariants } from "@/lib/animations";
import { Hook } from "@/lib/types";
import { motion } from "framer-motion";
import { ExecutionTimeline } from "../ExecutionTimeline";
import { HookHeader } from "../HookHeader";
import { MetricsPanel } from "../MetricsPanel";

interface HookDetailViewProps {
  hook: Hook;
}

export function HookDetailView({ hook }: HookDetailViewProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpVariants}
      className="space-y-6"
    >
      <HookHeader hook={hook} />
      <MetricsPanel hook={hook} />
      <ExecutionTimeline hookId={hook.id} />
    </motion.div>
  );
}

