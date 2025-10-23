"use client";

import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { motion } from "framer-motion";
import { Bell, GitBranch, Shield, Zap } from "lucide-react";
import { HolographicCard } from "../HolographicCard";

const features = [
  {
    icon: Zap,
    title: "Instant Triggers",
    description: "Monitor blockchain events in real-time with powerful trigger conditions",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get notified via Telegram, webhooks, or custom integrations",
  },
  {
    icon: GitBranch,
    title: "Visual Flow Builder",
    description: "Drag-and-drop interface to create complex automation workflows",
  },
  {
    icon: Shield,
    title: "Secure & Auditable",
    description: "Every execution is logged and auditable with complete transparency",
  },
];

export function FeatureShowcase() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={slideUpVariants}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to automate blockchain workflows
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={slideUpVariants}>
              <HolographicCard {...feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

