import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function setAuthCookies(request: NextRequest, response: NextResponse) {
  const supabase = await createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return response
    }

    // Set HTTP-only cookies for session tokens
    response.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    response.cookies.set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error setting auth cookies:', error)
    return response
  }
}

export async function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')
  return response
}

export async function refreshSession(request: NextRequest) {
  const supabase = await createClient()

  try {
    const refreshToken = request.cookies.get('sb-refresh-token')?.value

    if (!refreshToken) {
      return null
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    })

    if (error || !data.session) {
      return null
    }

    return data.session
  } catch (error) {
    console.error('Error refreshing session:', error)
    return null
  }
}
