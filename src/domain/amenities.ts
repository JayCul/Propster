/**
 * Amenity vocabulary. Users type "prepaid meter", listings say "Prepaid
 * Electricity Meter" and a phone agent says "yes it's on prepaid". All three
 * have to collapse onto one canonical key before anything can be compared.
 */

export type AmenityKey =
  | "parking"
  | "prepaid_meter"
  | "security"
  | "generator"
  | "borehole"
  | "internet"
  | "air_conditioning"
  | "furnished"
  | "gym"
  | "pool"
  | "elevator"
  | "serviced"
  | "pets";

interface AmenityDefinition {
  key: AmenityKey;
  label: string;
  /** Lowercased substrings that imply this amenity. */
  synonyms: string[];
}

const DEFINITIONS: AmenityDefinition[] = [
  {
    key: "parking",
    label: "Parking",
    synonyms: ["parking", "car park", "carport", "garage", "parking space"],
  },
  {
    key: "prepaid_meter",
    label: "Prepaid meter",
    synonyms: ["prepaid", "pre-paid", "prepaid meter", "prepaid electricity", "meter"],
  },
  {
    key: "security",
    label: "Security",
    synonyms: ["security", "gated", "guard", "cctv", "estate security"],
  },
  {
    key: "generator",
    label: "Generator",
    synonyms: ["generator", "gen", "backup power", "power backup", "inverter"],
  },
  {
    key: "borehole",
    label: "Water / borehole",
    synonyms: ["borehole", "water", "treated water", "water supply"],
  },
  {
    key: "internet",
    label: "Internet",
    synonyms: ["internet", "fibre", "fiber", "broadband", "wifi", "wi-fi"],
  },
  {
    key: "air_conditioning",
    label: "Air conditioning",
    synonyms: ["air conditioning", "air-conditioning", "ac", "a/c", "split unit"],
  },
  {
    key: "furnished",
    label: "Furnished",
    synonyms: ["furnished", "fully furnished", "semi furnished"],
  },
  { key: "gym", label: "Gym", synonyms: ["gym", "fitness"] },
  { key: "pool", label: "Swimming pool", synonyms: ["pool", "swimming"] },
  { key: "elevator", label: "Elevator", synonyms: ["elevator", "lift"] },
  { key: "serviced", label: "Serviced", synonyms: ["serviced", "service charge included"] },
  { key: "pets", label: "Pets allowed", synonyms: ["pet", "pets", "dog", "cat"] },
];

const BY_KEY = new Map(DEFINITIONS.map((d) => [d.key, d]));

/** Map a free-text amenity phrase onto a canonical key, or null if unknown. */
export function canonicalizeAmenity(raw: string): AmenityKey | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  // Longest synonym first so "prepaid meter" beats a bare "meter".
  let best: { key: AmenityKey; length: number } | null = null;
  for (const def of DEFINITIONS) {
    for (const synonym of def.synonyms) {
      const matches = text === synonym || text.includes(synonym);
      if (matches && (!best || synonym.length > best.length)) {
        best = { key: def.key, length: synonym.length };
      }
    }
  }
  return best?.key ?? null;
}

export function canonicalizeAmenities(list: readonly string[]): AmenityKey[] {
  const seen = new Set<AmenityKey>();
  for (const item of list) {
    const key = canonicalizeAmenity(item);
    if (key) seen.add(key);
  }
  return [...seen];
}

export function amenityLabel(key: AmenityKey): string {
  return BY_KEY.get(key)?.label ?? key;
}

/**
 * Read the verified value of one amenity out of the structured call result.
 * `undefined` means the call never established it — which is different from
 * `false`, and the scoring treats it differently.
 */
export function verifiedAmenityValue(
  key: AmenityKey,
  verified: {
    parkingAvailable?: boolean;
    securityAvailable?: boolean;
    generatorAvailable?: boolean;
    internetAvailable?: boolean;
    airConditioning?: boolean;
    furnished?: boolean;
    petsAllowed?: boolean;
    electricityType?: string;
    waterSupply?: string;
  },
): boolean | undefined {
  switch (key) {
    case "parking":
      return verified.parkingAvailable;
    case "security":
      return verified.securityAvailable;
    case "generator":
      return verified.generatorAvailable;
    case "internet":
      return verified.internetAvailable;
    case "air_conditioning":
      return verified.airConditioning;
    case "furnished":
      return verified.furnished;
    case "pets":
      return verified.petsAllowed;
    case "prepaid_meter":
      if (verified.electricityType === undefined) return undefined;
      return /prepaid|pre-paid|pre paid/i.test(verified.electricityType);
    case "borehole":
      if (verified.waterSupply === undefined) return undefined;
      return verified.waterSupply.trim().length > 0;
    default:
      // Amenities the call script does not probe (gym, pool, lift, serviced).
      return undefined;
  }
}
