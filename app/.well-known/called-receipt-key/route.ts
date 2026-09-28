import { NextResponse } from "next/server";
import { serverEnv, type EnvSource } from "@/lib/env";
import { receiptPublicKey } from "@/lib/receipt";

export async function GET() {
  const env = serverEnv(process.env as EnvSource);
  const publicKey = await receiptPublicKey(env.RECEIPT_SIGNING_KEY);

  return NextResponse.json(
    {
      algorithm: "Ed25519",
      encoding: "base64",
      publicKey,
      usage: "Verify called receipt signatures offline. Receipt messages are built by lib/receipt.ts receiptMessage().",
      version: 1,
    },
    {
      headers: {
        "cache-control": "public, max-age=300",
      },
    },
  );
}
