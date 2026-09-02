"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

interface Scene {
  id: string;
  title: string;
  description: string | null;
  sceneNumber: number;
  imageUrl: string | null;
  videoUrl: string | null;
  status: string;
}

interface MediaAsset {
  id: string;
  url: string;
  assetType: string;
  label: string | null;
  description: string | null;
  sceneOrder: number | null;
}

interface Story {
  id: string;
  title: string;
  content: string;
  genre: string;
  contentRating: string;
  status: string;
  scenes: Scene[];
}

export default function StoryEditor() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get("id") || "";
  const [story, setStory] = useState<Story | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"content" | "scenes" | "roleplay">(
    "content",
  );
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Scene gallery state
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Roleplay image generation
  const [generateRoleplayImage, setGenerateRoleplayImage] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  const fetchStory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setStory(response.data);
      setContent(response.data.content);
      setScenes(response.data.scenes || []);

      // Also fetch media assets linked to this story
      fetchMediaAssets();
    } catch (error) {
      console.error("Failed to fetch story:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaAssets = async () => {
    setGalleryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/media-assets?storyId=${storyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMediaAssets(response.data);
    } catch (error) {
      console.error("Failed to fetch media assets:", error);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleSaveContent = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      alert("Story saved!");
    } catch (error) {
      console.error("Failed to save story:", error);
    }
  };

  const handleRoleplayMessage = async () => {
    if (!chatInput.trim()) return;

    const newMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
      imageUrl: null,
    };

    setChatMessages([...chatMessages, newMessage]);
    const messageText = chatInput;
    setChatInput("");

    try {
      // Send to roleplay AI endpoint with optional image generation
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roleplay/respond`,
        {
          storyId,
          message: messageText,
          context: story?.content,
          generateImage: generateRoleplayImage,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.response,
          imageUrl: response.data.imageUrl || null,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to get roleplay response:", error);
    }
  };

  const handleGenerateSceneImage = async (sceneId: string) => {
    try {
      const token = localStorage.getItem("token");
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      // Generate image via roleplay with the scene description as context
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roleplay/respond`,
        {
          storyId,
          message: `Generate a visual scene: ${scene.title}`,
          context: scene.description || scene.title,
          generateImage: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.imageUrl) {
        // Refresh media assets to show new image
        fetchMediaAssets();
      }
    } catch (error) {
      console.error("Failed to generate scene image:", error);
    }
  };

  const getDisplayUrl = (urlOrId: string): string => {
    // If it's a data URI, use it directly
    if (urlOrId.startsWith("data:") || urlOrId.startsWith("http")) {
      return urlOrId;
    }
    // If it's an API path, use the full URL
    return `${process.env.NEXT_PUBLIC_API_URL}${urlOrId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8">
          ✏️ {story?.title}
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-purple-500/20">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === "content"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📝 Content Editor
          </button>
          <button
            onClick={() => setActiveTab("scenes")}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === "scenes"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🎬 Scenes & Gallery (
            {(story?.scenes?.length || 0) + mediaAssets.length})
          </button>
          <button
            onClick={() => setActiveTab("roleplay")}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === "roleplay"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            💬 Roleplay Companion
          </button>
        </div>

        {/* ─── Content Editor Tab ──────────────────────────────────── */}
        {activeTab === "content" && (
          <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6">
            <ReactQuill
              theme="dark"
              value={content}
              onChange={setContent}
              modules={{
                toolbar: [
                  ["bold", "italic", "underline"],
                  ["blockquote", "code-block"],
                  [{ list: "ordered" }, { list: "bullet" }],
                ],
              }}
              style={{
                height: "500px",
                color: "white",
              }}
            />
            <button
              onClick={handleSaveContent}
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              💾 Save Story
            </button>
          </div>
        )}

        {/* ─── Scenes & Gallery Tab ────────────────────────────────── */}
        {activeTab === "scenes" && (
          <div className="space-y-6">
            {/* Story Scenes */}
            {scenes.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  🎬 Story Scenes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="bg-gray-700/30 rounded-lg overflow-hidden border border-purple-500/10 hover:border-purple-400/30 transition group"
                    >
                      {/* Scene Image */}
                      <div className="h-40 bg-gradient-to-br from-purple-800/30 to-pink-800/30 flex items-center justify-center overflow-hidden">
                        {scene.imageUrl ? (
                          <img
                            src={getDisplayUrl(scene.imageUrl)}
                            alt={scene.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <div className="text-3xl mb-2">🎬</div>
                            <p className="text-gray-500 text-xs">
                              No image yet
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-purple-400 font-medium">
                              Scene {scene.sceneNumber}
                            </span>
                            <h3 className="text-white font-semibold mt-1">
                              {scene.title}
                            </h3>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              scene.status === "COMPLETED"
                                ? "bg-green-600/30 text-green-300"
                                : scene.status === "FAILED"
                                  ? "bg-red-600/30 text-red-300"
                                  : "bg-yellow-600/30 text-yellow-300"
                            }`}
                          >
                            {scene.status}
                          </span>
                        </div>
                        {scene.description && (
                          <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                            {scene.description}
                          </p>
                        )}
                        {!scene.imageUrl && (
                          <button
                            onClick={() => handleGenerateSceneImage(scene.id)}
                            className="mt-3 w-full bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-sm font-medium py-2 rounded-lg transition"
                          >
                            🎨 Generate Image
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Assets Gallery */}
            <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                🖼️ Media Assets ({mediaAssets.length})
              </h2>
              {galleryLoading ? (
                <div className="text-center py-8 text-purple-400 animate-pulse">
                  Loading media assets...
                </div>
              ) : mediaAssets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No media assets linked to this story.</p>
                  <p className="text-sm">
                    Upload images in the Media tab or enable image generation in
                    the Roleplay Companion.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative bg-gray-700/30 rounded-lg overflow-hidden border border-purple-500/10 hover:border-purple-400/30 transition"
                    >
                      {asset.url.startsWith("data:") ||
                      asset.url.startsWith("http") ? (
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={getDisplayUrl(asset.url)}
                            alt={asset.label || "Media asset"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square flex items-center justify-center bg-gray-800">
                          <span className="text-3xl">🎬</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full">
                          <p className="text-white text-sm font-medium truncate">
                            {asset.label || "Untitled"}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <a
                              href={
                                asset.url.startsWith("data:") ||
                                asset.url.startsWith("http")
                                  ? asset.url
                                  : `${process.env.NEXT_PUBLIC_API_URL}/api/media-assets/${asset.id}/download`
                              }
                              download
                              className="text-xs text-purple-300 hover:text-purple-200"
                            >
                              💾 Download
                            </a>
                            {asset.sceneOrder && (
                              <span className="text-xs text-gray-400">
                                Scene #{asset.sceneOrder}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {asset.assetType === "VIDEO" && (
                        <div className="absolute top-2 right-2 bg-purple-600/80 text-white text-xs px-2 py-1 rounded-full">
                          VIDEO
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Roleplay Companion Tab ───────────────────────────────── */}
        {activeTab === "roleplay" && (
          <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                💬 Roleplay Companion
              </h2>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <button
                  type="button"
                  onClick={() =>
                    setGenerateRoleplayImage(!generateRoleplayImage)
                  }
                  className={`relative w-10 h-5 rounded-full transition ${
                    generateRoleplayImage ? "bg-purple-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      generateRoleplayImage ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                🎨 Generate Image
              </label>
            </div>

            <div className="h-96 overflow-y-auto mb-4 bg-black/30 rounded p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx}>
                  <div
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-pink-600 text-white"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.imageUrl && (
                    <div className="flex justify-start mt-2">
                      <div className="max-w-xs rounded-lg overflow-hidden border border-purple-500/20">
                        <img
                          src={getDisplayUrl(msg.imageUrl)}
                          alt="Generated scene"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleRoleplayMessage()}
                placeholder="Chat with your story companion..."
                className="flex-1 bg-gray-900 border border-purple-500/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleRoleplayMessage}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-6 rounded transition"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

