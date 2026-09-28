import { describe, expect, it } from "vitest";
import { HOUSE_TIERS_BY_ORDER } from "@/config/house-models";
import {
  checkHouseCatalog,
  tierFromCheck,
  unavailableTiers,
} from "./catalog";

function freePricing() {
  return { prompt: "0", completion: "0", request: "0" };
}

function catalogFor(ids: string[]) {
  return {
    data: ids.map((id) => ({
      id,
      pricing: freePricing(),
    })),
  };
}

describe("checkHouseCatalog", () => {
  const allIds = HOUSE_TIERS_BY_ORDER.map((tier) => tier.model);

  it("marks every tier available when all ids are present and free", () => {
    const checks = checkHouseCatalog(catalogFor(allIds));
    expect(checks).toHaveLength(HOUSE_TIERS_BY_ORDER.length);
    expect(checks.every((check) => check.status === "available")).toBe(true);
    expect(unavailableTiers(checks)).toEqual([]);
  });

  it("flags a model that vanished from the catalog as missing", () => {
    const missing = allIds[0];
    const remaining = allIds.filter((id) => id !== missing);
    const checks = checkHouseCatalog(catalogFor(remaining));
    const target = checks.find((check) => check.model === missing);
    expect(target?.status).toBe("missing");
    expect(unavailableTiers(checks).map((check) => check.model)).toEqual([
      missing,
    ]);
  });

  it("flags a model whose price is no longer zero as paid", () => {
    const paidId = allIds[1];
    const payload = {
      data: allIds.map((id) => ({
        id,
        pricing:
          id === paidId
            ? { prompt: "0.000001", completion: "0.000002" }
            : freePricing(),
      })),
    };
    const checks = checkHouseCatalog(payload);
    const target = checks.find((check) => check.model === paidId);
    expect(target?.status).toBe("paid");
  });

  it("treats a :free suffix as free even without pricing fields", () => {
    const id = allIds[0];
    const checks = checkHouseCatalog({ data: [{ id }] });
    expect(checks.find((check) => check.model === id)?.status).toBe("available");
  });

  it("returns unknown for every tier when the payload is not understood", () => {
    for (const payload of [null, undefined, {}, { data: "nope" }, []]) {
      const checks = checkHouseCatalog(payload);
      expect(checks).toHaveLength(HOUSE_TIERS_BY_ORDER.length);
      expect(checks.every((check) => check.status === "unknown")).toBe(true);
      expect(unavailableTiers(checks)).toHaveLength(HOUSE_TIERS_BY_ORDER.length);
    }
  });

  it("ignores malformed catalog entries", () => {
    const payload = {
      data: [{ nope: true }, null, "x", { id: allIds[0], pricing: freePricing() }],
    };
    const checks = checkHouseCatalog(payload);
    expect(
      checks.find((check) => check.model === allIds[0])?.status,
    ).toBe("available");
  });
});

describe("tierFromCheck", () => {
  it("resolves a check back to its tier config", () => {
    const [check] = checkHouseCatalog(
      catalogFor(HOUSE_TIERS_BY_ORDER.map((tier) => tier.model)),
    );
    const tier = tierFromCheck(check);
    expect(tier?.id).toBe(HOUSE_TIERS_BY_ORDER[0].id);
    expect(tier?.isPrimary).toBe(true);
  });

  it("returns null for an unknown tier id", () => {
    expect(
      tierFromCheck({
        tierId: "house:nope",
        name: "Nope",
        model: "nope/nope",
        status: "missing",
        reason: "x",
      }),
    ).toBeNull();
  });
});
