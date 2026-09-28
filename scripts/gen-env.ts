import { randomBytes } from "node:crypto";
import { generatePrivateKey } from "viem/accounts";

function hex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

function base64(bytes: number): string {
  return randomBytes(bytes).toString("base64");
}

const output = `# generated ${new Date().toISOString()}
# Copy these into .env. Nothing here is stored anywhere else.

# Ed25519 seed, 32 bytes as hex. The public key is published at
# /.well-known/called-receipt-key and derives from this value.
RECEIPT_SIGNING_KEY=${hex(32)}

# 32 random bytes used as the PBKDF2 input for AES-256-GCM payload encryption.
PAYLOAD_ENCRYPTION_KEY=${base64(32)}

# 32 random bytes used to derive session tokens. Rotating it signs everyone out.
SESSION_SECRET=${hex(32)}

# Shared secret the cron routes expect as: Authorization: Bearer <value>
CRON_SECRET=${hex(32)}

# A fresh Robinhood Chain wallet. Fund it from a faucet so it can pay gas for
# zero-value anchor transactions. The private key never leaves the server.
ANCHOR_PRIVATE_KEY=${generatePrivateKey()}
`;

process.stdout.write(output);
