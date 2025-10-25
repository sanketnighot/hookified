"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface HookRun {
  id: string;
  status: string;
  triggeredAt: Date | string;
  meta?: any;
  error?: string;
}

interface ExecutionTimelineProps {
  hookId: string;
}

export function ExecutionTimeline({ hookId }: ExecutionTimelineProps) {
  const [runs, setRuns] = useState<HookRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        // For now, runs will be empty since we don't have a runs API
        // Once the hook execution engine is implemented, this will fetch real data
        setRuns([]);
      } catch (error) {
        console.error("Failed to fetch runs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, [hookId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "FAILED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <Card className="glass neo-flat border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Execution History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : runs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No executions yet
          </p>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
            className="space-y-4"
          >
            {runs.map((run) => (
              <motion.div
                key={run.id}
                variants={slideUpVariants}
                className="flex items-start gap-4 p-4 rounded-lg glass hover:bg-white/5 transition-colors"
              >
                <div className="mt-1">{getStatusIcon(run.status)}</div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={cn("text-xs", getStatusColor(run.status))}
                    >
                      {run.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(run.triggeredAt).toLocaleString()}
                    </span>
                  </div>

                  {run.meta && (
                    <div className="text-sm text-muted-foreground">
                      <pre className="font-mono text-xs">
                        {JSON.stringify(run.meta, null, 2)}
                      </pre>
                    </div>
                  )}

                  {run.error && (
                    <p className="text-sm text-red-400">{run.error}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

