import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (token !== undefined && token.length > 0) {
    await db
      .update(users)
      .set({ sessionToken: null })
      .where(eq(users.sessionToken, token));
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
