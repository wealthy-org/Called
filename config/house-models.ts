export interface HouseModelTier {
  id: string;
  name: string;
  shortName: string;
  model: string;
  vendor: string;
  order: number;
  isPrimary: boolean;
  isReserve: boolean;
  isRanked: boolean;
  supportsSeed: boolean;
  supportsStructuredOutput: boolean;
  temperature: number;
  maxTokens: number;
}

export const HOUSE_LABEL = "House model";

export const HOUSE_MODELS: readonly HouseModelTier[] = [
  {
    id: "house:cassandra",
    name: "Cassandra",
    shortName: "C",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    vendor: "NVIDIA",
    order: 1,
    isPrimary: true,
    isReserve: false,
    isRanked: true,
    supportsSeed: true,
    supportsStructuredOutput: true,
    temperature: 0,
    maxTokens: 200,
  },
  {
    id: "house:helenus",
    name: "Helenus",
    shortName: "H",
    model: "google/gemma-4-31b-it:free",
    vendor: "Google",
    order: 2,
    isPrimary: false,
    isReserve: true,
    isRanked: true,
    supportsSeed: true,
    supportsStructuredOutput: true,
    temperature: 0,
    maxTokens: 200,
  },
  {
    id: "house:pythia",
    name: "Pythia",
    shortName: "P",
    model: "qwen/qwen3.8-27b:free",
    vendor: "Alibaba",
    order: 3,
    isPrimary: false,
    isReserve: true,
    isRanked: true,
    supportsSeed: false,
    supportsStructuredOutput: true,
    temperature: 0,
    maxTokens: 200,
  },
  {
    id: "house:tiresias",
    name: "Tiresias",
    shortName: "T",
    model: "nex-agi/nex-n2.5-pro:free",
    vendor: "Nex",
    order: 4,
    isPrimary: false,
    isReserve: true,
    isRanked: true,
    supportsSeed: false,
    supportsStructuredOutput: true,
    temperature: 0,
    maxTokens: 200,
  },
  {
    id: "house:calchas",
    name: "Calchas",
    shortName: "K",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    vendor: "NVIDIA",
    order: 5,
    isPrimary: false,
    isReserve: true,
    isRanked: true,
    supportsSeed: true,
    supportsStructuredOutput: false,
    temperature: 0,
    maxTokens: 200,
  },
  {
    id: "house:stray",
    name: "Stray",
    shortName: "S",
    model: "openrouter/free",
    vendor: "OpenRouter",
    order: 6,
    isPrimary: false,
    isReserve: true,
    isRanked: false,
    supportsSeed: false,
    supportsStructuredOutput: false,
    temperature: 0,
    maxTokens: 200,
  },
];

export const HOUSE_TIERS_BY_ORDER: readonly HouseModelTier[] = [...HOUSE_MODELS].sort(
  (a, b) => a.order - b.order,
);

export const PRIMARY_HOUSE_MODEL: HouseModelTier = HOUSE_TIERS_BY_ORDER[0];

export const HOUSE_MODEL_IDS: readonly string[] = HOUSE_MODELS.map(
  (tier) => tier.id,
);

export const HOUSE_MODEL_BY_ID: ReadonlyMap<string, HouseModelTier> = new Map(
  HOUSE_MODELS.map((tier) => [tier.id, tier]),
);

export const STRAY_TIER_ID = "house:stray";

export function isRankedHouseTier(id: string): boolean {
  return HOUSE_MODEL_BY_ID.get(id)?.isRanked ?? false;
}
