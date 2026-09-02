import axios from "axios";
import {
  type VideoGenerationRequest,
  type VideoGenerationResult,
  VideoProvider,
} from "@storybook/shared";

/**
 * Video Generation Provider Interface
 * All providers support unrestricted content generation
 *
 * TIER SYSTEM:
 * - Free (default): CogVideoX via HuggingFace Inference API (free account)
 * - BYOK: Runway ML, Pika Labs (require user's own paid API key)
 */
export interface VideoGeneratorProvider {
  name: VideoProvider;
  generate(data: VideoGenerationRequest): Promise<VideoGenerationResult>;
}

// ─── CogVideoX Provider (FREE — Default) ────────────────────────────────────
// Uses HuggingFace Inference API — requires a FREE HuggingFace account
// Sign up: https://huggingface.co/join
// Token: https://huggingface.co/settings/tokens

class CogVideoXProvider implements VideoGeneratorProvider {
  name: VideoProvider = VideoProvider.COGVIDEOX;

  async generate(data: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) {
      // Graceful fallback — return empty result instead of crashing
      console.warn(
        "CogVideoX: HUGGINGFACE_API_KEY not configured. " +
          "Sign up at huggingface.co for a free token.",
      );
      return {
        videoUrl: "",
        thumbnail: "",
        provider: VideoProvider.COGVIDEOX,
        duration: data.duration,
      };
    }

    try {
      // Try CogVideoX-5b first (better quality)
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/THUDM/CogVideoX-5b",
        {
          inputs: data.prompt,
          parameters: {
            num_frames: Math.min((data.duration || 5) * 8, 48),
            motion_strength: data.motionStrength || 0.7,
          },
        },
        {
          headers: { Authorization: `Bearer ${hfKey}` },
          responseType: "arraybuffer",
          timeout: 300000,
        },
      );

      const base64 = Buffer.from(response.data).toString("base64");
      return {
        videoUrl: `data:video/mp4;base64,${base64}`,
        thumbnail: "",
        provider: VideoProvider.COGVIDEOX,
        duration: data.duration,
      };
    } catch (error) {
      console.warn("CogVideoX-5b failed, trying CogVideoX-2b:", error);
      try {
        const response = await axios.post(
          "https://api-inference.huggingface.co/models/THUDM/CogVideoX-2b",
          {
            inputs: data.prompt,
            parameters: {
              num_frames: Math.min((data.duration || 5) * 8, 48),
            },
          },
          {
            headers: { Authorization: `Bearer ${hfKey}` },
            responseType: "arraybuffer",
            timeout: 300000,
          },
        );
        const base64 = Buffer.from(response.data).toString("base64");
        return {
          videoUrl: `data:video/mp4;base64,${base64}`,
          thumbnail: "",
          provider: VideoProvider.COGVIDEOX,
          duration: data.duration,
        };
      } catch (error2) {
        console.error("CogVideoX completely failed:", error2);
        return {
          videoUrl: "",
          thumbnail: "",
          provider: VideoProvider.COGVIDEOX,
          duration: data.duration,
        };
      }
    }
  }
}

// ─── Runway ML Provider (BYOK — paid API key required) ───────────────────────

class RunwayProvider implements VideoGeneratorProvider {
  name: VideoProvider = VideoProvider.RUNWAY;

  async generate(data: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RUNWAY_API_KEY not configured. Add your Runway API key in Settings (BYOK).",
      );
    }

    const response = await axios.post(
      "https://api.runwayml.com/v1/videos/generate",
      {
        image_url: data.imageUrl,
        prompt: data.prompt,
        duration: data.duration,
        motion_strength: data.motionStrength,
        aspect_ratio: data.aspectRatio || "16:9",
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 120000,
      },
    );

    return {
      videoUrl: response.data.video_url,
      thumbnail: response.data.thumbnail_url,
      provider: VideoProvider.RUNWAY,
      duration: data.duration,
    };
  }
}

// ─── Pika Labs Provider (BYOK — paid API key required) ───────────────────────

class PikaProvider implements VideoGeneratorProvider {
  name: VideoProvider = VideoProvider.PIKA;

  async generate(data: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const apiKey = process.env.PIKA_API_KEY;
    if (!apiKey) {
      throw new Error(
        "PIKA_API_KEY not configured. Add your Pika API key in Settings (BYOK).",
      );
    }

    const response = await axios.post(
      "https://api.pika.art/v1/videos/generate",
      {
        image_url: data.imageUrl,
        prompt: data.prompt,
        duration: data.duration,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 120000,
      },
    );

    return {
      videoUrl: response.data.video_url,
      thumbnail: response.data.thumbnail_url,
      provider: VideoProvider.PIKA,
      duration: data.duration,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

const providers: Record<VideoProvider, VideoGeneratorProvider> = {
  RUNWAY: new RunwayProvider(),
  PIKA: new PikaProvider(),
  COGVIDEOX: new CogVideoXProvider(),
};

export function getProvider(name: VideoProvider): VideoGeneratorProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unsupported video provider: ${name}`);
  return provider;
}

export async function generateVideo(
  data: VideoGenerationRequest,
): Promise<VideoGenerationResult> {
  const provider = getProvider(data.provider);
  return provider.generate(data);
}

export const availableProviders = Object.keys(providers) as VideoProvider[];

export default { generateVideo, getProvider, availableProviders };
