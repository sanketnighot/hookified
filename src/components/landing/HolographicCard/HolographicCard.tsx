"use client";

import { hoverLiftVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface HolographicCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function HolographicCard({
  icon: Icon,
  title,
  description,
  className
}: HolographicCardProps) {
  return (
    <motion.div
      variants={hoverLiftVariants}
      initial="rest"
      whileHover="hover"
      className={cn(
        "relative p-6 rounded-2xl",
        "glass neo-flat holographic-border holographic-shimmer",
        "cursor-pointer transition-all duration-300",
        className
      )}
    >
      <div className="relative z-10">
        <div className="w-12 h-12 mb-4 rounded-xl aurora-gradient-1 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </motion.div>
  );
}

