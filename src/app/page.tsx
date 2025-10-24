"use client";

import { AuthModal } from "@/components/auth/AuthModal";
import { CTASection } from "@/components/landing/CTASection";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { useAuth } from "@/providers/AuthProvider";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function HomeContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const redirectTo = searchParams.get("redirectTo");

  useEffect(() => {
    // If there's a redirectTo parameter and user is not authenticated, show auth modal
    if (redirectTo && !user) {
      setIsAuthModalOpen(true);
    }
  }, [redirectTo, user]);

  const handleAuthSuccess = () => {
    // Close modal and redirect to intended page
    setIsAuthModalOpen(false);
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  };

  return (
    <>
      <main className="relative bg-linear-to-br from-background via-space-medium to-space-dark">
        {/* Unified background with gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(180,100,255,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(100,200,255,0.1),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(255,100,200,0.1),transparent_40%)]" />

        {/* Content */}
        <div className="relative z-10">
          <HeroSection />
          <FeatureShowcase />
          <HowItWorks />
          <CTASection />
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
