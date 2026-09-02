import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";

async function getCurrentUserId(ctx: QueryCtx) {
  return await getAuthUserId(ctx);
}

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
    return Promise.all(
      generations.map(async (gen) => ({
        ...gen,
        resultImageUrl: gen.resultImageStorageId
          ? (await ctx.storage.getUrl(gen.resultImageStorageId)) ?? null
          : null,
        garmentImageUrl: gen.garmentImageStorageId
          ? (await ctx.storage.getUrl(gen.garmentImageStorageId)) ?? null
          : null,
      })),
    );
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    prompt: v.string(),
    garmentImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("generations", {
      projectId: args.projectId,
      userId,
      prompt: args.prompt,
      garmentImageStorageId: args.garmentImageStorageId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateResult = mutation({
  args: {
    generationId: v.id("generations"),
    resultImageStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      resultImageStorageId: args.resultImageStorageId,
      status: "completed",
    });
  },
});

export const updateStatus = mutation({
  args: {
    generationId: v.id("generations"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: args.status,
      ...(args.error !== undefined && { error: args.error }),
    });
  },
});