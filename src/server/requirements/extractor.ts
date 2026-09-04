import "server-only";

import { usingClaude } from "../env";
import { activeProvider, completeJson, parseJsonObject } from "../llm";
import { logger } from "../logger";
import {
  propertySearchRequirementSchema,
  type ParsedRequirement,
} from "@/domain/schemas";
import { extractRequirementWithRules } from "./ruleExtractor";

/**
 * Natural-language requirement extraction.
 *
 * The configured language model produces the structure when a key is present;
 * the deterministic parser produces it otherwise, and also rescues the request
 * when the model returns something that fails schema validation. Model output
 * is never used without passing `propertySearchRequirementSchema` first.
 */

export interface ExtractionOutcome {
  requirement: ParsedRequirement;
  source: "model" | "rules";
}

const SYSTEM_PROMPT = [
  "You convert a renter's plain-English description into a structured property search requirement.",
  "You are working in the Nigerian rental market. Rent is quoted in Naira and usually per year.",
  "",
  "Rules:",
  "- Return ONLY a JSON object. No prose, no code fences.",
  '- Money must be a plain number of Naira: "8 million" is 8000000, "800k" is 800000.',
  '- rentPeriod is "yearly" unless the user clearly says per month.',
  "- Omit any field the user did not express. Never invent a budget, a bedroom count or an area.",
  '- amenities is a short list of lowercase phrases, e.g. ["parking", "prepaid meter", "security"].',
  "- additionalRequirements holds anything else material that is not a structured field.",
  "",
  "Shape:",
  "{",
  '  "location": string,',
  '  "propertyType"?: string,',
  '  "bedrooms"?: integer,',
  '  "bathrooms"?: integer,',
  '  "minRent"?: number,',
  '  "maxRent"?: number,',
  '  "rentPeriod": "monthly" | "yearly",',
  '  "moveInDate"?: string,',
  '  "amenities": string[],',
  '  "additionalRequirements": string[]',
  "}",
].join("\n");

async function extractWithModel(text: string): Promise<ParsedRequirement | null> {
  const response = await completeJson({
    system: SYSTEM_PROMPT,
    user: text,
    maxTokens: 700,
  });

  const candidate = parseJsonObject(response);
  if (candidate === null) return null;

  const result = propertySearchRequirementSchema.safeParse(candidate);
  if (!result.success) {
    logger.warn("extraction.model_schema_invalid", {
      provider: activeProvider(),
      issues: result.error.issues.length,
    });
    return null;
  }
  return result.data;
}

/**
 * Convert free text into a validated requirement.
 *
 * Throws only when neither path can produce something usable, which in
 * practice means the text contained no recognisable location.
 */
export async function extractRequirement(text: string): Promise<ExtractionOutcome | null> {
  if (usingClaude()) {
    try {
      const requirement = await extractWithModel(text);
      if (requirement) return { requirement, source: "model" };
      logger.warn("extraction.model_unusable_falling_back", { provider: activeProvider() });
    } catch (error) {
      logger.warn("extraction.model_failed", {
        provider: activeProvider(),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const fallback = extractRequirementWithRules(text);
  return fallback ? { requirement: fallback, source: "rules" } : null;
}

/**
 * Merge structured form fields over an extracted requirement. Explicit form
 * input always wins over anything inferred from prose.
 */
export function mergeRequirements(
  base: ParsedRequirement | null,
  overrides: Partial<ParsedRequirement> | undefined,
): ParsedRequirement | null {
  if (!overrides) return base;

  const merged: Record<string, unknown> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    merged[key] = value;
  }

  const result = propertySearchRequirementSchema.safeParse(merged);
  return result.success ? result.data : base;
}

/** One-line human summary used in the dashboard header. */
export function describeRequirement(requirement: ParsedRequirement): string {
  const parts: string[] = [];
  if (requirement.bedrooms !== undefined) parts.push(requirement.bedrooms + " bedroom");
  if (requirement.propertyType) parts.push(requirement.propertyType);
  parts.push(requirement.location);
  if (requirement.maxRent !== undefined) {
    const millions = requirement.maxRent / 1_000_000;
    const rendered =
      requirement.maxRent >= 1_000_000
        ? "₦" + (Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)) + "M"
        : "₦" + requirement.maxRent.toLocaleString("en-NG");
    parts.push("under " + rendered + "/" + (requirement.rentPeriod === "monthly" ? "month" : "year"));
  }
  return parts.join(" • ");
}
