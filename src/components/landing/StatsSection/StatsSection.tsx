"use client";

import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { motion } from "framer-motion";
import { Activity, Blocks, Users, Zap } from "lucide-react";

const stats = [
  { icon: Blocks, label: "Hooks Created", value: "10K+", color: "text-cyan-400" },
  { icon: Activity, label: "Total Executions", value: "1M+", color: "text-purple-400" },
  { icon: Zap, label: "Avg Response Time", value: "2.3s", color: "text-pink-400" },
  { icon: Users, label: "Active Users", value: "5K+", color: "text-blue-400" },
];

export function StatsSection() {
  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={slideUpVariants}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass neo-flat mb-4">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2 aurora-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

