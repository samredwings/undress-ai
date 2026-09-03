import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";

async function getCurrentUserId(ctx: QueryCtx) {
  return await getAuthUserId(ctx);
}

export const listCustom = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const items = await ctx.db
      .query("wardrobe_items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: (await ctx.storage.getUrl(item.imageStorageId)) ?? null,
      })),
    );
  },
});

export const addCustom = mutation({
  args: {
    name: v.string(),
    category: v.union(
      v.literal("top"),
      v.literal("bottom"),
      v.literal("full"),
    ),
    imageStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("wardrobe_items", {
      userId,
      name: args.name,
      category: args.category,
      imageStorageId: args.imageStorageId,
      createdAt: Date.now(),
    });
  },
});

export const listWardrobeAssets = query({
  args: {},
  handler: async (ctx) => {
    const assets = await ctx.db.query("wardrobe_assets").collect();
    return Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        imageUrl:
          (await ctx.storage.getUrl(asset.imageStorageId)) ?? null,
      })),
    );
  },
});

export const getWardrobeAsset = query({
  args: { itemId: v.string() },
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("wardrobe_assets")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .first();
    if (!asset) return null;
    return {
      ...asset,
      imageUrl: (await ctx.storage.getUrl(asset.imageStorageId)) ?? null,
    };
  },
});

export const setWardrobeAsset = mutation({
  args: {
    itemId: v.string(),
    imageStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wardrobe_assets")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        imageStorageId: args.imageStorageId,
      });
    } else {
      await ctx.db.insert("wardrobe_assets", {
        itemId: args.itemId,
        imageStorageId: args.imageStorageId,
      });
    }
  },
});

export const removeCustom = mutation({
  args: { itemId: v.id("wardrobe_items") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== userId) throw new Error("Not authorized");
    await ctx.storage.delete(item.imageStorageId);
    await ctx.db.delete(args.itemId);
  },
});