"use client";

import { useState } from "react";

const CHAIN_ID = 2021;
const CHAIN_HEX = "0x7e5";

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
}

function siweMessage(address: string, nonce: string): string {
  const origin = window.location.origin;
  const domain = window.location.host;
  return [
    `${domain} wants you to sign in with your wallet:`,
    address,
    "",
    "Sign in to Called.",
    "",
    `URI: ${origin}`,
    "Version: 1",
    `Chain ID: ${CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "wallet sign-in failed";
}

export function SignInModal({ open, onClose, onSignedIn }: SignInModalProps) {
  const [status, setStatus] = useState<"idle" | "signing">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function signIn() {
    setError(null);
    const provider = window.ethereum;
    if (!provider) {
      setError("No wallet found. Install a wallet extension first.");
      return;
    }

    setStatus("signing");
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as unknown;
      const address = Array.isArray(accounts) && typeof accounts[0] === "string"
        ? accounts[0]
        : "";
      if (address.length === 0) {
        throw new Error("wallet returned no address");
      }

      const chain = await provider.request({ method: "eth_chainId" });
      if (chain !== CHAIN_HEX) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: CHAIN_HEX }],
          });
        } catch (caught) {
          const code =
            typeof caught === "object" && caught !== null && "code" in caught
              ? (caught as { code?: unknown }).code
              : undefined;
          if (code !== 4902) {
            throw caught;
          }
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CHAIN_HEX,
                 chainName: "Robinhood Chain",
                nativeCurrency: { name: "Robinhood ETH", symbol: "ETH", decimals: 18 },
                 rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
                 blockExplorerUrls: ["https://explorer.mainnet.chain.robinhood.com"],
              },
            ],
          });
        }
      }

      const nonceResponse = await fetch("/api/auth/nonce", { method: "POST" });
      const nonceBody = (await nonceResponse.json()) as { nonce?: unknown; error?: unknown };
      if (!nonceResponse.ok || typeof nonceBody.nonce !== "string") {
        throw new Error(
          typeof nonceBody.error === "string" ? nonceBody.error : "could not start sign-in",
        );
      }

      const message = siweMessage(address, nonceBody.nonce);
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, address],
      });
      if (typeof signature !== "string") {
        throw new Error("wallet returned no signature");
      }

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          signature,
        }),
      });
      const verifyBody = (await verifyResponse.json()) as { error?: unknown };
      if (!verifyResponse.ok) {
        throw new Error(
          typeof verifyBody.error === "string" ? verifyBody.error : "sign-in verification failed",
        );
      }

      setStatus("idle");
      onSignedIn?.();
      onClose();
    } catch (caught) {
      setStatus("idle");
      setError(errorMessage(caught));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-void/85 p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-title"
        className="w-full max-w-md rounded-panel border border-line bg-ink p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="kicker">Wallet session</p>
            <h2 id="sign-in-title" className="mt-2 font-display text-3xl font-bold text-bone">
              Sign in to continue
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close sign-in dialog"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-field border border-line font-mono text-xl text-mute hover:border-bone hover:text-bone"
          >
            x
          </button>
        </div>
        <p className="mt-4 text-sm text-mute">
          Called uses one wallet signature to create your session. No transaction or gas is required.
        </p>
        <button
          type="button"
          onClick={() => void signIn()}
          disabled={status === "signing"}
          className="mt-5 min-h-11 w-full rounded-field bg-seal px-4 font-semibold text-void hover:bg-bone disabled:opacity-50"
        >
          {status === "signing" ? "Waiting for wallet" : "Sign in with wallet"}
        </button>
        {error ? (
          <p className="mt-4 break-words font-mono text-sm text-seal" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
