import { CTASection } from "@/components/landing/CTASection";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";

export default function Home() {
  return (
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
  );
}
