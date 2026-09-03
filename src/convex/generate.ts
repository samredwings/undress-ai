"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { civitaiCreateVariant, downloadCivitaiImage } from "./civitai";

/**
 * Diagnostic: returns whether the Stability API key is set in the server
 * environment. Never returns the key itself.
 */
export const hasStabilityKey = action({
  args: {},
  handler: async () => {
    return !!process.env.STABILITY_API_KEY;
  },
});

/**
 * Diagnostic: returns whether the Civitai API key is set in the server
 * environment. Never returns the key itself.
 */
export const hasCivitaiKey = action({
  args: {},
  handler: async () => {
    return !!process.env.CIVITAI_API_KEY;
  },
});

/**
 * Diagnostic: returns whether the OpenAI (vision) API key is set in the
 * server environment. Never returns the key itself.
 */
export const hasOpenAIKey = action({
  args: {},
  handler: async () => {
    return !!process.env.OPENAI_API_KEY;
  },
});

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/**
 * Outfit change for wardrobe items and chat. Tries Stability's Stable Image
 * Core img2img endpoint; if that fails and a Civitai key is configured, it
 * retries via Civitai's SDXL img2img so generation survives either provider.
 */
export const generateOutfit = action({
  args: {
    generationId: v.id("generations"),
    projectId: v.id("projects"),
    prompt: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; imageUrl: string | null }> => {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) throw new Error("STABILITY_API_KEY not configured");

    // Mark as processing
    await ctx.runMutation(api.generations.updateStatus, {
      generationId: args.generationId,
      status: "processing",
    });

    try {
      // Get the project's original image
      const project = await ctx.runQuery(api.projects.get, {
        projectId: args.projectId,
      });
      if (!project) throw new Error("Project not found");
      if (!project.originalImageUrl)
        throw new Error("Project image is missing");

      // Get generation details for garment image
      const generations = await ctx.runQuery(api.generations.listByProject, {
        projectId: args.projectId,
      });
      const generation = generations.find(
        (g) => g._id === args.generationId,
      );
      if (!generation) throw new Error("Generation not found");

      // Fetch and encode the original image
      const imageBase64 = await fetchAsBase64(project.originalImageUrl);

      // Build the request body for Stable Image Core (img2img)
      const formData = new FormData();
      const imageBytes = Uint8Array.from(atob(imageBase64), (c) =>
        c.charCodeAt(0),
      );
      const imageBlob = new Blob([imageBytes], { type: "image/png" });
      formData.append("image", imageBlob, "image.png");
      formData.append("prompt", args.prompt);
      formData.append("mode", "image-to-image");
      formData.append("strength", "0.6");
      formData.append("output_format", "png");

      // If a garment reference image is provided, add it
      if (generation.garmentImageUrl) {
        const garmentBase64 = await fetchAsBase64(generation.garmentImageUrl);
        const garmentBytes = Uint8Array.from(atob(garmentBase64), (c) =>
          c.charCodeAt(0),
        );
        const garmentBlob = new Blob([garmentBytes], { type: "image/png" });
        formData.append("image", garmentBlob, "garment.png");
      }

      // Call Stability AI Stable Image Core (image-to-image)
      const response = await fetch(
        "https://api.stability.ai/v2beta/stable-image/generate/core",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "image/*",
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Stability AI error: ${response.status} - ${errorText.slice(0, 300)}`,
        );
      }

      // Store the result in Convex file storage
      const resultBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/png";
      const resultBlob = new Blob([resultBuffer], { type: contentType });
      const resultImageStorageId = await ctx.storage.store(resultBlob);

      await ctx.runMutation(api.generations.updateResult, {
        generationId: args.generationId,
        resultImageStorageId,
      });

      const imageUrl = await ctx.storage.getUrl(resultImageStorageId);
      return { success: true, imageUrl };
    } catch (error) {
      // If Stability failed, retry via Civitai when a key is configured
      const civitaiToken = process.env.CIVITAI_API_KEY;
      if (civitaiToken) {
        try {
          const project = await ctx.runQuery(api.projects.get, {
            projectId: args.projectId,
          });
          if (project?.originalImageUrl) {
            const result = await civitaiCreateVariant(
              project.originalImageUrl,
              args.prompt,
              civitaiToken,
            );
            const { buffer, contentType } = await downloadCivitaiImage(
              result,
              civitaiToken,
            );
            const resultImageStorageId = await ctx.storage.store(
              new Blob([buffer], { type: contentType }),
            );
            await ctx.runMutation(api.generations.updateResult, {
              generationId: args.generationId,
              resultImageStorageId,
            });
            const imageUrl = await ctx.storage.getUrl(resultImageStorageId);
            return { success: true, imageUrl };
          }
        } catch (fallbackError) {
          const fallbackMessage =
            fallbackError instanceof Error
              ? fallbackError.message
              : "unknown";
          throw new Error(
            `Stability failed (${error instanceof Error ? error.message : "unknown"}) and Civitai fallback failed (${fallbackMessage})`,
          );
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(api.generations.updateStatus, {
        generationId: args.generationId,
        status: "failed",
        error: errorMessage,
      });
      throw error;
    }
  },
});