import { setAuthCookies } from '@/lib/auth/helpers'
import { UnauthorizedError, ValidationError } from '@/lib/errors/AuthError'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().optional(),
  provider: z.enum(['email', 'google']).default('email')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, provider } = signinSchema.parse(body)

    const supabase = await createClient()

    if (provider === 'email' && token) {
      // Verify OTP token
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })

      if (error || !data.session) {
        throw new UnauthorizedError('Invalid or expired token')
      }

      // Set auth cookies
      const response = NextResponse.json({
        success: true,
        user: data.user
      })

      return setAuthCookies(request, response)
    }

    throw new ValidationError('Email and token are required for email signin')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof ValidationError || error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
