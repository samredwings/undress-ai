"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Character {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  personality: string | null;
  appearance: string | null;
  background: string | null;
  traits: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CharacterDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const characterId = searchParams.get("id") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [character, setCharacter] = useState<Character | null>(null);
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(true);

  useEffect(() => {
    fetchCharacter();
  }, [characterId]);

  const fetchCharacter = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters/${characterId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const c = response.data;
      setCharacter(c);
      setName(c.name || "");
      setDescription(c.description || "");
      setBackground(c.background || "");
      setImageUrl(c.imageUrl || "");
      setImagePreview(c.imageUrl || null);

      // Parse traits
      const traits = c.traits ? parseJsonField(c.traits) : [];
      setTraitsInput(Array.isArray(traits) ? traits.join(", ") : "");

      // Parse personality
      const personality = c.personality ? parseJsonField(c.personality) : {};
      if (typeof personality === "object" && !Array.isArray(personality)) {
        setPersonalityTraits(personality as Record<string, string>);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch character");
    } finally {
      setLoading(false);
    }
  };

  const parseJsonField = (value: string): any => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const token = localStorage.getItem("token");
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
          label: `Character: ${name || "character"}`,
          description: `Character image for ${name}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setImageUrl(response.data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Character name is required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const traits = traitsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters/${characterId}`,
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

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update character");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this character?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters/${characterId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      router.push("/dashboard/characters");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete character");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-purple-400 text-xl animate-pulse">
          Loading character...
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Character Not Found
          </h2>
          <Link
            href="/dashboard/characters"
            className="text-purple-400 hover:text-purple-300"
          >
            ← Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <nav className="bg-black/50 backdrop-blur border-b border-purple-500/20 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link
            href="/dashboard/characters"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
          >
            ← {character.name}
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="bg-red-600/20 hover:bg-red-600/40 text-red-300 font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 text-red-300">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-400 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 mb-6 text-green-300">
            ✅ Character saved successfully!
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8">
          <form onSubmit={handleSave} className="space-y-6">
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
                      alt={character.name}
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
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition"
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
                rows={3}
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition resize-none"
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
                rows={4}
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition resize-none"
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
                  placeholder="Trait name"
                  className="flex-1 bg-gray-700/50 border border-purple-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-400 transition"
                />
                <input
                  type="text"
                  value={newTraitValue}
                  onChange={(e) => setNewTraitValue(e.target.value)}
                  placeholder="Value"
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

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? "Saving..." : "💾 Save Character"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

