import "server-only";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE } from "./auth";

export interface Session {
  address: string;
  handle: string;
}

export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return null;
  }

  const [user] = await db
    .select({ address: users.walletAddress, handle: users.handle })
    .from(users)
    .where(eq(users.sessionToken, token))
    .limit(1);

  if (user === undefined) {
    return null;
  }

  return { address: user.address, handle: user.handle };
}
