"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export interface OutfitDetection {
  top: string;
  bottom: string;
  style: string;
  colors: string[];
  /** Present when detection failed — surfaced in the UI for debugging. */
  error?: string;
}

const SYSTEM_PROMPT = `You are a fashion analyst. Look at the person in the photo and describe their outfit.
Return STRICT JSON with exactly these keys and nothing else (no markdown, no commentary):
{"top": "the top garment, e.g. white crew-neck t-shirt", "bottom": "the bottom garment, e.g. blue slim jeans", "style": "one or two style keywords, e.g. casual streetwear", "colors": ["dominant color names, 2-4 items"]}
If a part is not visible (e.g. a crop or dress covers the bottom), use an empty string for that field.`;

export const detectOutfit = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args): Promise<OutfitDetection | null> => {
    const failed = (error: string): OutfitDetection => ({
      top: "",
      bottom: "",
      style: "",
      colors: [],
      error,
    });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return failed("OPENAI_API_KEY not configured");
    }

    const project = await ctx.runQuery(api.projects.get, {
      projectId: args.projectId,
    });
    if (!project?.originalImageUrl) return null;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            max_tokens: 300,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: [
                  { type: "text", text: "Describe this person's outfit." },
                  {
                    type: "image_url",
                    image_url: { url: project.originalImageUrl },
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        return failed(
          `Vision API ${response.status}: ${errorText.slice(0, 300)}`,
        );
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) return failed("Vision API returned an empty response");

      const parsed = JSON.parse(content) as Record<string, unknown>;
      return {
        top: String(parsed.top ?? ""),
        bottom: String(parsed.bottom ?? ""),
        style: String(parsed.style ?? ""),
        colors: Array.isArray(parsed.colors)
          ? parsed.colors.map((c) => String(c))
          : [],
      };
    } catch (error) {
      return failed(
        error instanceof Error ? error.message : "Vision request failed",
      );
    }
  },
});