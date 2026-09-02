"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const RATINGS = ["G", "PG", "PG_13", "R", "NC_17", "X", "XXX"];

export default function CreateStory() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    prompt: "",
    genre: "ROMANCE",
    contentRating: "R",
    language: "ENGLISH",
    chotiMode: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stories/generate`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      router.push(`/dashboard/stories/editor?id=${response.data.id}`);
    } catch (error) {
      console.error("Failed to create story:", error);
      alert("Failed to create story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            ✨ Create New Story
          </h1>
          <Link
            href="/dashboard/stories/build-from-images"
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition"
          >
            🎨 Build from Images
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-8 space-y-6"
        >
          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Story Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter your story title"
              className="w-full bg-gray-900 border border-purple-500/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Story Prompt
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) =>
                setFormData({ ...formData, prompt: e.target.value })
              }
              placeholder="Describe your story idea in detail..."
              rows={6}
              className="w-full bg-gray-900 border border-purple-500/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* Genre and Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                Genre
              </label>
              <select
                value={formData.genre}
                onChange={(e) =>
                  setFormData({ ...formData, genre: e.target.value })
                }
                className="w-full bg-gray-900 border border-purple-500/30 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g === "BANGLA_INCEST_CHOTI" ? "🇧🇩 Bangla Incest CHOTI" : g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Content Rating
              </label>
              <select
                value={formData.contentRating}
                onChange={(e) =>
                  setFormData({ ...formData, contentRating: e.target.value })
                }
                className="w-full bg-gray-900 border border-purple-500/30 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Language & CHOTI Mode (only shown for certain genres) */}
          {(formData.genre === "BANGLA_INCEST_CHOTI" ||
            formData.genre === "EROTICA") && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-purple-500/30 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ENGLISH">English</option>
                  <option value="BANGLA">🇧🇩 বাংলা (Bangla)</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">
                  CHOTI Mode
                </label>
                <div className="flex items-center space-x-3 mt-2">
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        chotiMode: !formData.chotiMode,
                      })
                    }
                    className={`relative w-14 h-7 rounded-full transition ${
                      formData.chotiMode ? "bg-pink-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition ${
                        formData.chotiMode ? "left-7" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-gray-300 text-sm">
                    {formData.chotiMode ? "বাংলা চটি সক্রিয়" : "Off"}
                  </span>
                </div>
                {formData.chotiMode && (
                  <p className="text-pink-400 text-xs mt-2">
                    Story will be written in Bangla CHOTI format (Bangla incest
                    erotic fiction)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Creating Story..." : "🚀 Create Story"}
          </button>
        </form>
      </div>
    </div>
  );
}

