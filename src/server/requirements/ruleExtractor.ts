import {
  propertySearchRequirementSchema,
  type ParsedRequirement,
} from "@/domain/schemas";

/**
 * Deterministic natural-language requirement parser.
 *
 * This is the fallback when no Claude key is configured, and the safety net
 * when Claude returns something that fails validation. It handles the notation
 * Nigerian renters actually use: "8m", "₦8 million", "N8,000,000", "800k/month".
 *
 * It is intentionally conservative. A field it cannot read confidently is left
 * undefined rather than guessed, because a wrong budget silently filters out
 * the property the user wanted.
 */

const KNOWN_AREAS = [
  "Lekki Phase 1",
  "Lekki Phase 2",
  "Lekki",
  "Ikate",
  "Agungi",
  "Osapa London",
  "Osapa",
  "Chevron",
  "Sangotedo",
  "Ajah",
  "Victoria Island",
  "Ikoyi",
  "Yaba",
  "Ikeja GRA",
  "Ikeja",
  "Surulere",
  "Magodo",
  "Gbagada",
  "Maryland",
  "Oniru",
  "Banana Island",
  "Lagos",
];

const PROPERTY_TYPES: Array<[RegExp, string]> = [
  [/\bself[\s-]?contain(ed)?\b/i, "self contain"],
  [/\bmini[\s-]?flat\b/i, "mini flat"],
  [/\bstudio\b/i, "studio"],
  [/\b(apartment|flat)\b/i, "apartment"],
  [/\bduplex\b/i, "duplex"],
  [/\bterrace[d]?\b/i, "terrace"],
  [/\bbungalow\b/i, "bungalow"],
  [/\bdetached\b/i, "detached"],
  [/\bpenthouse\b/i, "penthouse"],
  [/\bhouse\b/i, "house"],
];

const AMENITY_PATTERNS: Array<[RegExp, string]> = [
  [/\b(parking|car\s?park|garage|carport)\b/i, "parking"],
  [/\bpre[\s-]?paid(\s+(meter|electricity))?\b/i, "prepaid meter"],
  [/\b(security|gated|guard|cctv)\b/i, "security"],
  [/\b(generator|gen\b|backup power|inverter)\b/i, "generator"],
  [/\b(borehole|water supply|treated water)\b/i, "borehole"],
  [/\b(internet|fibre|fiber|broadband|wi[\s-]?fi)\b/i, "internet"],
  [/\b(air[\s-]?condition(ing|ed)?|\bac\b|a\/c)\b/i, "air conditioning"],
  [/\b(furnished)\b/i, "furnished"],
  [/\bgym\b/i, "gym"],
  [/\b(swimming\s?)?pool\b/i, "swimming pool"],
  [/\b(lift|elevator)\b/i, "elevator"],
  [/\bserviced\b/i, "serviced"],
  [/\bpets?\b/i, "pets"],
];

/** Parse a money phrase into a plain number of Naira. */
export function parseMoney(text: string): number | undefined {
  // Matches: 8m, 8 million, ₦8.5m, N8,000,000, 800k, 750,000
  const pattern =
    /(?:₦|ngn|naira|n(?=\s*[\d]))?\s*([\d][\d,]*(?:\.\d+)?)\s*(million|mill|m\b|k\b|thousand)?/i;
  const match = pattern.exec(text);
  if (!match) return undefined;

  const digits = match[1];
  if (!digits) return undefined;
  const base = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(base) || base <= 0) return undefined;

  const unit = match[2]?.toLowerCase();
  if (unit === "k" || unit === "thousand") return base * 1_000;
  if (unit && unit.startsWith("m")) return base * 1_000_000;

  // No unit given. A bare small number in a rent context means millions:
  // "under 8" is 8 million, not 8 Naira.
  if (base < 1000) return base * 1_000_000;
  return base;
}

function detectRentPeriod(text: string): "monthly" | "yearly" {
  if (/\b(per|a|\/)\s*month\b|\bmonthly\b|\bpm\b|\/mo\b/i.test(text)) return "monthly";
  return "yearly";
}

function detectLocation(text: string): string | undefined {
  for (const area of KNOWN_AREAS) {
    const pattern = new RegExp("\\b" + area.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (pattern.test(text)) return area;
  }
  // "in Somewhere" / "at Somewhere" as a last resort.
  const fallback = /\b(?:in|at|around|near)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/.exec(text);
  return fallback?.[1];
}

function detectBedrooms(text: string): number | undefined {
  const numeric = /(\d+)\s*(?:-|\s)?\s*bed(?:room)?s?\b/i.exec(text);
  if (numeric?.[1]) {
    const value = Number(numeric[1]);
    if (Number.isFinite(value) && value >= 0 && value <= 20) return value;
  }
  const words: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  };
  const worded = /\b(one|two|three|four|five|six|seven|eight)\s*(?:-|\s)?\s*bed(?:room)?s?\b/i.exec(text);
  const key = worded?.[1]?.toLowerCase();
  if (key && key in words) return words[key];
  if (/\bstudio\b|\bself[\s-]?contain/i.test(text)) return 1;
  return undefined;
}

