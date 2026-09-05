/**
 * Demo listing corpus for Propster.
 *
 * These are FICTIONAL listings written for the hackathon demo. Addresses are
 * generic, and every phone number comes from a range a national regulator has
 * reserved for drama and documentation, so none of them can reach a person.
 * Nothing here represents a real property, a real agent or a real asking price.
 *
 * The corpus is deliberately international. Propster is not a Lagos product or
 * a London one: the same workflow applies wherever a listing makes a claim
 * somebody ought to check. Each listing therefore carries its own currency and
 * its own rent period, because markets differ on both — Dubai quotes a year,
 * Lisbon quotes a month, and nothing in the product converts between them.
 *
 * Lisbon carries several listings so the demo search returns a full spread of
 * outcomes; the rest are spread across other markets.
 *
 * `demoScenario` drives the deterministic mock phone provider only. When a real
 * CALL-E key is configured, the live conversation is the only source of
 * verified facts and this field is ignored.
 */
import { demoPhone } from "../src/domain/phone";
import type { Currency } from "../src/domain/money";

export type DemoScenario =
  | "clean"
  | "price_mismatch"
  | "amenity_missing"
  | "unavailable"
  | "partial"
  | "no_answer";

export interface SeedProperty {
  title: string;
  description: string;
  location: string;
  area: string;
  country: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  currency: Currency;
  rentPeriod: "monthly" | "yearly";
  amenities: string[];
  imageUrl: string;
  sourceUrl: string;
  agentName: string;
  agentPhone: string;
  listedAt: string;
  demoScenario: DemoScenario;
}

/**
 * The one listing that may be dialled for real, read from the environment.
 *
 * A live number must never be committed: this file is part of a public
 * submission. Set DEMO_AGENT_PHONE in .env to the number that should receive
 * demo calls. Without it the listing keeps a reserved fictional number and
 * simply cannot be called, which is the safe default.
 */
const LIVE_DEMO_PHONE = process.env.DEMO_AGENT_PHONE?.trim() || demoPhone(1);

const photo = (name: string) => "/img/" + name + ".webp";

