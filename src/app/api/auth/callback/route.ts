import { setAuthCookies } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { UserService } from '@/services/user.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
      const supabase = await createClient()

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
      }

      if (data.session && data.user) {
        try {
          // Check if user exists in our database
          const existingUser = await UserService.getUserBySupabaseId(data.user.id)

          if (!existingUser) {
            // Create user in our database
            await UserService.createUser({
              supabaseId: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
              avatarUrl: data.user.user_metadata?.avatar_url || null,
            })
            console.log('User created in database:', data.user.email)
          } else {
            console.log('User already exists in database:', data.user.email)
          }
        } catch (dbError) {
          console.error('Database error during user registration:', dbError)
          // Continue with redirect even if DB registration fails
        }

        // Set auth cookies and redirect
        const response = NextResponse.redirect(`${origin}${next}`)
        return setAuthCookies(request, response)
      }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
  }
}
