import { UnauthorizedError } from '@/lib/errors/AuthError'
import { createClient } from '@/lib/supabase/server'
import { UserService } from '@/services/user.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session || !session.user) {
      throw new UnauthorizedError('Invalid session')
    }

    const supabaseUser = session.user

    // Check if user exists in our database
    let user = await UserService.getUserBySupabaseId(supabaseUser.id)

    if (!user) {
      // Create new user in our database
      user = await UserService.createUser({
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        supabaseId: supabaseUser.id
      })
    } else {
      // Update existing user with latest data from Supabase
      user = await UserService.updateUser(user.id, {
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || user.name,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || user.avatarUrl,
        updatedAt: new Date()
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
