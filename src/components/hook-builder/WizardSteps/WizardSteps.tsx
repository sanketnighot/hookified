"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Step {
  id: number;
  name: string;
  description: string;
}

interface WizardStepsProps {
  steps: Step[];
  currentStep: number;
}

export function WizardSteps({ steps, currentStep }: WizardStepsProps) {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10">
          <motion.div
            className="h-full aurora-gradient-1"
            initial={{ width: "0%" }}
            animate={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "border-2 transition-all duration-300",
                  isCompleted || isCurrent
                    ? "aurora-gradient-1 border-transparent"
                    : "glass border-white/20"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </motion.div>

              <div className="mt-3 text-center max-w-32">
                <p className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

