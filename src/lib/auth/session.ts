import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@prisma/client'

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()

  try {
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

    if (error || !supabaseUser) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id }
    })

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function getUserSession() {
  const supabase = await createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}
