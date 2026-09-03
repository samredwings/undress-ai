"use node";

export const CIVITAI_ORCH_URL = "https://orchestration.civitai.com/v2/consumer";

// Default SDXL checkpoint (from Civitai's official docs example). Override
// with the CIVITAI_TRYON_MODEL env var (AIR URN).
export const DEFAULT_CIVITAI_MODEL =
  "urn:air:sdxl:checkpoint:civitai:101055@128078";

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

export interface CivitaiImageResult {
  url: string;
  workflowId: string | null;
}

/** Submit an imageGen workflow to Civitai and wait for the first result image. */
export async function submitCivitaiImageJob(
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
  const res = await fetch(`${CIVITAI_ORCH_URL}/workflows/${workflowId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const workflow = (await res.json()) as CivitaiWorkflow;
  return workflow.steps?.[0]?.output?.images?.[0]?.url ?? null;
}

/**
 * Download a Civitai result image. Blob URLs are signed and expire, so on a
 * 403/404 we refetch the workflow for a fresh URL, then retry with the bearer
 * token as a last resort.
 */
export async function downloadCivitaiImage(
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

/** SDXL img2img using a person photo as the source image. */
export async function civitaiCreateVariant(
  personImageUrl: string,
  prompt: string,
  token: string,
): Promise<CivitaiImageResult> {
  const model = process.env.CIVITAI_TRYON_MODEL ?? DEFAULT_CIVITAI_MODEL;
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