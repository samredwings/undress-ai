"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function NewCharacterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [traitsInput, setTraitsInput] = useState("");
  const [personalityTraits, setPersonalityTraits] = useState<
    Record<string, string>
  >({});
  const [newTraitKey, setNewTraitKey] = useState("");
  const [newTraitValue, setNewTraitValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload via media-assets endpoint
    try {
      const token = localStorage.getItem("token");

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.readAsDataURL(file);
      });

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/media-assets`,
        {
          url: base64,
          assetType: "IMAGE",
          label: `Character: ${name || "unnamed"}`,
          description: `Uploaded character image for ${name || "new character"}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setImageUrl(response.data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
      // Still keep the preview
    }
  };

  const addPersonalityTrait = () => {
    if (!newTraitKey.trim() || !newTraitValue.trim()) return;
    setPersonalityTraits((prev) => ({
      ...prev,
      [newTraitKey.trim()]: newTraitValue.trim(),
    }));
    setNewTraitKey("");
    setNewTraitValue("");
  };

  const removePersonalityTrait = (key: string) => {
    setPersonalityTraits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Character name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const traits = traitsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters`,
        {
          name: name.trim(),
          description: description.trim() || undefined,
          background: background.trim() || undefined,
          imageUrl: imageUrl || imagePreview || undefined,
          personality:
            Object.keys(personalityTraits).length > 0
              ? personalityTraits
              : undefined,
          appearance: undefined,
          traits: traits.length > 0 ? traits : undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      router.push(`/dashboard/characters/detail?id=${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create character");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <nav className="bg-black/50 backdrop-blur border-b border-purple-500/20 p-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard/characters"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
          >
            ← Create Character
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            ✨ New Character
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Character Image
              </label>
              <div
                className="border-2 border-dashed border-purple-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400/50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                        setImageUrl("");
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-gray-400">
                      Click to upload character image
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      PNG, JPG, or WEBP
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Character Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sarah, Rajesh, Aisha"
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the character..."
                rows={3}
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition resize-none"
              />
            </div>

            {/* Background */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Background Story
              </label>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Character backstory, history, and motivations..."
                rows={4}
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition resize-none"
              />
            </div>

            {/* Traits */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Traits (comma-separated)
              </label>
              <input
                type="text"
                value={traitsInput}
                onChange={(e) => setTraitsInput(e.target.value)}
                placeholder="e.g., passionate, mysterious, dominant, caring"
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition"
              />
            </div>

            {/* Personality */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Personality Details
              </label>
              <div className="space-y-2 mb-2">
                {Object.entries(personalityTraits).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 bg-purple-600/20 rounded-lg px-3 py-2"
                  >
                    <span className="text-purple-300 font-medium text-sm min-w-[100px]">
                      {key}:
                    </span>
                    <span className="text-gray-300 text-sm flex-1">
                      {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePersonalityTrait(key)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTraitKey}
                  onChange={(e) => setNewTraitKey(e.target.value)}
                  placeholder="Trait name (e.g., voice)"
                  className="flex-1 bg-gray-700/50 border border-purple-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-400 transition"
                />
                <input
                  type="text"
                  value={newTraitValue}
                  onChange={(e) => setNewTraitValue(e.target.value)}
                  placeholder="Value (e.g., soft and seductive)"
                  className="flex-1 bg-gray-700/50 border border-purple-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-400 transition"
                />
                <button
                  type="button"
                  onClick={addPersonalityTrait}
                  disabled={!newTraitKey.trim() || !newTraitValue.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? "Creating..." : "✨ Create Character"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

