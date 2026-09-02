"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
}

export default function CharactersPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setCharacters(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch characters");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setCharacters(characters.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete character");
    }
  };

  const parseJsonField = (value: string | null): any => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <nav className="bg-black/50 backdrop-blur border-b border-purple-500/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
          >
            ← Characters
          </Link>
          <div className="space-x-4">
            <Link
              href="/dashboard/characters/new"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              + Create Character
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-purple-400 text-xl animate-pulse">
              Loading characters...
            </div>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No Characters Yet
            </h2>
            <p className="text-gray-400 mb-8">
              Create your first character to start building stories!
            </p>
            <Link
              href="/dashboard/characters/new"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-lg transition inline-block"
            >
              ✨ Create Character
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => {
              const traits = parseJsonField(character.traits);
              const personality = parseJsonField(character.personality);

              return (
                <div
                  key={character.id}
                  className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-400/40 transition group"
                >
                  {/* Character Image */}
                  <div className="h-48 bg-gradient-to-br from-purple-800/50 to-pink-800/50 flex items-center justify-center overflow-hidden">
                    {character.imageUrl ? (
                      <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl opacity-50">
                        {character.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Character Info */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {character.name}
                    </h3>

                    {character.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {character.description}
                      </p>
                    )}

                    {/* Traits */}
                    {Array.isArray(traits) && traits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {traits.slice(0, 4).map((trait: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded-full"
                          >
                            {trait}
                          </span>
                        ))}
                        {traits.length > 4 && (
                          <span className="text-xs text-gray-500 px-1 py-1">
                            +{traits.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Personality summary */}
                    {personality && typeof personality === "object" && (
                      <div className="text-xs text-gray-500 mb-4">
                        {Object.entries(personality)
                          .slice(0, 2)
                          .map(([key, val]) => (
                            <span key={key} className="mr-2">
                              {key}: {String(val)}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/dashboard/characters/detail?id=${character.id}`}
                        className="flex-1 text-center bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-medium py-2 rounded-lg transition text-sm"
                      >
                        ✏️ Edit
                      </Link>
                      {deleteConfirm === character.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(character.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg transition text-sm"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(character.id)}
                          className="bg-red-600/20 hover:bg-red-600/40 text-red-300 font-medium py-2 px-3 rounded-lg transition text-sm"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

