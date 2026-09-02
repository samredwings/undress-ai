"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MediaAsset {
  id: string;
  url: string;
  assetType: "IMAGE" | "VIDEO";
  label?: string;
  description?: string;
  sceneOrder?: number;
  storyId?: string;
}

interface BuildProgress {
  type: "progress" | "complete";
  step: string;
  progress: number;
  message: string;
}

interface BuildResult {
  type: "complete";
  story: any;
  scenes: any[];
  mediaAssets: MediaAsset[];
  analysisCount: number;
  intimacyLevel: number;
}

const GENRES = [
  "ROMANCE",
  "FANTASY",
  "SCI_FI",
  "DRAMA",
  "MYSTERY",
  "ADVENTURE",
  "EROTICA",
  "THRILLER",
  "HORROR",
  "COMEDY",
  "OTHER",
  "BANGLA_INCEST_CHOTI",
];

const INTIMACY_LEVELS = [
  { value: 1, label: "Subtle", desc: "Romantic tension, emotional focus" },
  { value: 3, label: "Mild", desc: "Sensual undertones, light intimacy" },
  { value: 5, label: "Moderate", desc: "Sensual scenes, romantic intimacy" },
  { value: 7, label: "Explicit", desc: "Detailed intimate encounters" },
  { value: 9, label: "Very Explicit", desc: "Hardcore adult content" },
  { value: 10, label: "Extreme", desc: "Maximum explicitness, no limits" },
];

