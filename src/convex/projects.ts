import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";

async function getCurrentUserId(ctx: QueryCtx) {
  return await getAuthUserId(ctx);
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    originalImageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const projectId = await ctx.db.insert("projects", {
      userId,
      title: args.title,
      originalImageUrl: args.originalImageUrl,
      createdAt: Date.now(),
    });
    return projectId;
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
    // Delete all generations for this project
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const gen of generations) {
      await ctx.db.delete(gen._id);
    }
    await ctx.db.delete(args.projectId);
  },
});