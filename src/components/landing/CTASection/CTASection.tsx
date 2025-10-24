"use client";

import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { slideUpVariants } from "@/lib/animations";
import { useAuth } from "@/providers/AuthProvider";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function CTASection() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      // User is authenticated, go to dashboard
      window.location.href = "/dashboard";
    } else {
      // User not authenticated, open auth modal
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideUpVariants}
            className="glass-strong neo-flat rounded-3xl p-12 md:p-16 text-center holographic-border"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm">Start Automating Today</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Automate Your
              <span className="aurora-text"> Blockchain Workflows?</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users already automating their blockchain
              operations with Hookified
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="aurora-gradient-1 hover:opacity-90 transition-opacity group text-lg px-8"
                onClick={handleGetStarted}
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/registry">
                <Button
                  size="lg"
                  variant="outline"
                  className="glass border-white/20 text-lg px-8"
                >
                  View Templates
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