const ACT_TYPES = [
  "romantic",
  "passionate",
  "sensual",
  "explicit",
  "intimate",
  "erotic",
  "kinky",
  "bdsm",
  "vanilla",
  "rough",
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BuildStoryFromImages() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<BuildProgress | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<
    Record<string, string>
  >({});

  // Form state
  const [form, setForm] = useState({
    title: "",
    genre: "EROTICA" as string,
    contentRating: "XXX" as string,
    intimacyLevel: 7,
    includeActType: "sensual",
    storyDirection: "",
    characterDescriptions: "",
    tags: "",
    createScenes: true,
    language: "ENGLISH" as string,
    chotiMode: false,
  });

  // Load existing user assets on mount
  useEffect(() => {
    fetchExistingAssets();
  }, []);

  const fetchExistingAssets = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/media-assets`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const unstoried = response.data.filter((a: MediaAsset) => !a.storyId);
      if (unstoried.length > 0) {
        setAssets(unstoried);
      }
    } catch {
      // Not critical
    }
  };

  // ── Image Upload ─────────────────────────────────────────────────────────────

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      const newAssets: MediaAsset[] = [];

      for (const file of Array.from(files)) {
        // Convert to base64
        const base64 = await fileToBase64(file);
        const dataUri = `data:${file.type};base64,${base64}`;

        // Save preview
        setImagePreviewUrls((prev) => ({
          ...prev,
          [file.name]: dataUri,
        }));

        // Save to backend
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/media-assets`,
          {
            url: dataUri,
            assetType: file.type.startsWith("video") ? "VIDEO" : "IMAGE",
            label: file.name.replace(/\.[^/.]+$/, ""),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        newAssets.push(response.data);
      }

      setAssets((prev) => [...prev, ...newAssets]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload one or more images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ── Drag & Reorder ───────────────────────────────────────────────────────────

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newAssets = [...assets];
    const [moved] = newAssets.splice(draggedIdx, 1);
    newAssets.splice(idx, 0, moved);
    setAssets(newAssets);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAssetLabel = (id: string, label: string) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, label } : a)));
  };

  // ── Build Story ──────────────────────────────────────────────────────────────

  const handleBuildStory = async () => {
    if (assets.length === 0) {
      alert("Please upload at least one image first");
      return;
    }
    if (!form.title.trim()) {
      alert("Please enter a story title");
      return;
    }

    setLoading(true);
    setProgress(null);

    try {
      const token = localStorage.getItem("token");

      // Use the streaming endpoint for progress
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stories/build-from-images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.title,
            assetIds: assets.map((a) => a.id),
            genre: form.genre,
            contentRating: form.contentRating,
            intimacyLevel: form.intimacyLevel,
            includeActType: form.includeActType || undefined,
            storyDirection: form.storyDirection || undefined,
            characterDescriptions: form.characterDescriptions || undefined,
            tags: form.tags
              ? form.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
              : undefined,
            createScenes: form.createScenes,
            language: form.language,
            chotiMode: form.chotiMode,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to build story");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      let result: BuildResult | null = null;
      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === "progress") {
              setProgress(data);
            } else if (data.type === "complete") {
              result = data;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      if (result) {
        // Navigate to the story editor
        router.push(`/dashboard/stories/editor?id=${result.story.id}`);
      }
    } catch (error: any) {
      console.error("Build story error:", error);
      alert(error.message || "Failed to build story from images");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const isValid = assets.length > 0 && form.title.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Navigation */}
      <nav className="bg-black/50 backdrop-blur border-b border-purple-500/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            🎨 Build Story from Images
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left Column: Upload & Images ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                📸 Upload Images
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Upload character shots, scene images, or continuation frames.
                Drag to reorder them — the order determines the story flow.
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-500/40 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/80 transition group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition">
                  {uploading ? "⏳" : "📤"}
                </div>
                <p className="text-gray-300 font-semibold">
                  {uploading
                    ? "Uploading images..."
                    : "Click to upload images or videos"}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Supports JPG, PNG, GIF, MP4
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              {assets.length > 0 && (
                <p className="text-gray-400 text-sm mt-3">
                  {assets.length} asset{assets.length !== 1 ? "s" : ""} loaded.
                  Drag to reorder.
                </p>
              )}
            </div>

            {/* Image Grid */}
            {assets.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  🖼️ Scene Order ({assets.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {assets.map((asset, idx) => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative group bg-gray-900/80 border rounded-lg overflow-hidden transition cursor-grab active:cursor-grabbing ${
                        draggedIdx === idx
                          ? "border-purple-500 opacity-50 scale-95"
                          : "border-purple-500/20 hover:border-purple-500/60"
                      }`}
                    >
                      {/* Scene Number Badge */}
                      <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        #{idx + 1}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAsset(asset.id);
                        }}
                        className="absolute top-2 right-2 z-10 bg-red-600/80 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>

                      {/* Image Preview */}
                      <div className="aspect-video bg-gray-800 relative overflow-hidden">
                        {asset.url.startsWith("data:") ||
                        asset.url.startsWith("http") ? (
                          <Image
                            src={asset.url}
                            alt={asset.label || `Scene ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            🎥 Video
                          </div>
                        )}
                      </div>

                      {/* Label Input */}
                      <div className="p-3">
                        <input
                          type="text"
                          value={asset.label || ""}
                          onChange={(e) =>
                            updateAssetLabel(asset.id, e.target.value)
                          }
                          placeholder="Scene label..."
                          className="w-full bg-gray-800 text-white text-sm border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Story Configuration ───────────────────────── */}
          <div className="space-y-6">
            {/* Story Settings */}
            <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">
                ⚙️ Story Settings
              </h2>

              {/* Title */}
              <div>
                <label className="block text-white font-semibold text-sm mb-1">
                  Story Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter a title for your story..."
                  className="w-full bg-gray-900 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-white font-semibold text-sm mb-1">
                  Genre
                </label>
                <select
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  className="w-full bg-gray-900 border border-purple-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g === "BANGLA_INCEST_CHOTI"
                        ? "🇧🇩 Bangla Incest CHOTI"
                        : g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Rating */}
              <div>
                <label className="block text-white font-semibold text-sm mb-1">
                  Content Rating
                </label>
                <select
                  value={form.contentRating}
                  onChange={(e) =>
                    setForm({ ...form, contentRating: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-purple-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                >
                  {["R", "NC_17", "X", "XXX"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language & CHOTI Mode */}
              {(form.genre === "BANGLA_INCEST_CHOTI" ||
                form.genre === "EROTICA") && (
                <div className="p-3 bg-purple-900/20 border border-purple-500/20 rounded-lg space-y-3">
                  <div>
                    <label className="block text-white font-semibold text-sm mb-1">
                      Language
                    </label>
                    <select
                      value={form.language}
                      onChange={(e) =>
                        setForm({ ...form, language: e.target.value })
                      }
                      className="w-full bg-gray-900 border border-purple-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    >
                      <option value="ENGLISH">English</option>
                      <option value="BANGLA">🇧🇩 বাংলা (Bangla)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-white font-semibold text-sm">
                      CHOTI Mode
                    </label>
                    <button
                      onClick={() =>
                        setForm({ ...form, chotiMode: !form.chotiMode })
                      }
                      className={`relative w-12 h-6 rounded-full transition ${
                        form.chotiMode ? "bg-pink-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                          form.chotiMode ? "left-6" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  {form.chotiMode && (
                    <p className="text-pink-400 text-xs">
                      বাংলা চটি মোড — Bangla incest erotic fiction format
                    </p>
                  )}
                </div>
              )}

              {/* Intimacy Level */}
              <div>
                <label className="block text-white font-semibold text-sm mb-1">
                  Intimacy Level: {form.intimacyLevel}/10
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.intimacyLevel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      intimacyLevel: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Subtle</span>
                  <span>Explicit</span>
                  <span>Extreme</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  {INTIMACY_LEVELS.find((l) => l.value === form.intimacyLevel)
                    ?.desc ||
                    INTIMACY_LEVELS.reduce((prev, curr) =>
                      Math.abs(curr.value - form.intimacyLevel) <
                      Math.abs(prev.value - form.intimacyLevel)
                        ? curr
                        : prev,
                    ).desc}
                </p>
              </div>

              {/* Act Type */}
              <div>
                <label className="block text-white font-semibold text-sm mb-1">
                  Intimacy Style
                </label>
                <select
                  value={form.includeActType}
                  onChange={(e) =>
                    setForm({ ...form, includeActType: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-purple-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                >
                  <option value="">Any style</option>
                  {ACT_TYPES.map((act) => (
                    <option key={act} value={act}>
                      {act.charAt(0).toUpperCase() + act.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Character Descriptions */}
              <div>
                <label className="block text-white font-semibold text-sm mb-1">
                  Character Info (optional)
                </label>
                <textarea
                  value={form.characterDescriptions}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      characterDescriptions: e.target.value,
                    })
                  }
                  placeholder="Describe the characters in your images — names, relationships, dynamics..."
                  rows={3}
                  className="w-full bg-gray-900 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              {/* Story Direction */}
              <div>
                <label className="block text-white font-semibold text-sm mb-1">
                  Story Direction (optional)
                </label>
                <textarea
                  value={form.storyDirection}
                  onChange={(e) =>
                    setForm({ ...form, storyDirection: e.target.value })
                  }
                  placeholder="Any specific direction for the story? e.g., 'Start with a romantic encounter and build to a passionate climax'"
                  rows={3}
                  className="w-full bg-gray-900 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-white font-semibold text-sm mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="romance, passionate, couple"
                  className="w-full bg-gray-900 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              {/* Create Scenes Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-white font-semibold text-sm">
                  Auto-generate video scenes
                </label>
                <button
                  onClick={() =>
                    setForm({ ...form, createScenes: !form.createScenes })
                  }
                  className={`relative w-12 h-6 rounded-full transition ${
                    form.createScenes ? "bg-purple-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                      form.createScenes ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Progress */}
            {progress && (
              <div className="bg-gray-800/80 backdrop-blur border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl animate-pulse">✨</span>
                  <span className="text-white font-semibold text-sm">
                    {progress.message}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Step: {progress.step} — {progress.progress}%
                </p>
              </div>
            )}

            {/* Build Button */}
            <button
              onClick={handleBuildStory}
              disabled={!isValid || loading}
              className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg transition ${
                isValid && !loading
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-600/30"
                  : "bg-gray-700 cursor-not-allowed opacity-50"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Building Story...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>🎬</span>
                  <span>Build Story from Images</span>
                </span>
              )}
            </button>

            {!form.title.trim() && assets.length > 0 && (
              <p className="text-yellow-400 text-xs text-center">
                Please enter a story title above
              </p>
            )}

            {assets.length === 0 && (
              <p className="text-gray-400 text-xs text-center">
                Upload at least one image to get started
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

