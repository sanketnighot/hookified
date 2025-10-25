"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Hook } from "@/lib/types";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface HookRun {
  id: string;
  status: string;
  triggeredAt: Date | string;
  completedAt?: Date | string;
  meta?: {
    totalDuration: number;
    actions: Array<{
      duration: number;
      status: "SUCCESS" | "FAILED";
    }>;
  };
}

interface MetricsPanelProps {
  hook: Hook;
}

export function MetricsPanel({ hook }: MetricsPanelProps) {
  const [runs, setRuns] = useState<HookRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch(`/api/hooks/${hook.id}/runs?limit=100`);
        if (!response.ok) {
          throw new Error("Failed to fetch runs");
        }
        const data = await response.json();
        setRuns(data.runs || []);
      } catch (error) {
        console.error("Failed to fetch runs:", error);
        setRuns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, [hook.id]);

  const totalRuns = runs.length;
  const successful = runs.filter((r) => r.status === "SUCCESS").length;
  const failed = runs.filter((r) => r.status === "FAILED").length;

  // Calculate average duration from meta.totalDuration
  const durations = runs
    .filter((r) => r.meta?.totalDuration !== undefined)
    .map((r) => r.meta!.totalDuration);
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass neo-flat border-white/10">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-8 bg-white/10 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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

