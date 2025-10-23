"use client";

import { Button } from "@/components/ui/button";
import { slideInVariants } from "@/lib/animations";
import { generateMockHook } from "@/lib/mockData";
import { ActionType, TriggerType } from "@/lib/types";
import { useHookStore } from "@/store/useHookStore";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ActionSelector } from "../ActionSelector";
import { FlowBuilder } from "../FlowBuilder";
import { TriggerSelector } from "../TriggerSelector";
import { WizardSteps } from "../WizardSteps";

const steps = [
  { id: 1, name: "Select Trigger", description: "Choose what starts your hook" },
  { id: 2, name: "Select Action", description: "Choose what happens next" },
  { id: 3, name: "Configure", description: "Set up your automation" },
];

export function HookWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const { addHook } = useHookStore();
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    if (selectedTrigger && selectedAction) {
      const newHook = generateMockHook({
        name: "New Hook",
        triggerType: selectedTrigger,
        triggerConfig: { type: selectedTrigger },
        actionConfig: { type: selectedAction },
      });
      addHook(newHook);
      toast.success("Hook created successfully!");
      router.push("/dashboard");
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedTrigger !== null;
    if (currentStep === 2) return selectedAction !== null;
    return true;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <WizardSteps steps={steps} currentStep={currentStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={slideInVariants}
          className="mt-8"
        >
          {currentStep === 1 && (
            <TriggerSelector
              selected={selectedTrigger}
              onSelect={setSelectedTrigger}
            />
          )}
          {currentStep === 2 && (
            <ActionSelector
              selected={selectedAction}
              onSelect={setSelectedAction}
            />
          )}
          {currentStep === 3 && (
            <FlowBuilder
              trigger={selectedTrigger}
              action={selectedAction}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="glass border-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < steps.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="aurora-gradient-1"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={!canProceed()}
            className="aurora-gradient-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Create Hook
          </Button>
        )}
      </div>
    </div>
  );
}

