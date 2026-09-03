export type WardrobeCategory = "full" | "top" | "bottom";

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  /** Style tags used to rank "similar picks" against the detected outfit */
  styles: string[];
  /** Emoji used as the catalog card tile (no image assets needed) */
  emoji: string;
  /** Instruction fragment for the image-to-image generation */
  prompt: string;
}

/**
 * Pre-built wardrobe: female-only bikinis, lingerie and sexy attire.
 * "full" items are sets/one-pieces, "top" and "bottom" items mix & match.
 */
export const WARDROBE: WardrobeItem[] = [
  // ── Full looks: lingerie sets, bodysuits & slips ──────────────
  {
    id: "lace-lingerie-set",
    name: "Lace Lingerie Set",
    category: "full",
    styles: ["sexy", "elegant", "date night", "evening"],
    emoji: "🖤",
    prompt:
      "an elegant black lace lingerie set with matching thong, delicate floral lace and adjustable straps",
  },
  {
    id: "silk-babydoll",
    name: "Silk Babydoll",
    category: "full",
    styles: ["sexy", "elegant", "date night"],
    emoji: "🥂",
    prompt:
      "a sheer champagne silk babydoll with lace trim and ribbon ties",
  },
  {
    id: "satin-corset-set",
    name: "Satin Corset Set",
    category: "full",
    styles: ["sexy", "elegant", "date night"],
    emoji: "🎀",
    prompt:
      "a black satin corset with lace-up back and matching panties",
  },
  {
    id: "plunge-lace-bodysuit",
    name: "Lace Bodysuit",
    category: "full",
    styles: ["sexy", "date night", "party"],
    emoji: "🌹",
    prompt:
      "a deep-plunge black lace bodysuit with snap closure",
  },
  {
    id: "sheer-teddy",
    name: "Sheer Teddy",
    category: "full",
    styles: ["sexy", "date night"],
    emoji: "✨",
    prompt:
      "a sheer mesh teddy with scalloped lace edges",
  },
  {
    id: "silk-robe-set",
    name: "Silk Robe Set",
    category: "full",
    styles: ["elegant", "sexy", "luxury"],
    emoji: "🕊️",
    prompt:
      "an ivory silk robe worn over a matching lace bra and panties set",
  },
  {
    id: "satin-slip",
    name: "Satin Slip",
    category: "full",
    styles: ["sexy", "elegant", "evening"],
    emoji: "🌙",
    prompt:
      "a bias-cut satin slip nightgown with thin straps and lace hem",
  },
  {
    id: "fishnet-bodysuit",
    name: "Fishnet Bodysuit",
    category: "full",
    styles: ["sexy", "edgy", "party"],
    emoji: "🕸️",
    prompt:
      "a black fishnet bodysuit with high-cut leg openings",
  },

  // ── Tops: bikini tops, bras & lingerie tops ───────────────────
  {
    id: "triangle-bikini-top",
    name: "Triangle Bikini Top",
    category: "top",
    styles: ["beach", "summer", "sexy"],
    emoji: "🌺",
    prompt:
      "a triangle bikini top in tropical print with tie-up straps",
  },
  {
    id: "lace-bralette",
    name: "Lace Bralette",
    category: "top",
    styles: ["sexy", "date night", "summer"],
    emoji: "🩰",
    prompt:
      "a sheer lace bralette with soft no-wire support",
  },
  {
    id: "push-up-bra",
    name: "Push-Up Bra",
    category: "top",
    styles: ["sexy", "date night"],
    emoji: "💋",
    prompt:
      "a black push-up bra with padded cups and lace detailing",
  },
  {
    id: "halter-bikini-top",
    name: "Halter Bikini Top",
    category: "top",
    styles: ["beach", "summer", "sexy"],
    emoji: "🌊",
    prompt:
      "a halter-neck bikini top with adjustable neck tie",
  },
  {
    id: "bandeau-bikini-top",
    name: "Bandeau Bikini Top",
    category: "top",
    styles: ["beach", "summer"],
    emoji: "☀️",
    prompt:
      "a strapless bandeau bikini top with soft cups",
  },
  {
    id: "satin-camisole",
    name: "Satin Camisole",
    category: "top",
    styles: ["elegant", "sexy", "evening"],
    emoji: "🌸",
    prompt:
      "a champagne satin camisole with lace trim",
  },
  {
    id: "mesh-crop-top",
    name: "Mesh Crop Top",
    category: "top",
    styles: ["sexy", "edgy", "party"],
    emoji: "🪞",
    prompt:
      "a sheer black mesh crop top with long sleeves",
  },

  // ── Bottoms: bikini bottoms & panties ─────────────────────────
  {
    id: "string-bikini-bottom",
    name: "String Bikini Bottom",
    category: "bottom",
    styles: ["beach", "summer", "sexy"],
    emoji: "🏖️",
    prompt:
      "a string bikini bottom with side ties",
  },
  {
    id: "high-waist-bikini-bottom",
    name: "High-Waist Bikini Bottom",
    category: "bottom",
    styles: ["beach", "summer"],
    emoji: "🍑",
    prompt:
      "a high-waisted retro bikini bottom",
  },
  {
    id: "lace-thong",
    name: "Lace Thong",
    category: "bottom",
    styles: ["sexy", "date night"],
    emoji: "🖤",
    prompt:
      "a black lace thong with scalloped edges",
  },
  {
    id: "cheeky-panties",
    name: "Cheeky Panties",
    category: "bottom",
    styles: ["sexy", "date night"],
    emoji: "🌶️",
    prompt:
      "cheeky-cut panties with a lace waistband",
  },
  {
    id: "high-cut-panties",
    name: "High-Cut Panties",
    category: "bottom",
    styles: ["sexy", "vintage", "date night"],
    emoji: "🦩",
    prompt:
      "high-cut vintage-style panties with side straps",
  },
  {
    id: "side-tie-bikini-bottom",
    name: "Side-Tie Bikini Bottom",
    category: "bottom",
    styles: ["beach", "summer", "sexy"],
    emoji: "🫧",
    prompt:
      "a side-tie bikini bottom with adjustable knots",
  },
  {
    id: "lace-boyshorts",
    name: "Lace Boyshorts",
    category: "bottom",
    styles: ["sexy", "cozy", "date night"],
    emoji: "🦋",
    prompt:
      "black lace boyshorts with a satin bow",
  },
  {
    id: "string-thong",
    name: "String Thong",
    category: "bottom",
    styles: ["sexy", "date night"],
    emoji: "🎗️",
    prompt:
      "a string thong with a delicate lace waistband",
  },
  {
    id: "g-string",
    name: "G-String",
    category: "bottom",
    styles: ["sexy", "date night"],
    emoji: "🎀",
    prompt:
      "a black G-string with adjustable side straps",
  },
  {
    id: "seamless-thong",
    name: "Seamless Thong",
    category: "bottom",
    styles: ["sexy", "minimal", "date night"],
    emoji: "🍑",
    prompt:
      "a nude seamless thong, invisible under clothes",
  },
  {
    id: "satin-panties",
    name: "Satin Panties",
    category: "bottom",
    styles: ["sexy", "elegant", "date night"],
    emoji: "🥀",
    prompt:
      "black satin panties with a small bow detail",
  },
  {
    id: "brazilian-panties",
    name: "Brazilian Panties",
    category: "bottom",
    styles: ["sexy", "date night"],
    emoji: "🌶️",
    prompt:
      "a black Brazilian-cut panty with lace trim",
  },
  {
    id: "low-rise-thong",
    name: "Low-Rise Thong",
    category: "bottom",
    styles: ["sexy", "date night", "summer"],
    emoji: "🪢",
    prompt:
      "a low-rise thong with a lacy waistband",
  },
];