export const SEED_PROPERTIES: SeedProperty[] = [
  // --- Lisbon: the demo search lands here ----------------------------------
  {
    title: "2 Bedroom Apartment, Príncipe Real",
    description:
      "Bright two bedroom apartment on a quiet street in Príncipe Real. Renovated kitchen, double glazing throughout, private parking space in the building and air conditioning in both bedrooms.",
    location: "Príncipe Real, Lisbon",
    area: "Príncipe Real",
    country: "Portugal",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    rent: 1_650,
    currency: "EUR",
    rentPeriod: "monthly",
    amenities: ["Parking", "Air conditioning", "Elevator", "Balcony", "Fibre internet"],
    imageUrl: photo("property-04"),
    sourceUrl: "https://example.com/listings/lisbon-principe-real-2bed",
    agentName: "Inês Carvalho (demo contact)",
    agentPhone: LIVE_DEMO_PHONE,
    listedAt: "2026-08-14",
    demoScenario: "clean",
  },
  {
    title: "2 Bedroom Apartment, Alcântara",
    description:
      "Two bedroom flat in a converted riverside building at Alcântara. Open plan living, lift access, resident parking and fibre broadband already installed.",
    location: "Alcântara, Lisbon",
    area: "Alcântara",
    country: "Portugal",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    rent: 1_450,
    currency: "EUR",
    rentPeriod: "monthly",
    amenities: ["Parking", "Elevator", "Fibre internet", "Heating"],
    imageUrl: photo("chevron"),
    sourceUrl: "https://example.com/listings/lisbon-alcantara-2bed",
    agentName: "Tiago Ferreira (demo contact)",
    agentPhone: demoPhone(2),
    listedAt: "2026-08-21",
    demoScenario: "price_mismatch",
  },
  {
    title: "2 Bedroom Apartment, Graça",
    description:
      "Top floor two bedroom apartment in Graça with a terrace and city views. Air conditioning, fitted wardrobes and a dedicated parking bay in the courtyard.",
    location: "Graça, Lisbon",
    area: "Graça",
    country: "Portugal",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    rent: 1_720,
    currency: "EUR",
    rentPeriod: "monthly",
    amenities: ["Parking", "Air conditioning", "Balcony", "Heating"],
    imageUrl: photo("agungi"),
    sourceUrl: "https://example.com/listings/lisbon-graca-2bed",
    agentName: "Marta Sousa (demo contact)",
    agentPhone: demoPhone(3),
    listedAt: "2026-08-09",
    demoScenario: "amenity_missing",
  },
  {
    title: "2 Bedroom Apartment, Campo de Ourique",
    description:
      "Family two bedroom in Campo de Ourique, walking distance from the market. Lift, storage room, underground parking and air conditioning.",
    location: "Campo de Ourique, Lisbon",
    area: "Campo de Ourique",
    country: "Portugal",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    rent: 1_780,
    currency: "EUR",
    rentPeriod: "monthly",
    amenities: ["Parking", "Air conditioning", "Elevator", "Concierge"],
    imageUrl: photo("waterfront"),
    sourceUrl: "https://example.com/listings/lisbon-campo-de-ourique-2bed",
    agentName: "Rui Almeida (demo contact)",
    agentPhone: demoPhone(4),
    listedAt: "2026-07-30",
    demoScenario: "unavailable",
  },
  {
    title: "2 Bedroom Apartment, Arroios",
    description:
      "Recently refurbished two bedroom in Arroios, close to the metro. Air conditioning, new boiler, communal courtyard and a parking space included.",
    location: "Arroios, Lisbon",
    area: "Arroios",
    country: "Portugal",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    rent: 1_380,
    currency: "EUR",
    rentPeriod: "monthly",
    amenities: ["Parking", "Air conditioning", "Heating", "Fibre internet"],
    imageUrl: photo("osapa"),
    sourceUrl: "https://example.com/listings/lisbon-arroios-2bed",
    agentName: "Beatriz Lopes (demo contact)",
    agentPhone: demoPhone(5),
    listedAt: "2026-08-25",
    demoScenario: "partial",
  },
  {
    title: "3 Bedroom Apartment, Belém",
    description:
      "Three bedroom apartment near the waterfront at Belém. Two bathrooms, lift, garage parking, air conditioning and a south-facing balcony.",
    location: "Belém, Lisbon",
    area: "Belém",
    country: "Portugal",
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 2,
    rent: 2_150,
    currency: "EUR",
    rentPeriod: "monthly",
    amenities: ["Parking", "Air conditioning", "Elevator", "Balcony", "Gym"],
    imageUrl: photo("lekki-bq"),
    sourceUrl: "https://example.com/listings/lisbon-belem-3bed",
    agentName: "Nuno Pinto (demo contact)",
    agentPhone: demoPhone(6),
    listedAt: "2026-08-18",
    demoScenario: "no_answer",
  },

  // --- The rest of the world ------------------------------------------------
  {
    title: "1 Bedroom Loft, East Austin",
    description:
      "Converted warehouse loft east of downtown Austin. In-unit laundry, assigned covered parking, central air and a rooftop shared with four other units.",
    location: "East Austin, Texas",
    area: "East Austin",
    country: "United States",
    propertyType: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    rent: 2_150,
    currency: "USD",
    rentPeriod: "monthly",
    amenities: ["Parking", "Air conditioning", "Laundry", "Fibre internet"],
    imageUrl: photo("yaba"),
    sourceUrl: "https://example.com/listings/austin-east-loft",
    agentName: "Dana Whitfield (demo contact)",
    agentPhone: demoPhone(7),
    listedAt: "2026-08-27",
    demoScenario: "clean",
  },
  {
    title: "2 Bedroom Flat, London Fields",
    description:
      "Two bedroom flat overlooking London Fields. Gas central heating, secure bike store, communal garden and full fibre broadband.",
    location: "Hackney, London",
    area: "Hackney",
    country: "United Kingdom",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    rent: 2_400,
    currency: "GBP",
    rentPeriod: "monthly",
    amenities: ["Heating", "Fibre internet", "Balcony"],
    imageUrl: photo("ajah"),
    sourceUrl: "https://example.com/listings/london-hackney-2bed",
    agentName: "Owen Blackwood (demo contact)",
    agentPhone: demoPhone(8),
    listedAt: "2026-08-11",
    demoScenario: "price_mismatch",
  },
  {
    title: "3 Bedroom Apartment, Jumeirah Lake Towers",
    description:
      "Three bedroom apartment on a high floor at JLT with lake views. Chiller included, covered parking, gym and pool in the tower, 24 hour concierge.",
    location: "Jumeirah Lake Towers, Dubai",
    area: "Jumeirah Lake Towers",
    country: "United Arab Emirates",
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 3,
    rent: 145_000,
    currency: "AED",
    rentPeriod: "yearly",
    amenities: ["Parking", "Air conditioning", "Gym", "Swimming pool", "Concierge", "Elevator"],
    imageUrl: photo("vi-serviced"),
    sourceUrl: "https://example.com/listings/dubai-jlt-3bed",
    agentName: "Layla Haddad (demo contact)",
    agentPhone: demoPhone(9),
    listedAt: "2026-07-22",
    demoScenario: "clean",
  },
  {
    title: "2 Bedroom Altbau, Prenzlauer Berg",
    description:
      "Classic Altbau two bedroom in Prenzlauer Berg with high ceilings and original floors. Balcony, cellar storage, central heating and fibre available.",
    location: "Prenzlauer Berg, Berlin",
    area: "Prenzlauer Berg",
    country: "Germany",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    rent: 1_620,
    currency: "EUR",
    rentPeriod: "monthly",
    amenities: ["Heating", "Balcony", "Fibre internet", "Elevator"],
    imageUrl: photo("sangotedo"),
    sourceUrl: "https://example.com/listings/berlin-prenzlauer-berg-2bed",
    agentName: "Katrin Vogel (demo contact)",
    agentPhone: demoPhone(10),
    listedAt: "2026-08-05",
    demoScenario: "partial",
  },
  {
    title: "2 Bedroom Apartment, Sea Point",
    description:
      "Two bedroom apartment a block from the Sea Point promenade. Secure parking bay, backup power for the building, fibre installed and 24 hour security.",
    location: "Sea Point, Cape Town",
    area: "Sea Point",
    country: "South Africa",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    rent: 24_500,
    currency: "ZAR",
    rentPeriod: "monthly",
    amenities: ["Parking", "Security", "Backup power", "Fibre internet", "Elevator"],
    imageUrl: photo("ikoyi"),
    sourceUrl: "https://example.com/listings/cape-town-sea-point-2bed",
    agentName: "Thandi Mokoena (demo contact)",
    agentPhone: demoPhone(11),
    listedAt: "2026-08-23",
    demoScenario: "amenity_missing",
  },
  {
    title: "3 Bedroom Condo, Tiong Bahru",
    description:
      "Three bedroom condominium in Tiong Bahru. Air conditioning throughout, one car park lot, pool and gym in the development, walking distance to the MRT.",
    location: "Tiong Bahru, Singapore",
    area: "Tiong Bahru",
    country: "Singapore",
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 2,
    rent: 5_400,
    currency: "SGD",
    rentPeriod: "monthly",
    amenities: ["Parking", "Air conditioning", "Swimming pool", "Gym", "Security"],
    imageUrl: photo("ikeja"),
    sourceUrl: "https://example.com/listings/singapore-tiong-bahru-3bed",
    agentName: "Wei Ling Tan (demo contact)",
    agentPhone: demoPhone(12),
    listedAt: "2026-08-16",
    demoScenario: "clean",
  },
  {
    title: "1 Bedroom Apartment, Roncesvalles",
    description:
      "One bedroom in a low-rise on Roncesvalles Avenue, Toronto. Heating and water included, laundry in the building, street permit parking available.",
    location: "Roncesvalles, Toronto",
    area: "Roncesvalles",
    country: "Canada",
    propertyType: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    rent: 2_250,
    currency: "CAD",
    rentPeriod: "monthly",
    amenities: ["Heating", "Laundry", "Fibre internet"],
    imageUrl: photo("interior"),
    sourceUrl: "https://example.com/listings/toronto-roncesvalles-1bed",
    agentName: "Marc Tremblay (demo contact)",
    agentPhone: demoPhone(13),
    listedAt: "2026-08-29",
    demoScenario: "clean",
  },
  {
    title: "3 Bedroom Apartment, Lekki Phase 1",
    description:
      "Three bedroom apartment in a serviced block in Lekki Phase 1, Lagos. Dedicated parking, estate security, backup generator and a prepaid electricity meter.",
    location: "Lekki Phase 1, Lagos",
    area: "Lekki Phase 1",
    country: "Nigeria",
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 3,
    rent: 7_500_000,
    currency: "NGN",
    rentPeriod: "yearly",
    amenities: ["Parking", "Security", "Backup power", "Air conditioning", "Prepaid meter"],
    imageUrl: photo("doubt"),
    sourceUrl: "https://example.com/listings/lagos-lekki-3bed",
    agentName: "Adaeze Okoro (demo contact)",
    agentPhone: demoPhone(14),
    listedAt: "2026-08-02",
    demoScenario: "clean",
  },
];
