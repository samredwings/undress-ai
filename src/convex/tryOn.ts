"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const CIVITAI_ORCH_URL = "https://orchestration.civitai.com/v2/consumer";

// Default SDXL checkpoint (from Civitai's official docs example).
// Override with the CIVITAI_TRYON_MODEL env var (AIR URN), e.g. to point at
// a virtual-try-on tuned checkpoint or add a try-on LoRA.
const DEFAULT_MODEL = "urn:air:sdxl:checkpoint:civitai:101055@128078";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface CivitaiWorkflow {
  id?: string;
  status?: string;
  steps?: {
    status?: string;
    reason?: string;
    output?: { images?: { url?: string }[] };
  }[];
}

interface CivitaiImageResult {
  url: string;
  workflowId: string | null;
}

/** Submit an imageGen workflow to Civitai and wait for the first result image. */
async function submitCivitaiImageJob(
  input: Record<string, unknown>,
  token: string,
): Promise<CivitaiImageResult> {
  const body = {
    steps: [{ $type: "imageGen", input }],
  };

  const submit = await fetch(`${CIVITAI_ORCH_URL}/workflows?wait=60`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!submit.ok) {
    const errorText = (await submit.text()).slice(0, 400);
    throw new Error(`Civitai submit error ${submit.status}: ${errorText}`);
  }
  let workflow = (await submit.json()) as CivitaiWorkflow;

  // If the synchronous wait window expired, poll the workflow by id
  if (!workflow.steps && workflow.id) {
    for (let i = 0; i < 10; i++) {
      await sleep(3000);
      const poll = await fetch(
        `${CIVITAI_ORCH_URL}/workflows/${workflow.id}?wait=30`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!poll.ok) continue;
      workflow = (await poll.json()) as CivitaiWorkflow;
      if (workflow.steps) break;
    }
  }

  const step = workflow.steps?.[0];
  if (!step || step.status === "failed" || workflow.status === "failed") {
    throw new Error(
      `Civitai generation failed (${step?.reason ?? "unknown reason"})`,
    );
  }
  const url = step.output?.images?.[0]?.url;
  if (!url) throw new Error("Civitai returned no image");
  return { url, workflowId: workflow.id ?? null };
}

/** Fetch a fresh result URL from a completed Civitai workflow. */
async function refetchCivitaiWorkflow(
  workflowId: string,
  token: string,
): Promise<string | null> {
  const res = await fetch(
    `${CIVITAI_ORCH_URL}/workflows/${workflowId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const workflow = (await res.json()) as CivitaiWorkflow;
  return workflow.steps?.[0]?.output?.images?.[0]?.url ?? null;
}

/**
 * Download a Civitai result image. Blob URLs are signed and expire, so on a
 * 403/404 we refetch the workflow for a fresh URL, then retry with the bearer
 * token as a last resort.
 */
async function downloadCivitaiImage(
  result: CivitaiImageResult,
  token: string,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  let res = await fetch(result.url);
  if (!res.ok && result.workflowId) {
    const fresh = await refetchCivitaiWorkflow(result.workflowId, token);
    if (fresh) res = await fetch(fresh);
  }
  if (!res.ok) {
    res = await fetch(result.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  if (!res.ok) {
    throw new Error(`Failed to download result (${res.status})`);
  }
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return { buffer: await res.arrayBuffer(), contentType };
}

async function runCivitaiTryOn(
  personImageUrl: string,
  prompt: string,
  token: string,
): Promise<CivitaiImageResult> {
  const model = process.env.CIVITAI_TRYON_MODEL ?? DEFAULT_MODEL;
  return submitCivitaiImageJob(
    {
      engine: "sdcpp",
      ecosystem: "sdxl",
      operation: "createVariant",
      model,
      prompt: `masterpiece, best quality, realistic photo, ${prompt}`,
      negativePrompt:
        "worst quality, low quality, blurry, deformed, extra limbs, distorted",
      width: 1024,
      height: 1024,
      cfgScale: 7,
      steps: 25,
      image: personImageUrl,
      strength: 0.75,
    },
    token,
  );
}

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

      const result = await runCivitaiTryOn(
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

    const model = process.env.CIVITAI_TRYON_MODEL ?? DEFAULT_MODEL;
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