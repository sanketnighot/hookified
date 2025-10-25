"use client";

import { HookDetailView } from "@/components/hook-detail/HookDetailView";
import { PageContainer } from "@/components/layout/PageContainer";
import { Hook } from "@/lib/types";
import { useEffect, useState } from "react";
import { use } from "react";
import { notFound } from "next/navigation";

export default function HookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hook, setHook] = useState<Hook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHook = async () => {
      try {
        const response = await fetch(`/api/hooks/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error("Failed to fetch hook");
        }
        const data = await response.json();
        setHook(data.hook);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hook");
      } finally {
        setLoading(false);
      }
    };

    fetchHook();
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading hook...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !hook) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-400">{error || "Hook not found"}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <HookDetailView hook={hook} />
    </PageContainer>
  );
}

