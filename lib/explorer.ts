export const ROBINHOOD_EXPLORER_BASE =
  "https://explorer.mainnet.chain.robinhood.com";

export function explorerTxLink(txHash: string | null): string | null {
  if (txHash === null) {
    return null;
  }
  return `${ROBINHOOD_EXPLORER_BASE}/tx/${txHash}`;
}
