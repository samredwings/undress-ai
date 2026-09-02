import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

const exportSchema = z.object({
  storyId: z.string(),
  format: z.enum(["pdf", "epub", "html", "markdown", "docx"]),
  includeImages: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
});

const publishSchema = z.object({
  storyId: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "private", "unlisted"]).default("public"),
  allowComments: z.boolean().default(true),
});

// POST /api/export/story
router.post("/story", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = exportSchema.parse(req.body);

    // Generate export based on format
    const exportUrl = await generateExport(userId, data);

    res.json({
      success: true,
      exportUrl,
      format: data.format,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});

// POST /api/publish/story
router.post("/story", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = publishSchema.parse(req.body);

    // Publish story — update status to PUBLISHED
    const publishedStoryUrl = await publishStory(userId, data);

    res.json({
      success: true,
      publishedUrl: publishedStoryUrl,
      visibility: data.visibility,
      publishedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Publishing error:", error);
    res.status(500).json({ error: "Publishing failed" });
  }
});

async function generateExport(
  userId: string,
  data: z.infer<typeof exportSchema>,
): Promise<string> {
  // Fetch the story from database
  const story = await prisma.story.findFirst({
    where: { id: data.storyId, userId },
  });

  if (!story) {
    throw new Error("Story not found");
  }

  // Generate content based on format
  let exportContent: string;

  switch (data.format) {
    case "markdown":
      exportContent = generateMarkdownExport(story, data);
      break;
    case "html":
      exportContent = generateHtmlExport(story, data);
      break;
    default:
      // For unsupported native formats (pdf, epub, docx), generate markdown as fallback
      exportContent = generateMarkdownExport(story, data);
  }

  // Save the export as a media asset
  const exportAsset = await prisma.mediaAsset.create({
    data: {
      userId,
      url: `data:text/plain;base64,${Buffer.from(exportContent).toString("base64")}`,
      assetType: "IMAGE",
      label: `${story.title} (${data.format} export)`,
      description: `Export of story "${story.title}" generated at ${new Date().toISOString()}`,
      metadata: JSON.stringify({
        format: data.format,
        storyId: story.id,
        includeImages: data.includeImages,
        includeMetadata: data.includeMetadata,
        generatedAt: new Date().toISOString(),
        originalGenre: story.genre,
      }),
    },
  });

  return exportAsset.url;
}

function generateMarkdownExport(
  story: any,
  data: z.infer<typeof exportSchema>,
): string {
  const parts: string[] = [];

  if (data.includeMetadata) {
    parts.push(`# ${story.title}`);
    parts.push("");
    parts.push(`**Genre:** ${story.genre}`);
    parts.push(`**Rating:** ${story.contentRating}`);
    if (story.tags?.length) {
      parts.push(`**Tags:** ${story.tags.join(", ")}`);
    }
    parts.push(`**Created:** ${new Date(story.createdAt).toISOString()}`);
    parts.push("");
    parts.push("---");
    parts.push("");
  }

  parts.push(story.content);

  return parts.join("\n");
}

function generateHtmlExport(
  story: any,
  data: z.infer<typeof exportSchema>,
): string {
  const metadataHtml = data.includeMetadata
    ? `
    <header>
      <h1>${escapeHtml(story.title)}</h1>
      <dl>
        <dt>Genre</dt><dd>${escapeHtml(story.genre)}</dd>
        <dt>Rating</dt><dd>${escapeHtml(story.contentRating)}</dd>
        ${story.tags?.length ? `<dt>Tags</dt><dd>${story.tags.map(escapeHtml).join(", ")}</dd>` : ""}
        <dt>Created</dt><dd>${new Date(story.createdAt).toISOString()}</dd>
      </dl>
    </header>
    <hr/>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(story.title)} - Export</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #e2e2e2; padding-bottom: 0.5rem; }
    dl { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; }
    dt { font-weight: bold; color: #555; }
    hr { border: none; border-top: 1px solid #e2e2e2; margin: 2rem 0; }
    .content { font-size: 1.1rem; }
  </style>
</head>
<body>
  ${metadataHtml}
  <div class="content">
    ${escapeHtml(story.content)
      .split("\n")
      .map((p) => (p.trim() ? `<p>${p}</p>` : ""))
      .join("\n")}
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function publishStory(
  userId: string,
  data: z.infer<typeof publishSchema>,
): Promise<string> {
  // Fetch the story
  const story = await prisma.story.findFirst({
    where: { id: data.storyId, userId },
  });

  if (!story) {
    throw new Error("Story not found");
  }

  // Update story status to PUBLISHED
  await prisma.story.update({
    where: { id: data.storyId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: data.tags,
    },
  });

  // Return the frontend URL for the published story
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard/stories/${data.storyId}`;
}

export default router;
