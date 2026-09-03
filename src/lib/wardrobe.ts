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

export const WARDROBE: WardrobeItem[] = [
  // ── Full looks ────────────────────────────────────────────────
  {
    id: "silk-slip-dress",
    name: "Silk Slip Dress",
    category: "full",
    styles: ["elegant", "minimal", "evening"],
    emoji: "✨",
    prompt:
      "an elegant champagne satin slip dress with delicate straps, refined evening look",
  },
  {
    id: "oversized-blazer-set",
    name: "Oversized Blazer Set",
    category: "full",
    styles: ["formal", "minimal", "office"],
    emoji: "🧥",
    prompt:
      "an oversized tailored blazer with matching wide-leg trousers, modern power suit",
  },
  {
    id: "streetwear-cargo-set",
    name: "Streetwear Cargo Set",
    category: "full",
    styles: ["streetwear", "casual", "edgy"],
    emoji: "🛹",
    prompt:
      "an oversized graphic hoodie with utility cargo pants and chunky sneakers, streetwear look",
  },
  {
    id: "cozy-knit-look",
    name: "Cozy Knit Look",
    category: "full",
    styles: ["cozy", "casual", "winter"],
    emoji: "🧶",
    prompt:
      "a chunky knit sweater with wool trousers and leather boots, cozy autumn look",
  },
  {
    id: "summer-linen-set",
    name: "Summer Linen Set",
    category: "full",
    styles: ["summer", "casual", "minimal"],
    emoji: "🏖️",
    prompt:
      "a relaxed cream linen shirt with tailored shorts, breezy summer outfit",
  },
  {
    id: "athleisure-set",
    name: "Athleisure Set",
    category: "full",
    styles: ["sporty", "casual"],
    emoji: "🧘",
    prompt:
      "a fitted athleisure set with a zip-up jacket and leggings, sporty street look",
  },
  {
    id: "boho-maxi-dress",
    name: "Boho Maxi Dress",
    category: "full",
    styles: ["boho", "summer", "elegant"],
    emoji: "🌸",
    prompt:
      "a flowing floral maxi dress with layered necklaces, bohemian look",
  },
  {
    id: "leather-moto-look",
    name: "Leather Moto Look",
    category: "full",
    styles: ["edgy", "streetwear", "evening"],
    emoji: "🏍️",
    prompt:
      "a black leather moto jacket over a fitted tee with slim black jeans and boots",
  },

  // ── Tops ──────────────────────────────────────────────────────
  {
    id: "oversized-tee",
    name: "Oversized Tee",
    category: "top",
    styles: ["casual", "streetwear", "summer"],
    emoji: "👕",
    prompt:
      "a clean oversized white t-shirt, relaxed and effortlessly stylish",
  },
  {
    id: "cable-knit-sweater",
    name: "Cable Knit Sweater",
    category: "top",
    styles: ["cozy", "casual", "winter"],
    emoji: "🧶",
    prompt: "a cozy cream cable-knit sweater",
  },
  {
    id: "denim-jacket",
    name: "Denim Jacket",
    category: "top",
    styles: ["casual", "streetwear"],
    emoji: "🦺",
    prompt: "a classic medium-wash denim jacket",
  },
  {
    id: "silk-blouse",
    name: "Silk Blouse",
    category: "top",
    styles: ["elegant", "formal", "office"],
    emoji: "👚",
    prompt: "a flowing ivory silk blouse with a soft drape",
  },
  {
    id: "cropped-puffer",
    name: "Cropped Puffer",
    category: "top",
    styles: ["streetwear", "winter", "edgy"],
    emoji: "🧥",
    prompt: "a shiny cropped puffer jacket, trendy winter layer",
  },
  {
    id: "turtleneck",
    name: "Turtleneck",
    category: "top",
    styles: ["minimal", "elegant", "winter"],
    emoji: "🥋",
    prompt: "a fitted black turtleneck, minimal and chic",
  },
  {
    id: "graphic-hoodie",
    name: "Graphic Hoodie",
    category: "top",
    styles: ["casual", "streetwear", "sporty"],
    emoji: "🧸",
    prompt: "an oversized graphic hoodie in a muted tone",
  },
  {
    id: "striped-breton",
    name: "Striped Breton Top",
    category: "top",
    styles: ["minimal", "summer", "casual"],
    emoji: "⚓",
    prompt: "a classic navy and white striped breton top",
  },

  // ── Bottoms ───────────────────────────────────────────────────
  {
    id: "wide-leg-trousers",
    name: "Wide-Leg Trousers",
    category: "bottom",
    styles: ["formal", "minimal", "office"],
    emoji: "👖",
    prompt: "flowing high-waisted wide-leg trousers",
  },
  {
    id: "pleated-midi-skirt",
    name: "Pleated Midi Skirt",
    category: "bottom",
    styles: ["elegant", "minimal", "office"],
    emoji: "🥻",
    prompt: "a pleated satin midi skirt",
  },
  {
    id: "cargo-pants",
    name: "Cargo Pants",
    category: "bottom",
    styles: ["streetwear", "casual", "edgy"],
    emoji: "🪖",
    prompt: "loose-fit utility cargo pants",
  },
  {
    id: "high-rise-jeans",
    name: "High-Rise Jeans",
    category: "bottom",
    styles: ["casual", "minimal"],
    emoji: "🩵",
    prompt: "high-rise straight-leg blue jeans",
  },
  {
    id: "leather-pants",
    name: "Leather Pants",
    category: "bottom",
    styles: ["edgy", "evening", "streetwear"],
    emoji: "🖤",
    prompt: "sleek black leather trousers",
  },
  {
    id: "mini-skirt",
    name: "Mini Skirt",
    category: "bottom",
    styles: ["trendy", "summer", "edgy"],
    emoji: "🎀",
    prompt: "a chic tailored mini skirt",
  },
  {
    id: "tailored-shorts",
    name: "Tailored Shorts",
    category: "bottom",
    styles: ["summer", "casual", "formal"],
    emoji: "🩳",
    prompt: "crisp tailored high-waisted shorts",
  },
];

/**
 * Builds the generation prompt for a wardrobe item, aware of the outfit
 * detected in the photo (keeps the other half of the outfit intact).
 */
export function buildWardrobePrompt(
  item: WardrobeItem,
  detection?: { top?: string; bottom?: string; style?: string } | null,
): string {
  const keepOther =
    item.category === "top" && detection?.bottom
      ? `, keeping the current bottom (${detection.bottom})`
      : item.category === "bottom" && detection?.top
        ? `, keeping the current top (${detection.top})`
        : "";
  const core = `the person in the photo wearing ${item.prompt}`;
  return `${core}${keepOther}. Preserve the person's face, pose and background.`;
}

/** Prompt used for custom (user-uploaded) attire items. */
export function buildCustomPrompt(name: string): string {
  return `The person in the photo is wearing: ${name}. Match its style, color and fit. Preserve the person's face, pose and background.`;
}