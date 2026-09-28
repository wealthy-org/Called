import {
  HOUSE_TIERS_BY_ORDER,
  type HouseModelTier,
} from "@/config/house-models";

export type HouseTierStatus = "available" | "missing" | "paid" | "unknown";

export interface HouseTierCheck {
  tierId: string;
  name: string;
  model: string;
  status: HouseTierStatus;
  reason: string;
}

interface CatalogEntry {
  id: string;
  pricing?: Record<string, unknown>;
}

function asCatalog(payload: unknown): CatalogEntry[] | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    return null;
  }
  const entries: CatalogEntry[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string") {
      continue;
    }
    entries.push({
      id: record.id,
      pricing:
        typeof record.pricing === "object" && record.pricing !== null
          ? (record.pricing as Record<string, unknown>)
          : undefined,
    });
  }
  return entries;
}

function isFreeEntry(entry: CatalogEntry): boolean {
  if (entry.pricing) {
    const values = Object.values(entry.pricing);
    if (values.length > 0) {
      return values.every((value) => {
        const numeric = typeof value === "number" ? value : Number(value);
        return Number.isFinite(numeric) && numeric === 0;
      });
    }
  }
  return entry.id.endsWith(":free") || entry.id === "openrouter/free";
}

export function checkHouseCatalog(payload: unknown): HouseTierCheck[] {
  const entries = asCatalog(payload);
  if (entries === null) {
    return HOUSE_TIERS_BY_ORDER.map((tier) => ({
      tierId: tier.id,
      name: tier.name,
      model: tier.model,
      status: "unknown" as const,
      reason: "catalog response was not understood",
    }));
  }

  return HOUSE_TIERS_BY_ORDER.map((tier) => {
    const entry = entries.find((candidate) => candidate.id === tier.model);
    if (!entry) {
      return {
        tierId: tier.id,
        name: tier.name,
        model: tier.model,
        status: "missing" as const,
        reason: `${tier.model} is not in the catalog`,
      };
    }
    if (!isFreeEntry(entry)) {
      return {
        tierId: tier.id,
        name: tier.name,
        model: tier.model,
        status: "paid" as const,
        reason: `${tier.model} is no longer priced at zero`,
      };
    }
    return {
      tierId: tier.id,
      name: tier.name,
      model: tier.model,
      status: "available" as const,
      reason: `${tier.model} present and free`,
    };
  });
}

export function unavailableTiers(checks: HouseTierCheck[]): HouseTierCheck[] {
  return checks.filter((check) => check.status !== "available");
}

export function tierFromCheck(
  check: HouseTierCheck,
  tiers: readonly HouseModelTier[] = HOUSE_TIERS_BY_ORDER,
): HouseModelTier | null {
  return tiers.find((tier) => tier.id === check.tierId) ?? null;
}
