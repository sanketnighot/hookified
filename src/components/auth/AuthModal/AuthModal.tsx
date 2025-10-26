"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OTPVerification } from "../OTPVerification";
import type {
  AuthFormData,
  AuthModalProps,
  AuthState,
} from "./AuthModal.types";

export function AuthModal({
  isOpen,
  onClose,
  defaultTab = "signin",
  onSuccess,
}: AuthModalProps) {
  const [formData, setFormData] = useState<AuthFormData>({ email: "" });
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
    success: null,
    step: "form",
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState({ ...authState, isLoading: true, error: null });

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setAuthState({
        isLoading: false,
        error: null,
        success: "OTP sent to your email",
        step: "otp",
      });
      toast.success("OTP sent to your email");
    } catch (error) {
      setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to send OTP",
        success: null,
        step: "form",
      });
      toast.error(
        error instanceof Error ? error.message : "Failed to send OTP"
      );
    }
  };

  const handleOTPVerify = async (token: string) => {
    setAuthState({ ...authState, isLoading: true, error: null });

    try {
      // Verify OTP
      const signinResponse = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          token,
          provider: "email",
        }),
      });

      if (!signinResponse.ok) {
        const errorData = await signinResponse.json();
        throw new Error(errorData.error || "Invalid OTP");
      }

      // Register user in our database
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.error || "Failed to register user");
      }

      setAuthState({
        isLoading: false,
        error: null,
        success: "Welcome! Redirecting...",
        step: "success",
      });

      toast.success("Successfully signed in!");

      // Close modal and redirect after a short delay
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = "/dashboard";
        }
      }, 1500);
    } catch (error) {
      setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Verification failed",
        success: null,
        step: "otp",
      });
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
    }
  };

  const handleOTPResend = async () => {
    setAuthState({ ...authState, isLoading: true, error: null });

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setAuthState({
        isLoading: false,
        error: null,
        success: "OTP resent to your email",
        step: "otp",
      });
      toast.success("OTP resent to your email");
    } catch (error) {
      setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to resend OTP",
        success: null,
        step: "otp",
      });
      toast.error(
        error instanceof Error ? error.message : "Failed to resend OTP"
      );
    }
  };

  const handleGoogleAuth = async () => {
    setAuthState({ ...authState, isLoading: true, error: null });

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback/`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Google auth failed",
        success: null,
        step: "form",
      });
      toast.error(
        error instanceof Error ? error.message : "Google auth failed"
      );
    }
  };

  const resetForm = () => {
    setFormData({ email: "" });
    setAuthState({
      isLoading: false,
      error: null,
      success: null,
      step: "form",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-linear-to-br from-background via-background to-space-medium/30 backdrop-blur-xl border border-border/50 shadow-2xl">
        <DialogHeader className="space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DialogTitle className="text-center text-3xl font-bold bg-linear-to-r from-purple-500 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
              Welcome to{" "}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Hookified
              </span>
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground mt-2">
              The future of blockchain automation
            </p>
          </motion.div>
        </DialogHeader>

        {authState.step === "form" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-5"
          >
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={authState.isLoading}
                  className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-purple-500/50 transition-all"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                disabled={authState.isLoading || !formData.email}
              >
                {authState.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-linear-to-r from-transparent via-border to-transparent" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-linear-to-br from-background to-background/80 px-3 py-1 text-muted-foreground font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50 hover:border-purple-500/50 transition-all duration-300 group"
              onClick={handleGoogleAuth}
              disabled={authState.isLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </Button>

            {authState.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm"
              >
                {authState.error}
              </motion.div>
            )}
          </motion.div>
        )}

        {authState.step === "otp" && (
          <OTPVerification
            email={formData.email}
            onVerify={handleOTPVerify}
            onResend={handleOTPResend}
            isLoading={authState.isLoading}
            error={authState.error}
          />
        )}

        {authState.step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-20 h-20 mx-auto bg-linear-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
            >
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>
            <div className="space-y-2">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold bg-linear-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent"
              >
                Success!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground"
              >
                Redirecting to dashboard...
              </motion.p>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
