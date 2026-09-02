import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    prompt: v.string(),
    garmentImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userId))
      .unique();
    if (!user) throw new Error("User not found");
    const generationId = await ctx.db.insert("generations", {
      projectId: args.projectId,
      userId: user._id,
      prompt: args.prompt,
      garmentImageUrl: args.garmentImageUrl,
      status: "pending",
      createdAt: Date.now(),
    });
    return generationId;
  },
});

export const updateResult = mutation({
  args: {
    generationId: v.id("generations"),
    resultImageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      resultImageUrl: args.resultImageUrl,
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
