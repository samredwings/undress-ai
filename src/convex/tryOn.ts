"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import {
  DEFAULT_CIVITAI_MODEL,
  civitaiCreateVariant,
  downloadCivitaiImage,
  submitCivitaiImageJob,
} from "./civitai";

/**
 * Dedicated garment try-on. Uses Civitai's SDXL img2img (person photo as the
 * source, garment described by the prompt). If no CIVITAI_API_KEY is set,
 * falls back to the existing Stability AI image-to-image action.
 */
export const tryOnCustom = action({
  args: {
    generationId: v.id("generations"),
    projectId: v.id("projects"),
    prompt: v.string(),
    garmentImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; imageUrl: string | null }> => {
    await ctx.runMutation(api.generations.updateStatus, {
      generationId: args.generationId,
      status: "processing",
    });

    try {
      const token = process.env.CIVITAI_API_KEY;
      if (!token) {
        // Fallback to the Stability AI image-to-image path
        return await ctx.runAction(api.generate.generateOutfit, {
          generationId: args.generationId,
          projectId: args.projectId,
          prompt: args.prompt,
        });
      }

      const project = await ctx.runQuery(api.projects.get, {
        projectId: args.projectId,
      });
      if (!project) throw new Error("Project not found");
      if (!project.originalImageUrl)
        throw new Error("Project image is missing");

      const result = await civitaiCreateVariant(
        project.originalImageUrl,
        args.prompt,
        token,
      );
      const { buffer, contentType } = await downloadCivitaiImage(
        result,
        token,
      );

      // Store the result in Convex file storage
      const resultImageStorageId = await ctx.storage.store(
        new Blob([buffer], { type: contentType }),
      );

      await ctx.runMutation(api.generations.updateResult, {
        generationId: args.generationId,
        resultImageStorageId,
      });

      const imageUrl = await ctx.storage.getUrl(resultImageStorageId);
      return { success: true, imageUrl };
    } catch (error) {
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

/**
 * Generates (once) a flat-lay product photo for a pre-built wardrobe item and
 * stores it in Convex storage, keyed by the catalog item id.
 */
export const generateWardrobeAsset = action({
  args: {
    itemId: v.string(),
    name: v.string(),
    prompt: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ imageUrl: string | null }> => {
    const token = process.env.CIVITAI_API_KEY;
    if (!token) throw new Error("CIVITAI_API_KEY not configured");

    const existing = await ctx.runQuery(api.wardrobe.getWardrobeAsset, {
      itemId: args.itemId,
    });
    if (existing?.imageUrl) return { imageUrl: existing.imageUrl };

    const model = process.env.CIVITAI_TRYON_MODEL ?? DEFAULT_CIVITAI_MODEL;
    const result = await submitCivitaiImageJob(
      {
        engine: "sdcpp",
        ecosystem: "sdxl",
        operation: "createImage",
        model,
        prompt: `professional e-commerce product photo of a single ${args.name}: ${args.prompt}, flat lay on a plain light gray studio background, centered, soft shadows, high detail`,
        negativePrompt:
          "worst quality, low quality, blurry, text, watermark, multiple items, people, hands",
        width: 768,
        height: 768,
        cfgScale: 5,
        steps: 12,
      },
      token,
    );
    const { buffer, contentType } = await downloadCivitaiImage(result, token);

    const imageStorageId = await ctx.storage.store(
      new Blob([buffer], { type: contentType }),
    );

    await ctx.runMutation(api.wardrobe.setWardrobeAsset, {
      itemId: args.itemId,
      imageStorageId,
    });
    const imageUrl = await ctx.storage.getUrl(imageStorageId);
    return { imageUrl };
  },
});