import { describe, expect, it } from "vitest";
import { RESERVED_DEMO_PHONE } from "@/domain/schemas";
import { SEED_PROPERTIES } from "../prisma/seed-data";

/**
 * Which provider handles a listing decides whether a real telephone rings.
 *
 * Seeded listings carry fictional numbers and must be simulated: dialling one
 * spends call credits to reach nobody, and because the range is syntactically
 * valid it could reach whoever genuinely owns that number. A listing submitted
 * through /try carries its owner's real number and explicit consent, and must
 * get a real call — that is the whole point of the page.
 */
describe("provider routing by phone number", () => {
  it("classifies every fictional seeded number as simulate-only", () => {
    const fictional = SEED_PROPERTIES.filter((p) => RESERVED_DEMO_PHONE.test(p.agentPhone));
    // All but the one deliberately-real demo listing.
    expect(fictional.length).toBeGreaterThanOrEqual(SEED_PROPERTIES.length - 1);
  });

  it("does not classify an ordinary Nigerian mobile as fictional", () => {
    // A number a visitor would plausibly enter on /try.
    expect(RESERVED_DEMO_PHONE.test("+2348012345678")).toBe(false);
    expect(RESERVED_DEMO_PHONE.test("+2347041274446")).toBe(false);
  });

  it("matches the whole reserved block and nothing adjacent to it", () => {
    expect(RESERVED_DEMO_PHONE.test("+2347000000001")).toBe(true);
    expect(RESERVED_DEMO_PHONE.test("+2347000000014")).toBe(true);
    // One digit longer or shorter must not be swept in.
    expect(RESERVED_DEMO_PHONE.test("+23470000000011")).toBe(false);
    expect(RESERVED_DEMO_PHONE.test("+234700000001")).toBe(false);
  });
});
