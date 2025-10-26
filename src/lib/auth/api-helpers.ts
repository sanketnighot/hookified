import { NextRequest } from "next/server";
import { User } from "../../generated/prisma";
import { getUser } from "./session";

export async function getUserFromRequest(
  req: NextRequest
): Promise<User | null> {
  // Use the existing session helper to get user
  const user = await getUser();

  if (!user) {
    return null;
  }

  return user;
}

export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getUserFromRequest(req);

  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }

  return user;
}
