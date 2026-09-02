import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";

async function getCurrentUserId(ctx: QueryCtx) {
  return await getAuthUserId(ctx);
}

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return Promise.all(
      projects.map(async (project) => ({
        ...project,
        originalImageUrl:
          (await ctx.storage.getUrl(project.originalImageStorageId)) ?? null,
      })),
    );
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) return null;
    return {
      ...project,
      originalImageUrl:
        (await ctx.storage.getUrl(project.originalImageStorageId)) ?? null,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("projects", {
      userId,
      title: args.title,
      originalImageStorageId: args.storageId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId)
      throw new Error("Not authorized");
    // Delete all generations for this project, including their stored files
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const gen of generations) {
      if (gen.resultImageStorageId) {
        await ctx.storage.delete(gen.resultImageStorageId);
      }
      if (gen.garmentImageStorageId) {
        await ctx.storage.delete(gen.garmentImageStorageId);
      }
      await ctx.db.delete(gen._id);
    }
    await ctx.storage.delete(project.originalImageStorageId);
    await ctx.db.delete(args.projectId);
  },
});