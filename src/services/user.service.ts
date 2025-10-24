import { prisma } from '@/lib/prisma'
import type { User, Prisma } from '@prisma/client'

export class UserService {
  static async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({
      data
    })
  }

  static async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    })
  }

  static async getUserBySupabaseId(supabaseId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { supabaseId }
    })
  }

  static async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data
    })
  }

  static async deleteUser(id: string): Promise<User> {
    return await prisma.user.delete({
      where: { id }
    })
  }

  static async getUserWithHooks(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        hooks: {
          orderBy: { createdAt: 'desc' }
        },
        wallets: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }
}
