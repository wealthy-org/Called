import "server-only";
import { serverEnv, isAdmin, type EnvSource } from "./env";
import { readSession, type Session } from "./session";

export type AdminGate =
  | { ok: true; session: Session }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Admin routes are allowlisted by wallet address. A signed-out caller gets
 * 401; a signed-in caller whose wallet is not in ADMIN_WALLETS gets 403.
 */
export async function requireAdmin(): Promise<AdminGate> {
  const session = await readSession();
  if (session === null) {
    return { ok: false, status: 401, error: "sign in as an admin" };
  }
  const env = serverEnv(process.env as EnvSource);
  if (!isAdmin(env, session.address)) {
    return { ok: false, status: 403, error: "this wallet is not an admin" };
  }
  return { ok: true, session };
}
