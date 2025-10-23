"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMockHook } from "@/lib/mockData";
import { Template } from "@/lib/types";
import { useHookStore } from "@/store/useHookStore";
import { motion } from "framer-motion";
import { Copy, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();
  const { addHook } = useHookStore();

  const handleCopy = () => {
    const newHook = generateMockHook({
      name: template.name,
      triggerConfig: template.triggerConfig,
      actionConfig: template.actionConfig,
    });
    addHook(newHook);
    toast.success("Template copied to your hooks!");
    router.push("/dashboard");
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass neo-flat border-white/10 hover:border-white/20 transition-all h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              {template.category}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>{template.popularity}</span>
            </div>
          </div>
          <CardTitle className="text-lg">{template.name}</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between">
          <p className="text-sm text-muted-foreground mb-4">
            {template.description}
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{template.triggerConfig.type}</span>
              <span>→</span>
              <span>{template.actionConfig.type}</span>
            </div>

            <Button
              onClick={handleCopy}
              className="w-full aurora-gradient-1 hover:opacity-90 transition-opacity"
            >
              <Copy className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

