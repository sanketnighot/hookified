import { InternalServerError, ValidationError } from '@/lib/errors/AuthError'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  provider: z.enum(['email', 'google']).default('email')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, provider } = signupSchema.parse(body)

    const supabase = await createClient()

    if (provider === 'email') {
      // Send OTP for email authentication
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        },
      });

      if (error) {
        throw new InternalServerError(`Failed to send OTP: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        message: "OTP sent to your email",
      });
    } else if (provider === 'google') {
      // Initiate Google OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/`,
        },
      });

      if (error) {
        throw new InternalServerError(`Failed to initiate Google OAuth: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        url: data.url
      })
    }

    throw new ValidationError('Invalid provider')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof ValidationError || error instanceof InternalServerError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
