"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Chrome, Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { OTPVerification } from '../OTPVerification'
import type { AuthFormData, AuthModalProps, AuthState } from './AuthModal.types'

export function AuthModal({ isOpen, onClose, defaultTab = 'signin', onSuccess }: AuthModalProps) {
  const [formData, setFormData] = useState<AuthFormData>({ email: '' })
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
    success: null,
    step: 'form'
  })

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthState({ ...authState, isLoading: true, error: null })

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setAuthState({
        isLoading: false,
        error: null,
        success: 'OTP sent to your email',
        step: 'otp'
      })
      toast.success('OTP sent to your email')
    } catch (error) {
      setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
        success: null,
        step: 'form'
      })
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP')
    }
  }

  const handleOTPVerify = async (token: string) => {
    setAuthState({ ...authState, isLoading: true, error: null })

    try {
      // Verify OTP
      const signinResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          token,
          provider: 'email'
        })
      })

      if (!signinResponse.ok) {
        const errorData = await signinResponse.json()
        throw new Error(errorData.error || 'Invalid OTP')
      }

      // Register user in our database
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(errorData.error || 'Failed to register user')
      }

      setAuthState({
        isLoading: false,
        error: null,
        success: 'Welcome! Redirecting...',
        step: 'success'
      })

      toast.success('Successfully signed in!')

      // Close modal and redirect after a short delay
      setTimeout(() => {
        onClose()
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.href = '/dashboard'
        }
      }, 1500)

    } catch (error) {
      setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        success: null,
        step: 'otp'
      })
      toast.error(error instanceof Error ? error.message : 'Verification failed')
    }
  }

  const handleOTPResend = async () => {
    setAuthState({ ...authState, isLoading: true, error: null })

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP')
      }

      setAuthState({
        isLoading: false,
        error: null,
        success: 'OTP resent to your email',
        step: 'otp'
      })
      toast.success('OTP resent to your email')
    } catch (error) {
      setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
        success: null,
        step: 'otp'
      })
      toast.error(error instanceof Error ? error.message : 'Failed to resend OTP')
    }
  }

  const handleGoogleAuth = async () => {
    setAuthState({ ...authState, isLoading: true, error: null })

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google auth failed',
        success: null,
        step: 'form'
      })
      toast.error(error instanceof Error ? error.message : 'Google auth failed')
    }
  }

  const resetForm = () => {
    setFormData({ email: '' })
    setAuthState({
      isLoading: false,
      error: null,
      success: null,
      step: 'form'
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome to Hookified
          </DialogTitle>
        </DialogHeader>

        {authState.step === 'form' && (
          <div className="space-y-4">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={authState.isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={authState.isLoading || !formData.email}
              >
                {authState.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={authState.isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>

            {authState.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
              >
                {authState.error}
              </motion.div>
            )}
          </div>
        )}

        {authState.step === 'otp' && (
          <OTPVerification
            email={formData.email}
            onVerify={handleOTPVerify}
            onResend={handleOTPResend}
            isLoading={authState.isLoading}
            error={authState.error}
          />
        )}

        {authState.step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">Success!</h3>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
