import { NextResponse } from "next/server";
import {
  newNonce,
  NONCE_COOKIE,
  NONCE_TTL_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST() {
  const nonce = newNonce();

  const response = NextResponse.json({ nonce });
  response.cookies.set(NONCE_COOKIE, nonce, {
    ...sessionCookieOptions,
    maxAge: NONCE_TTL_SECONDS,
  });

  return response;
}
