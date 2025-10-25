"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Hook } from "@/lib/types";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";

interface MetricsPanelProps {
  hook: Hook;
  runs?: Array<{ status: string; duration?: number }>;
}

export function MetricsPanel({ hook, runs = [] }: MetricsPanelProps) {
  const totalRuns = runs.length;
  const successful = runs.filter((r) => r.status === "SUCCESS").length;
  const failed = runs.filter((r) => r.status === "FAILED").length;

  // Calculate average duration
  const durations = runs
    .filter((r) => r.duration !== undefined)
    .map((r) => r.duration!);
  const avgDuration =
    durations.length > 0
      ? (
          durations.reduce((a, b) => a + b, 0) /
          durations.length /
          1000
        ).toFixed(1) + "s"
      : "N/A";

  const metrics = [
    { label: "Total Runs", value: totalRuns.toString(), icon: Activity },
    {
      label: "Successful",
      value: successful.toString(),
      icon: CheckCircle2,
      color: "text-green-400",
    },
    {
      label: "Failed",
      value: failed.toString(),
      icon: XCircle,
      color: "text-red-400",
    },
    { label: "Avg Duration", value: avgDuration, icon: Clock },
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
                  <p className="text-sm text-muted-foreground">
                    {metric.label}
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${metric.color || ""}`}
                  >
                    {metric.value}
                  </p>
                </div>
                <Icon
                  className={`w-8 h-8 ${
                    metric.color || "text-muted-foreground"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

