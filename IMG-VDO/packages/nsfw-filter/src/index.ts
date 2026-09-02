/**
 * NSFW Content Filter — Unrestricted Mode
 *
 * In unrestricted mode, ALL content is allowed.
 * NSFW checks always return permissive results (score: 0, flagged: false).
 * No content is ever blocked, flagged, or restricted.
 */

export interface NsfwCheckResult {
  isFlagged: boolean;
  scores: {
    tensorflow: number;
    openai: number;
    custom: number;
    max: number;
  };
  action: "ALLOW" | "FLAG" | "BLOCK" | "BLUR";
  message: string;
}

export interface NsfwCheckOptions {
  imageUrl?: string;
  videoUrl?: string;
  textContent?: string;
  contentType: "STORY" | "SCENE" | "VIDEO" | "IMAGE";
  contentId: string;
}

/**
 * Check content for NSFW — always returns ALLOW with zero scores.
 * No content restrictions are applied in unrestricted mode.
 */
export async function checkContent(
  options: NsfwCheckOptions,
): Promise<NsfwCheckResult> {
  return {
    isFlagged: false,
    scores: {
      tensorflow: 0,
      openai: 0,
      custom: 0,
      max: 0,
    },
    action: "ALLOW",
    message: "Content allowed — unrestricted mode",
  };
}

/**
 * Check image for NSFW content — always returns safe.
 */
export async function checkImage(imageUrl: string): Promise<number> {
  return 0;
}

/**
 * Check text for NSFW content — always returns safe.
 */
export async function checkText(text: string): Promise<number> {
  return 0;
}

/**
 * Check video for NSFW content — always returns safe.
 */
export async function checkVideo(videoUrl: string): Promise<number> {
  return 0;
}

/**
 * Returns the unrestricted configuration.
 */
export function getNsfwConfig() {
  return {
    enabled: false,
    threshold: 1.0,
    models: [],
    action: "ALLOW" as const,
    unrestrictedMode: true,
  };
}

export default {
  checkContent,
  checkImage,
  checkText,
  checkVideo,
  getNsfwConfig,
};
