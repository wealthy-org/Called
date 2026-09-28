import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  NONCE_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  sessionToken,
  verifySiweMessage,
} from "@/lib/auth";
import { isAdmin, ROBINHOOD_CHAIN_ID, serverEnv, type EnvSource } from "@/lib/env";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface VerifyBody {
  message?: unknown;
  signature?: unknown;
  handle?: unknown;
}

export async function POST(request: Request) {
  const env = serverEnv(process.env as EnvSource);

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body.message !== "string" || typeof body.signature !== "string") {
    return NextResponse.json(
      { error: "message and signature are required" },
      { status: 400 },
    );
  }

  const jar = await cookies();
  const expectedNonce = jar.get(NONCE_COOKIE)?.value;
  if (expectedNonce === undefined) {
    return NextResponse.json({ error: "no active nonce" }, { status: 400 });
  }

  const result = await verifySiweMessage({
    message: body.message,
    signature: body.signature as `0x${string}`,
    expectedNonce,
    expectedChainId: ROBINHOOD_CHAIN_ID,
    expectedDomain: new URL(request.url).host,
    expectedUri: new URL(request.url).origin,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }

  const handle =
    typeof body.handle === "string" && body.handle.trim().length > 0
      ? body.handle.trim()
      : `w${result.address.slice(2, 8).toLowerCase()}`;

  const [existing] = await db
    .select({ handle: users.handle })
    .from(users)
    .where(eq(users.walletAddress, result.address));

  if (existing === undefined) {
    await db
      .insert(users)
      .values({ walletAddress: result.address, handle })
      .onConflictDoNothing();
  }

  const finalHandle = existing?.handle ?? handle;

  const response = NextResponse.json({
    address: result.address,
    handle: finalHandle,
    admin: isAdmin(env, result.address),
  });

  response.cookies.set(NONCE_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  response.cookies.set(SESSION_COOKIE, await sessionToken(result.address, env.SESSION_SECRET), {
    ...sessionCookieOptions,
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}
