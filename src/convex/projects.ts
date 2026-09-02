import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userId))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userId))
      .unique();
    if (!user) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    originalImageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userId))
      .unique();
    if (!user) throw new Error("User not found");
    const projectId = await ctx.db.insert("projects", {
      userId: user._id,
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
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userId))
      .unique();
    if (!user) throw new Error("User not found");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id)
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