export interface WardrobeDetection {
  top?: string;
  bottom?: string;
  style?: string;
  skinTone?: string;
  hair?: string;
  bodyType?: string;
  bust?: string;
}

/** Builds a "keep her physical traits" clause from the detected traits. */
function keepPhysicalClause(
  detection?: WardrobeDetection | null,
): string {
  const parts: string[] = [];
  if (detection?.skinTone) parts.push(`${detection.skinTone} skin tone`);
  if (detection?.hair) parts.push(`${detection.hair} hair`);
  if (detection?.bodyType) parts.push(`${detection.bodyType} body`);
  if (detection?.bust) parts.push(`${detection.bust} bust`);
  return parts.length > 0
    ? ` Keep her exact ${parts.join(", ")} unchanged.`
    : "";
}

const PRESERVE_SUFFIX =
  " Preserve her face, pose, lighting and background exactly. " +
  "The garment must fit her body naturally, as if tailored to her: keep her " +
  "body proportions, bust size and skin tone identical, with realistic " +
  "fabric texture and soft, seamless blending.";

/**
 * Builds the generation prompt for a wardrobe item, aware of the outfit
 * detected in the photo (keeps the other half of the outfit intact and locks
 * the subject's physical traits so she stays the same woman).
 */
export function buildWardrobePrompt(
  item: WardrobeItem,
  detection?: WardrobeDetection | null,
): string {
  const keepOther =
    item.category === "top" && detection?.bottom
      ? `, keeping her current bottom (${detection.bottom})`
      : item.category === "bottom" && detection?.top
        ? `, keeping her current top (${detection.top})`
        : "";
  const core = `the woman in the photo wearing ${item.prompt}`;
  return `${core}${keepOther}.${keepPhysicalClause(detection)}${PRESERVE_SUFFIX}`;
}

/** Prompt used for custom (user-uploaded) attire items. */
export function buildCustomPrompt(
  name: string,
  detection?: WardrobeDetection | null,
): string {
  return `The woman in the photo is wearing: ${name}. Match its style, color and fit precisely.${keepPhysicalClause(detection)}${PRESERVE_SUFFIX}`;
}