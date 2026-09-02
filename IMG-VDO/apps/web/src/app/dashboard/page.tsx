"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

interface DashboardStats {
  stats: {
    storyboards: number;
    stories: number;
    characters: number;
    totalScenes: number;
  };
  recentStories: any[];
  recentStoryboards: any[];
}

export default function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <nav className="bg-black/50 backdrop-blur border-b border-purple-500/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            ✨ StoryBook Studio
          </h1>
          <div className="space-x-4">
            <Link
              href="/dashboard/stories"
              className="text-white hover:text-purple-400"
            >
              Stories
            </Link>
            <Link
              href="/dashboard/stories/build-from-images"
              className="text-white hover:text-amber-400"
            >
              🎨 Image Story
            </Link>
            <Link
              href="/dashboard/characters"
              className="text-white hover:text-purple-400"
            >
              Characters
            </Link>
            <Link
              href="/dashboard/storyboards"
              className="text-white hover:text-purple-400"
            >
              Storyboards
            </Link>
            <Link
              href="/dashboard/stories/new?language=BANGLA&genre=BANGLA_INCEST_CHOTI"
              className="text-white hover:text-rose-400"
            >
              বাংলা চটি
            </Link>
            <Link
              href="/dashboard/sex-game"
              className="text-white hover:text-pink-300"
            >
              🎮 Sex Game
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-900 p-6 rounded-lg">
            <p className="text-purple-200 text-sm mb-2">Storyboards</p>
            <p className="text-4xl font-bold text-white">
              {dashboardData?.stats.storyboards || 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-pink-600 to-pink-900 p-6 rounded-lg">
            <p className="text-pink-200 text-sm mb-2">Stories</p>
            <p className="text-4xl font-bold text-white">
              {dashboardData?.stats.stories || 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-900 p-6 rounded-lg">
            <p className="text-blue-200 text-sm mb-2">Characters</p>
            <p className="text-4xl font-bold text-white">
              {dashboardData?.stats.characters || 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-900 p-6 rounded-lg">
            <p className="text-green-200 text-sm mb-2">Total Scenes</p>
            <p className="text-4xl font-bold text-white">
              {dashboardData?.stats.totalScenes || 0}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Link
            href="/dashboard/stories/new"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
          >
            ✍️ Create New Story
          </Link>
          <Link
            href="/dashboard/stories/build-from-images"
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
          >
            🎨 Build from Images
          </Link>
          <Link
            href="/dashboard/characters/new"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
          >
            👥 Add Character
          </Link>
          <Link
            href="/dashboard/storyboards/new"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
          >
            🎬 Create Storyboard
          </Link>
          <Link
            href="/dashboard/stories/new?language=BANGLA&genre=BANGLA_INCEST_CHOTI"
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
          >
            📖 বাংলা চটি
          </Link>
          <Link
            href="/dashboard/sex-game"
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-lg text-center transition"
          >
            🎮 Sex Game
          </Link>
        </div>

        {/* Recent Stories */}
        {dashboardData?.recentStories &&
          dashboardData.recentStories.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">
                Recent Stories
              </h2>
              <div className="space-y-2">
                {dashboardData.recentStories.map((story) => (
                  <Link
                    key={story.id}
                    href={`/dashboard/stories/editor?id=${story.id}`}
                    className="block p-3 bg-purple-600/20 hover:bg-purple-600/40 rounded border border-purple-500/20 text-white transition"
                  >
                    <p className="font-semibold">{story.title}</p>
                    <p className="text-sm text-gray-300">
                      Genre: {story.genre}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}


