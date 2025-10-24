import { clearAuthCookies } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Supabase signout error:', error)
    }

    // Clear auth cookies
    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    })

    return clearAuthCookies(response)
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
