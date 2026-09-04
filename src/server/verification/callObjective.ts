import { canonicalizeAmenities, amenityLabel } from "@/domain/amenities";
import { formatNaira, toAnnual } from "@/domain/discrepancy";
import type { PropertyListing, PropertySearchRequirement } from "@/domain/types";

/**
 * Builds the objective handed to CALL-E for one verification call.
 *
 * This is an objective, not a script. CALL-E holds a natural conversation; our
 * job is to state what must be established, in priority order, and to set the
 * boundaries the agent must not cross. The user's own requirements drive the
 * priority order, so a renter who cares about parking gets parking asked about
 * first and a renter who did not mention it does not waste the contact's time.
 */

export interface CallObjective {
  task: string;
  /** Ordered checklist mirrored into the UI so the user sees what was asked. */
  questions: string[];
}

export function buildCallObjective(
  listing: PropertyListing,
  requirement: PropertySearchRequirement,
): CallObjective {
  const listedAnnual = toAnnual(listing.rent, listing.rentPeriod);
  const required = canonicalizeAmenities(requirement.amenities);

  const questions: string[] = [
    "Is the property still available to rent?",
    "What is the current asking rent, and is that per year or per month?",
    "How many bedrooms and bathrooms does it have?",
  ];

  for (const key of required) {
    questions.push(amenityQuestion(key));
  }

  questions.push(
    "What are the other upfront costs: service charge, agency fee, legal or agreement fee, and caution deposit?",
    "How soon could a tenant move in?",
    "Can the property be inspected, and is there an inspection fee?",
  );

  const priorityLine =
    required.length > 0
      ? "The caller specifically needs: " +
        required.map((key) => amenityLabel(key).toLowerCase()).join(", ") +
        ". Confirm each of these explicitly."
      : "The caller did not name specific amenities, so do not spend time on them.";

  const moveInLine = requirement.moveInDate
    ? "The caller wants to move in " + requirement.moveInDate + ". Find out whether that is possible."
    : "Ask how soon a tenant could move in.";

  const budgetLine =
    requirement.maxRent !== undefined
      ? "The caller's ceiling is " +
        formatNaira(toAnnual(requirement.maxRent, requirement.rentPeriod)) +
        " per year, but do not reveal the budget or negotiate on price."
      : "Do not negotiate on price.";

  const extras =
    requirement.additionalRequirements.length > 0
      ? "\nAlso worth checking if it comes up naturally: " +
        requirement.additionalRequirements.join("; ") +
        "."
      : "";

  // Kept deliberately compact.
  //
  // CALL-E builds the voice agent from this text BEFORE it dials: an observed
  // live call spent 2m27s between "botlab create bot" and the first ring.
  // Prompt size is the only input to that step Propster controls, so every rule
  // is stated once, in the fewest words that still bind it. Nothing about the
  // agent's obligations has been dropped — only the padding around them.
  const task = [
    "Call a Lagos property agent to verify a rental listing for a prospective tenant.",
    "",
    "RULES (absolute):",
    "- Open by saying you are an AI assistant calling for a prospective tenant. Never imply you are human.",
    "- State immediately that you are verifying a listing. Be polite and brief.",
    "- Never book, offer, commit, pay, negotiate, or share the caller's details.",
    "- If they ask for the tenant, say the tenant will follow up.",
    "- If they decline or ask you to call back, thank them and end the call.",
    "",
    "LISTING UNDER TEST:",
    '"' + listing.title + '", ' + listing.location + ".",
    formatNaira(listedAnnual) +
      "/year, " +
      listing.bedrooms +
      " bed" +
      (listing.bathrooms ? ", " + listing.bathrooms + " bath" : "") +
      ", " +
      listing.propertyType +
      ".",
    listing.amenities.length > 0 ? "Advertised: " + listing.amenities.join(", ") + "." : "",
    "",
    "ASK, in order:",
    ...questions.map((question, index) => index + 1 + ". " + question),
    "",
    priorityLine,
    moveInLine,
    budgetLine + extras,
    "",
    "CONVERSATION:",
    "- If it is no longer available, stop, thank them, end the call.",
    "- If an answer is vague or contradicts an earlier one, ask ONE short clarifying question.",
    "- Ask open questions; never read the listing back as fact.",
    "- Unknown is a valid answer. Never guess on their behalf.",
    "- When you have enough, thank them and end the call.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { task, questions };
}

function amenityQuestion(key: string): string {
  switch (key) {
    case "parking":
      return "Is there dedicated parking, and how many cars?";
    case "prepaid_meter":
      return "How is electricity billed: is there a prepaid meter, or is it estate or postpaid billing?";
    case "security":
      return "Is there security on site, and is the compound gated?";
    case "generator":
      return "Is there a backup generator, and roughly how many hours does it run?";
    case "borehole":
      return "What is the water supply: borehole, or public mains?";
    case "internet":
      return "Is fibre or broadband internet available at the property?";
    case "air_conditioning":
      return "Are air conditioning units already fitted?";
    case "furnished":
      return "Is the property furnished or unfurnished?";
    case "pets":
      return "Are pets allowed?";
    case "gym":
      return "Is there a gym in the building or estate?";
    case "pool":
      return "Is there a swimming pool?";
    case "elevator":
      return "Is there a working lift?";
    case "serviced":
      return "Is the property serviced, and what does the service charge cover?";
    default:
      return "Can you confirm whether the property has " + key.replace(/_/g, " ") + "?";
  }
}
