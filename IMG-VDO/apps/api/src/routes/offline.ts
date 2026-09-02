import { Router, Response } from "express";
import axios from "axios";
import { z } from "zod";

const router = Router();

const OFFLINE_MODELS = [
  {
    id: "llama-2-7b-q4",
    name: "Llama 2 7B Quantized (Q4)",
    size: "3.5GB",
    ramRequired: "6GB",
    platform: ["android", "ios", "web"],
    uncensored: true,
    supportsAdultContent: true,
    type: "text",
    description: "Uncensored text generation for mobile devices",
  },
  {
    id: "mistral-7b-q4",
    name: "Mistral 7B Quantized (Q4)",
    size: "3.8GB",
    ramRequired: "6GB",
    platform: ["android", "ios", "web"],
    uncensored: true,
    supportsAdultContent: true,
    type: "text",
    description: "Fast uncensored generation with lower memory footprint",
  },
  {
    id: "stable-diffusion-mobile",
    name: "Stable Diffusion Mobile",
    size: "1.8GB",
    ramRequired: "3GB",
    platform: ["android", "ios"],
    uncensored: true,
    supportsAdultContent: true,
    type: "image",
    description: "Uncensored image generation optimized for mobile",
  },
  {
    id: "phi-2-q4",
    name: "Phi-2 Quantized (Q4)",
    size: "1.5GB",
    ramRequired: "3GB",
    platform: ["android", "ios", "web"],
    uncensored: true,
    supportsAdultContent: true,
    type: "text",
    description: "Lightweight model for low-RAM devices (3GB)",
  },
];

const offlineGenerationSchema = z.object({
  prompt: z.string().min(1),
  modelId: z.string(),
  contentType: z.enum(["text", "image", "video"]),
  adultContent: z.boolean().default(true),
  temperature: z.number().min(0).max(2).default(0.85),
  maxTokens: z.number().min(50).max(4096).default(1024),
});

// GET /api/offline/models
router.get("/models", (req, res) => {
  res.json({
    models: OFFLINE_MODELS,
    note: "All models support unrestricted adult content generation with no filters",
    unrestrictedMode: true,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/offline/models/compatible
router.get("/models/compatible", (req, res) => {
  const { ram } = req.query;
  const ramMB = ram ? parseInt(ram as string) : 4096;

  const compatible = OFFLINE_MODELS.filter((m) => {
    const requiredMB = parseInt(m.ramRequired) * 1024;
    return ramMB >= requiredMB;
  });

  res.json({
    compatible,
    deviceRam: `${Math.round(ramMB / 1024)}GB`,
    unrestrictedMode: true,
  });
});

// POST /api/offline/generate
router.post("/generate", async (req, res) => {
  try {
    const data = offlineGenerationSchema.parse(req.body);

    const model = OFFLINE_MODELS.find((m) => m.id === data.modelId);
    if (!model) {
      return res.status(400).json({ error: "Invalid model ID" });
    }

    res.json({
      success: true,
      message: "Offline generation initiated",
      model: model.name,
      contentType: data.contentType,
      adultContent: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Generation failed" });
  }
});

// POST /api/offline/stream
router.post("/stream", async (req, res) => {
  try {
    const { prompt, modelId } = req.body;

    if (!prompt || !modelId) {
      return res.status(400).json({ error: "Prompt and model ID required" });
    }

    // Set up streaming response
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Simulate streaming generation
    const words = prompt.split(" ");
    for (let i = 0; i < words.length; i++) {
      res.write(
        `data: ${JSON.stringify({ token: words[i], index: i, total: words.length })}\n\n`,
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    res.write(
      `data: ${JSON.stringify({ done: true, unrestrictedMode: true })}\n\n`,
    );
    res.end();
  } catch (error) {
    res.status(500).json({ error: "Streaming failed" });
  }
});

export default router;
