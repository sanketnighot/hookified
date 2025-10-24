"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slideUpVariants } from "@/lib/animations";
import { BlockValidationResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface ValidationPanelProps {
  validation: BlockValidationResult;
  className?: string;
}

export function ValidationPanel({ validation, className }: ValidationPanelProps) {
  const { isValid, errors, warnings } = validation;

  if (isValid && errors.length === 0 && warnings.length === 0) {
    return (
      <motion.div
        variants={slideUpVariants}
        className={cn("flex items-center gap-2 text-green-500", className)}
      >
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Ready to save</span>
      </motion.div>
    );
  }

  return (
    <motion.div variants={slideUpVariants} className={className}>
      <Card className={cn(
        "glass border-white/10",
        errors.length > 0 ? "border-red-500/30" : warnings.length > 0 ? "border-yellow-500/30" : "border-green-500/30"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {errors.length > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-500">Issues Found</span>
              </>
            ) : warnings.length > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500">Warnings</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-500">All Good</span>
              </>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-500">
                  {errors.length} Error{errors.length > 1 ? "s" : ""}
                </span>
              </div>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-400 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-500">
                  {warnings.length} Warning{warnings.length > 1 ? "s" : ""}
                </span>
              </div>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-400 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Help Text */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                {errors.length > 0 ? (
                  <p>Fix the errors above before saving your hook.</p>
                ) : warnings.length > 0 ? (
                  <p>Your hook will work, but consider addressing these warnings for better reliability.</p>
                ) : (
                  <p>Your hook is ready to be saved and activated.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
