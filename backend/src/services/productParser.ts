import * as chrono from "chrono-node";

// Rule-based "I bought X, N year warranty" parser. Returns null when it's not a
// confident add, so the caller can fall back to the agent.

type Category =
  | "NONE" | "ELECTRONICS" | "HOME_KITCHEN" | "PHONES" | "JEWELRY"
  | "KIDS_TOYS" | "APPLIANCES" | "FURNITURE" | "FASHION"
  | "AUTOMOTIVE" | "SPORTS" | "TOOLS" | "OTHER";

export type ParsedProduct = {
  name: string;
  category: Category;
  purchaseDate: string; // ISO YYYY-MM-DD
  warrantyMonths: number;
  store?: string;
};

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// First keyword match wins, so order from most to least specific.
const CATEGORY_KEYWORDS: Array<[Category, string[]]> = [
  ["PHONES", ["iphone", "smartphone", "galaxy", "pixel", "phone"]],
  ["ELECTRONICS", ["laptop", "macbook", "notebook", "computer", "monitor", "television", "tv", "headphones", "headphone", "earbuds", "speaker", "camera", "console", "playstation", "xbox", "nintendo", "tablet", "ipad", "router", "keyboard", "smartwatch"]],
  ["APPLIANCES", ["refrigerator", "fridge", "freezer", "washing machine", "washer", "dryer", "dishwasher", "microwave", "oven", "vacuum", "kettle", "toaster", "air conditioner"]],
  ["HOME_KITCHEN", ["blender", "mixer", "coffee machine", "cookware", "pan", "pot"]],
  ["FURNITURE", ["chair", "desk", "table", "sofa", "couch", "bed", "mattress", "wardrobe", "shelf"]],
  ["FASHION", ["jacket", "coat", "shoes", "sneakers", "boots", "handbag", "sunglasses"]],
  ["JEWELRY", ["ring", "necklace", "bracelet", "watch"]],
  ["AUTOMOTIVE", ["car", "tire", "tyre", "scooter", "motorcycle"]],
  ["SPORTS", ["treadmill", "dumbbell", "bicycle", "bike", "tent", "racket"]],
  ["TOOLS", ["drill", "saw", "hammer", "toolkit", "wrench"]],
  ["KIDS_TOYS", ["stroller", "crib", "lego", "toy"]],
];

const WARRANTY_RE =
  /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(years?|yrs?|months?|mos?)\b/i;
const STORE_RE = /\b(?:from|at)\s+([A-Za-z][\w'&.-]*(?:\s+[A-Z][\w'&.-]*)?)/;

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const parseWarrantyMonths = (text: string): number | null => {
  const m = text.match(WARRANTY_RE);
  if (!m) return null;
  const n = WORD_NUMBERS[m[1].toLowerCase()] ?? parseInt(m[1], 10);
  if (!n || n <= 0) return null;
  return m[2].toLowerCase().startsWith("y") ? n * 12 : n;
};

const detectCategory = (text: string): Category => {
  for (const [category, words] of CATEGORY_KEYWORDS) {
    // Word-boundary match so "phone" doesn't hit inside "headphones".
    if (words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(text))) {
      return category;
    }
  }
  return "OTHER";
};

const extractName = (s: string): string => {
  const name = s
    .replace(/\bwarranty\b/gi, " ")
    .replace(/\b(just|recently|yesterday|today)\b/gi, " ")
    .replace(/\b(i|we|i've|just)\b/gi, " ")
    .replace(/\b(bought|buy|purchased|purchase|got|add(?:ed|ing)?|new)\b/gi, " ")
    .replace(/\b(a|an|the|my|some)\b/gi, " ")
    .replace(/\b(with|and|plus)\b/gi, " ") // connectors left over from "with N year warranty"
    .replace(/\bfor\s+\$?\d+(?:\.\d+)?\b/gi, " ") // price
    .replace(/[,.;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
};

export function parseProductMessage(raw: string): ParsedProduct | null {
  const text = raw.trim();
  if (!text) return null;

  // Questions / non-add intents go to the agent.
  if (/\?/.test(text)) return null;
  if (
    /^\s*(which|what|when|where|how|why|do|does|did|is|are|am|can|could|should|would|show|list|find|search|tell|give|remind)\b/i.test(
      text,
    )
  ) {
    return null;
  }
  if (!/\b(bought|buy|purchased|purchase|got|add(?:ed|ing)?|new)\b/i.test(text)) {
    return null;
  }

  // Require a warranty mention to treat this as an add.
  const warrantyMonths = parseWarrantyMonths(text);
  if (warrantyMonths == null) return null;

  // Strip warranty first so chrono doesn't read "1 year" as a date.
  let working = text.replace(WARRANTY_RE, " ");

  const storeMatch = working.match(STORE_RE);
  const store = storeMatch?.[1]?.trim();
  if (storeMatch) working = working.replace(storeMatch[0], " ");

  const dateMatch = chrono.parse(working, new Date(), { forwardDate: false })[0];
  let purchaseDate = toISO(new Date());
  if (dateMatch) {
    purchaseDate = toISO(dateMatch.start.date());
    working = working.replace(dateMatch.text, " ");
  }

  const name = extractName(working);
  if (!name) return null;

  return {
    name,
    category: detectCategory(text),
    purchaseDate,
    warrantyMonths,
    ...(store ? { store } : {}),
  };
}
