"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Hook } from "@/lib/types";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";

interface MetricsPanelProps {
  hook: Hook;
}

export function MetricsPanel({ hook }: MetricsPanelProps) {
  // Mock metrics - in real app, calculate from runs
  const metrics = [
    { label: "Total Runs", value: "156", icon: Activity },
    { label: "Successful", value: "152", icon: CheckCircle2, color: "text-green-400" },
    { label: "Failed", value: "4", icon: XCircle, color: "text-red-400" },
    { label: "Avg Duration", value: "2.3s", icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="glass neo-flat border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${metric.color || ""}`}>
                    {metric.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${metric.color || "text-muted-foreground"}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