function detectBathrooms(text: string): number | undefined {
  const match = /(\d+)\s*(?:-|\s)?\s*bath(?:room)?s?\b/i.exec(text);
  if (!match?.[1]) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 && value <= 20 ? value : undefined;
}

function detectBudget(text: string): { minRent?: number; maxRent?: number } {
  const result: { minRent?: number; maxRent?: number } = {};

  const between = /\bbetween\s+(.+?)\s+and\s+([^,.;]+)/i.exec(text);
  if (between?.[1] && between[2]) {
    const low = parseMoney(between[1]);
    const high = parseMoney(between[2]);
    if (low !== undefined) result.minRent = low;
    if (high !== undefined) result.maxRent = high;
    if (result.minRent !== undefined || result.maxRent !== undefined) return result;
  }

  const max = /\b(?:under|below|less than|max(?:imum)?|up to|not more than|within|budget of)\s+([^,.;]+)/i.exec(text);
  if (max?.[1]) {
    const value = parseMoney(max[1]);
    if (value !== undefined) result.maxRent = value;
  }

  const min = /\b(?:over|above|at least|min(?:imum)?|from)\s+([^,.;]+)/i.exec(text);
  if (min?.[1]) {
    const value = parseMoney(min[1]);
    if (value !== undefined) result.minRent = value;
  }

  return result;
}

function detectMoveIn(text: string): string | undefined {
  const patterns: Array<[RegExp, string]> = [
    [/\b(immediately|right away|asap|as soon as possible)\b/i, "immediately"],
    [/\b(this month|within the month)\b/i, "this month"],
    [/\bnext month\b/i, "next month"],
    [/\bwithin (?:the )?next (\d+) (week|month)s?\b/i, ""],
    [/\bwithin (\d+) (week|month)s?\b/i, ""],
    [/\bin (\d+) (week|month)s?\b/i, ""],
    [
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
      "",
    ],
  ];

  for (const [pattern, label] of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    if (label) return label;
    if (match[2]) return "within " + match[1] + " " + match[2] + (Number(match[1]) > 1 ? "s" : "");
    return match[1]?.toLowerCase();
  }
  return undefined;
}

function detectAmenities(text: string): string[] {
  const found = new Set<string>();
  for (const [pattern, label] of AMENITY_PATTERNS) {
    if (pattern.test(text)) found.add(label);
  }
  return [...found];
}

function detectPropertyType(text: string): string | undefined {
  for (const [pattern, label] of PROPERTY_TYPES) {
    if (pattern.test(text)) return label;
  }
  return undefined;
}

/**
 * Extra constraints worth telling the phone agent about, even though they are
 * not structured fields — "ground floor only", "close to the expressway".
 */
function detectAdditional(text: string): string[] {
  const notes: string[] = [];
  if (/\bground floor\b/i.test(text)) notes.push("Ground floor preferred");
  if (/\bnewly (built|renovated)\b/i.test(text)) notes.push("Newly built or renovated");
  if (/\bbq\b|\bboys?\s?quarters?\b/i.test(text)) notes.push("Boys quarters required");
  if (/\bno agent fee|without agency fee\b/i.test(text)) notes.push("Wants to avoid agency fees");
  if (/\bpay(ment)? plan|instal?ment\b/i.test(text)) notes.push("Asking about a payment plan");
  if (/\bfamily\b/i.test(text)) notes.push("Family occupancy");
  return notes;
}

/**
 * Parse free text into a requirement. Returns null when there is not even a
 * location to work with, so the caller can ask the user for more.
 */
export function extractRequirementWithRules(text: string): ParsedRequirement | null {
  const trimmed = text.trim();
  if (trimmed.length < 3) return null;

  const location = detectLocation(trimmed);
  if (!location) return null;

  const budget = detectBudget(trimmed);

  const candidate = {
    location,
    propertyType: detectPropertyType(trimmed),
    bedrooms: detectBedrooms(trimmed),
    bathrooms: detectBathrooms(trimmed),
    minRent: budget.minRent,
    maxRent: budget.maxRent,
    rentPeriod: detectRentPeriod(trimmed),
    moveInDate: detectMoveIn(trimmed),
    amenities: detectAmenities(trimmed),
    additionalRequirements: detectAdditional(trimmed),
  };

  const result = propertySearchRequirementSchema.safeParse(candidate);
  return result.success ? result.data : null;
}
