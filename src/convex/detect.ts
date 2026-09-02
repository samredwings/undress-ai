"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export interface OutfitDetection {
  top: string;
  bottom: string;
  style: string;
  colors: string[];
}

const SYSTEM_PROMPT = `You are a fashion analyst. Look at the person in the photo and describe their outfit.
Return STRICT JSON with exactly these keys and nothing else (no markdown, no commentary):
{"top": "the top garment, e.g. white crew-neck t-shirt", "bottom": "the bottom garment, e.g. blue slim jeans", "style": "one or two style keywords, e.g. casual streetwear", "colors": ["dominant color names, 2-4 items"]}
If a part is not visible (e.g. a crop or dress covers the bottom), use an empty string for that field.`;

export const detectOutfit = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args): Promise<OutfitDetection | null> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null; // vision key not configured — skip detection

    const project = await ctx.runQuery(api.projects.get, {
      projectId: args.projectId,
    });
    if (!project?.originalImageUrl) return null;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Vision API error: ${response.status} - ${errorText.slice(0, 300)}`,
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      return {
        top: String(parsed.top ?? ""),
        bottom: String(parsed.bottom ?? ""),
        style: String(parsed.style ?? ""),
        colors: Array.isArray(parsed.colors)
          ? parsed.colors.map((c) => String(c))
          : [],
      };
    } catch {
      return null;
    }
  },
});