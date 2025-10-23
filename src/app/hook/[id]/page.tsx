"use client";

import { HookDetailView } from "@/components/hook-detail/HookDetailView";
import { PageContainer } from "@/components/layout/PageContainer";
import { useHookStore } from "@/store/useHookStore";
import { notFound } from "next/navigation";
import { use } from "react";

export default function HookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getHookById } = useHookStore();
  const hook = getHookById(id);

  if (!hook) {
    notFound();
  }

  return (
    <PageContainer>
      <HookDetailView hook={hook} />
    </PageContainer>
  );
}

