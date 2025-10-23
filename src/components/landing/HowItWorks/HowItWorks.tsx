"use client";

import { Badge } from "@/components/ui/badge";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Choose a Trigger",
    description: "Select from onchain events, scheduled tasks, manual triggers, or webhooks",
  },
  {
    number: "02",
    title: "Configure Action",
    description: "Define what happens when your trigger fires - notifications, API calls, or chain interactions",
  },
  {
    number: "03",
    title: "Deploy & Monitor",
    description: "Activate your hook and monitor all executions with complete audit trail",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={slideUpVariants}
          className="text-center mb-16"
        >
          <Badge className="mb-4 glass border-white/20">
            Simple Process
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our intuitive three-step process
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={slideUpVariants}
              className="relative"
            >
              {/* Connection line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5">
                  <div className="w-full h-full bg-linear-to-r from-white/20 via-white/10 to-transparent" />
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                </div>
              )}

              <div className="relative glass neo-flat rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl aurora-gradient-1 text-white font-bold text-2xl mb-6">
                  {step.number}
                </div>

                <h3 className="text-2xl font-semibold mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

