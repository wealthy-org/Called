import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (token === undefined || token.length === 0) {
    return NextResponse.json({ handle: null, walletAddress: null });
  }

  const [row] = await db
    .select({ handle: users.handle, walletAddress: users.walletAddress })
    .from(users)
    .where(eq(users.sessionToken, token))
    .limit(1);

  if (row === undefined) {
    return NextResponse.json({ handle: null, walletAddress: null });
  }

  return NextResponse.json({
    handle: row.handle,
    walletAddress: row.walletAddress,
  });
}
