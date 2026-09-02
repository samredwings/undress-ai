// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ContentGenre {
  ROMANCE = "ROMANCE",
  FANTASY = "FANTASY",
  SCI_FI = "SCI_FI",
  DRAMA = "DRAMA",
  MYSTERY = "MYSTERY",
  ADVENTURE = "ADVENTURE",
  EROTICA = "EROTICA",
  THRILLER = "THRILLER",
  HORROR = "HORROR",
  COMEDY = "COMEDY",
  OTHER = "OTHER",
  BANGLA_INCEST_CHOTI = "BANGLA_INCEST_CHOTI",
}

export enum ContentLanguage {
  ENGLISH = "ENGLISH",
  BANGLA = "BANGLA",
}

export enum ContentRating {
  G = "G",
  PG = "PG",
  PG_13 = "PG_13",
  R = "R",
  NC_17 = "NC_17",
  X = "X",
  XXX = "XXX",
}

export enum StoryStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum SceneStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  GENERATING_VIDEO = "GENERATING_VIDEO",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum JobStatus {
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  GENERATING = "GENERATING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum VideoProvider {
  RUNWAY = "RUNWAY",
  PIKA = "PIKA",
  COGVIDEOX = "COGVIDEOX",
}

export enum UserRole {
  ADMIN = "ADMIN",
  CREATOR = "CREATOR",
  USER = "USER",
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoGenerationRequest {
  sceneId: string;
  imageUrl: string;
  prompt: string;
  duration: number;
  motionStrength: number;
  provider: VideoProvider;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  quality?: "standard" | "high" | "cinema";
}

export interface VideoGenerationResult {
  videoUrl: string;
  thumbnail: string;
  provider: VideoProvider;
  duration: number;
}

export interface StoryGenerationRequest {
  title: string;
  prompt: string;
  genre: ContentGenre;
  contentRating: ContentRating;
  characterIds?: string[];
  tags?: string[];
  temperature?: number;
  maxTokens?: number;
  language?: ContentLanguage;
  chotiMode?: boolean;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  personality?: Record<string, any>;
  appearance?: Record<string, any>;
  background?: string;
  traits?: string[];
}

export interface GenerationJobData {
  jobId: string;
  sceneId: string;
  provider: VideoProvider;
  prompt: string;
  imageUrl: string;
  motionStrength: number;
  duration: number;
  metadata?: Record<string, any>;
  userId: string;
}

export interface DashboardStats {
  storyboards: number;
  stories: number;
  characters: number;
  totalScenes: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ─── Media Asset Types ─────────────────────────────────────────────────────────

export enum MediaAssetType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

export interface MediaAsset {
  id: string;
  userId: string;
  url: string;
  assetType: MediaAssetType;
  label?: string;
  description?: string;
  metadata?: Record<string, any>;
  storyId?: string;
  sceneOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Build Story from Images Types ─────────────────────────────────────────────

export interface BuildStoryFromImagesRequest {
  title: string;
  assetIds: string[]; // Ordered array of media asset IDs
  genre: ContentGenre;
  contentRating: ContentRating;
  intimacyLevel: number; // 1-10, how explicit/intimate the content should be
  storyDirection?: string; // Optional direction for the story
  includeActType?: string; // e.g., "romantic", "passionate", "explicit", "sensual"
  characterDescriptions?: string; // Optional text describing characters in the images
  tags?: string[];
  language?: ContentLanguage;
  chotiMode?: boolean;
}

export interface BuildStoryFromImagesResponse {
  story: any;
  scenes: any[];
  mediaAssets: MediaAsset[];
  storyContent: string;
}

// ─── Image Analysis Types ──────────────────────────────────────────────────────

export interface ImageAnalysisResult {
  imageUrl: string;
  assetId: string;
  label: string;
  description: string;
  detectedElements: string[];
  mood: string;
  setting: string;
  characterHints: string[];
}
