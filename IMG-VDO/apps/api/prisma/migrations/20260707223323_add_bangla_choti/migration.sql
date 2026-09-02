-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CREATOR', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "StoryboardStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StoryGenre" AS ENUM ('ROMANCE', 'FANTASY', 'SCI_FI', 'DRAMA', 'MYSTERY', 'ADVENTURE', 'EROTICA', 'THRILLER', 'HORROR', 'COMEDY', 'OTHER', 'BANGLA_INCEST_CHOTI');

-- CreateEnum
CREATE TYPE "ContentRating" AS ENUM ('G', 'PG', 'PG_13', 'R', 'NC_17', 'X', 'XXX');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SceneStatus" AS ENUM ('PENDING', 'PROCESSING', 'GENERATING_VIDEO', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'GENERATING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('RUNWAY', 'PIKA', 'COGVIDEOX');

-- CreateEnum
CREATE TYPE "ContentCheckType" AS ENUM ('STORY', 'SCENE', 'VIDEO', 'IMAGE');

-- CreateEnum
CREATE TYPE "NSFWAction" AS ENUM ('ALLOW', 'FLAG', 'BLOCK', 'BLUR');

-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storyboard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "userId" TEXT NOT NULL,
    "status" "StoryboardStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Storyboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "personality" TEXT,
    "appearance" TEXT,
    "background" TEXT,
    "traits" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "genre" "StoryGenre" NOT NULL,
    "contentRating" "ContentRating" NOT NULL,
    "tags" TEXT[],
    "characters" TEXT[],
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "nsfwScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "nsfwFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sceneNumber" INTEGER NOT NULL,
    "storyId" TEXT NOT NULL,
    "storyboardId" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "generationJobId" TEXT,
    "prompt" TEXT,
    "motionStrength" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "status" "SceneStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneCharacter" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "roleInScene" TEXT,
    "dialogues" TEXT,
    "actions" TEXT,

    CONSTRAINT "SceneCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "provider" "VideoProvider" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "motionStrength" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "resultVideoUrl" TEXT,
    "resultThumbnail" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NSFWCheck" (
    "id" TEXT NOT NULL,
    "contentType" "ContentCheckType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "tensorflowScore" DOUBLE PRECISION,
    "openaiScore" DOUBLE PRECISION,
    "customScore" DOUBLE PRECISION,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "action" "NSFWAction" NOT NULL DEFAULT 'FLAG',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flaggedAt" TIMESTAMP(3),

    CONSTRAINT "NSFWCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastUsed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "assetType" "MediaAssetType" NOT NULL DEFAULT 'IMAGE',
    "label" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "storyId" TEXT,
    "sceneOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CharacterToStoryboard" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Storyboard_userId_idx" ON "Storyboard"("userId");

-- CreateIndex
CREATE INDEX "Storyboard_status_idx" ON "Storyboard"("status");

-- CreateIndex
CREATE INDEX "Character_userId_idx" ON "Character"("userId");

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "Character"("name");

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "Story"("userId");

-- CreateIndex
CREATE INDEX "Story_genre_idx" ON "Story"("genre");

-- CreateIndex
CREATE INDEX "Story_contentRating_idx" ON "Story"("contentRating");

-- CreateIndex
CREATE INDEX "Scene_storyId_idx" ON "Scene"("storyId");

-- CreateIndex
CREATE INDEX "Scene_storyboardId_idx" ON "Scene"("storyboardId");

-- CreateIndex
CREATE INDEX "Scene_status_idx" ON "Scene"("status");

-- CreateIndex
CREATE INDEX "SceneCharacter_sceneId_idx" ON "SceneCharacter"("sceneId");

-- CreateIndex
CREATE INDEX "SceneCharacter_characterId_idx" ON "SceneCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "SceneCharacter_sceneId_characterId_key" ON "SceneCharacter"("sceneId", "characterId");

-- CreateIndex
CREATE INDEX "GenerationJob_status_idx" ON "GenerationJob"("status");

-- CreateIndex
CREATE INDEX "GenerationJob_provider_idx" ON "GenerationJob"("provider");

-- CreateIndex
CREATE INDEX "GenerationJob_createdAt_idx" ON "GenerationJob"("createdAt");

-- CreateIndex
CREATE INDEX "NSFWCheck_contentType_contentId_idx" ON "NSFWCheck"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "NSFWCheck_isFlagged_idx" ON "NSFWCheck"("isFlagged");

-- CreateIndex
CREATE INDEX "NSFWCheck_checkedAt_idx" ON "NSFWCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "UserApiKey_userId_idx" ON "UserApiKey"("userId");

-- CreateIndex
CREATE INDEX "UserApiKey_provider_idx" ON "UserApiKey"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "UserApiKey_userId_provider_key" ON "UserApiKey"("userId", "provider");

-- CreateIndex
CREATE INDEX "MediaAsset_userId_idx" ON "MediaAsset"("userId");

-- CreateIndex
CREATE INDEX "MediaAsset_storyId_idx" ON "MediaAsset"("storyId");

-- CreateIndex
CREATE INDEX "MediaAsset_assetType_idx" ON "MediaAsset"("assetType");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToStoryboard_AB_unique" ON "_CharacterToStoryboard"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToStoryboard_B_index" ON "_CharacterToStoryboard"("B");

-- AddForeignKey
ALTER TABLE "Storyboard" ADD CONSTRAINT "Storyboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_storyboardId_fkey" FOREIGN KEY ("storyboardId") REFERENCES "Storyboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "GenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneCharacter" ADD CONSTRAINT "SceneCharacter_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneCharacter" ADD CONSTRAINT "SceneCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterToStoryboard" ADD CONSTRAINT "_CharacterToStoryboard_A_fkey" FOREIGN KEY ("A") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterToStoryboard" ADD CONSTRAINT "_CharacterToStoryboard_B_fkey" FOREIGN KEY ("B") REFERENCES "Storyboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
