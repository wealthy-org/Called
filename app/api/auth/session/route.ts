import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth";
import { serverEnv, isAdmin, type EnvSource } from "@/lib/env";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (token === undefined || token.length === 0) {
    return NextResponse.json({ handle: null, walletAddress: null, isAdmin: false });
  }

  const [row] = await db
    .select({ handle: users.handle, walletAddress: users.walletAddress })
    .from(users)
    .where(eq(users.sessionToken, token))
    .limit(1);

  if (row === undefined) {
    return NextResponse.json({ handle: null, walletAddress: null, isAdmin: false });
  }

  const env = serverEnv(process.env as EnvSource);
  const admin = isAdmin(env, row.walletAddress);

  return NextResponse.json({
    handle: row.handle,
    walletAddress: row.walletAddress,
    isAdmin: admin,
  });
}
