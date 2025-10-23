import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export default function DashboardPage() {
  return (
    <PageContainer>
      <DashboardHeader />
      <DashboardGrid />
    </PageContainer>
  );
}

