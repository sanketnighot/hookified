"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface HookRun {
  id: string;
  status: string;
  triggeredAt: Date | string;
  completedAt?: Date | string;
  meta?: {
    triggerContext?: any;
    actions: Array<{
      actionId: string;
      actionType: string;
      status: "SUCCESS" | "FAILED";
      startedAt: string;
      completedAt: string;
      duration: number;
      result?: any;
      error?: string;
    }>;
    totalDuration: number;
    failedAt?: number;
  };
  error?: string;
}

interface ExecutionTimelineProps {
  hookId: string;
}

export function ExecutionTimeline({ hookId }: ExecutionTimelineProps) {
  const [runs, setRuns] = useState<HookRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  const fetchRuns = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Add timestamp to bypass cache
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/hooks/${hookId}/runs?limit=20&_t=${timestamp}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch runs");
      }
      const data = await response.json();

      // Force state update with a new array reference
      const newRuns = data.runs || [];
      setRuns([...newRuns]); // Create new array reference
    } catch (error) {
      console.error("Failed to fetch runs:", error);
      setRuns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    const now = Date.now();
    setLastRefreshTime(now);
    setRefreshKey((prev) => prev + 1); // Force re-render

    // Test the test endpoint first
    fetch(`/api/test/runs?hookId=${hookId}&_t=${now}`)
      .then((res) => res.json())
      .catch((err) => {
        console.error("Test endpoint error:", err);
      });

    fetchRuns(true);
  };

  useEffect(() => {
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Execution History</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-muted-foreground hover:text-white hover:bg-white/10"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : runs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No executions yet
          </p>
        ) : (
          <div key={`${refreshKey}-${lastRefreshTime}`} className="space-y-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className="rounded-lg glass hover:bg-white/5 transition-colors"
              >
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedRun(expandedRun === run.id ? null : run.id)
                  }
                >
                  <div className="mt-1">{getStatusIcon(run.status)}</div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn("text-xs", getStatusColor(run.status))}
                        >
                          {run.status}
                        </Badge>
                        {run.meta?.totalDuration && (
                          <span className="text-xs text-muted-foreground">
                            {(run.meta.totalDuration / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(run.triggeredAt).toLocaleString()}
                      </span>
                    </div>

                    {run.error && (
                      <p className="text-sm text-red-400">{run.error}</p>
                    )}

                    {run.meta?.actions && run.meta.actions.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {run.meta.actions.length} action
                        {run.meta.actions.length !== 1 ? "s" : ""} executed
                        {run.meta.failedAt !== undefined && (
                          <span className="text-red-400 ml-2">
                            (Failed at action {run.meta.failedAt + 1})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedRun === run.id && run.meta && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <div className="mt-4 space-y-3">
                      {/* Trigger context */}
                      {run.meta.triggerContext && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">
                            Trigger Context
                          </h4>
                          <pre className="text-xs text-muted-foreground bg-black/20 p-2 rounded overflow-x-auto">
                            {JSON.stringify(run.meta.triggerContext, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Action details */}
                      {run.meta.actions && run.meta.actions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">
                            Action Details
                          </h4>
                          <div className="space-y-2">
                            {run.meta.actions.map((action, index) => (
                              <div
                                key={action.actionId}
                                className={cn(
                                  "p-3 rounded border",
                                  action.status === "SUCCESS"
                                    ? "bg-green-500/10 border-green-500/20"
                                    : "bg-red-500/10 border-red-500/20"
                                )}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">
                                    Action {index + 1}: {action.actionType}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        action.status === "SUCCESS"
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-red-500/20 text-red-400"
                                      )}
                                    >
                                      {action.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {(action.duration / 1000).toFixed(1)}s
                                    </span>
                                  </div>
                                </div>

                                {action.error && (
                                  <p className="text-xs text-red-400 mt-1">
                                    {action.error}
                                  </p>
                                )}

                                {action.result && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-muted-foreground cursor-pointer">
                                      View Result
                                    </summary>
                                    <pre className="text-xs text-muted-foreground bg-black/20 p-2 rounded mt-1 overflow-x-auto">
                                      {JSON.stringify(action.result, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

