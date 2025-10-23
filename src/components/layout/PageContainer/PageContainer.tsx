"use client";

import { fadeInVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      className={cn(
        "min-h-screen pl-28 pr-8 py-8",
        "bg-linear-to-br from-background via-background to-space-medium",
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </motion.div>
  );
}

