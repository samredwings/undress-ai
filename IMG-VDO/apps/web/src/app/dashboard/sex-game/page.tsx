"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

// ─── Types ──────────────────────────────────────────────────────────────────

type GamePhase =
  "FOREPLAY" | "BUILD_UP" | "ACT" | "INTENSE_ACT" | "CLIMAX" | "AFTERCARE";

interface Choice {
  id: number;
  text: string;
  intensity: number;
  staminaCost: number;
  arousalGain: number;
}

interface GameState {
  phase: GamePhase;
  arousal: number;
  stamina: number;
  round: number;
  description: string;
  choices: Choice[];
  climaxAchieved: boolean;
  climaxCount: number;
  sessionComplete: boolean;
  imageUrl?: string;
}

interface SessionInfo {
  characterName: string;
  characterImageUrl?: string;
  relationshipType: string;
  scenario: string;
  language: string;
  intensity: number;
  createdAt: string;
}

interface CharacterSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
}

// ─── Phase Display Configuration ────────────────────────────────────────────

const PHASE_CONFIG: Record<
  GamePhase,
  { label: string; icon: string; color: string; description: string }
> = {
  FOREPLAY: {
    label: "Foreplay",
    icon: "💋",
    color: "from-pink-400 to-rose-400",
    description: "Sensual exploration and teasing",
  },
  BUILD_UP: {
    label: "Building Up",
    icon: "🔥",
    color: "from-orange-400 to-red-400",
    description: "Intensity increasing",
  },
  ACT: {
    label: "The Act",
    icon: "💫",
    color: "from-red-500 to-rose-600",
    description: "Deep passion",
  },
  INTENSE_ACT: {
    label: "Intense Climax Building",
    icon: "⚡",
    color: "from-purple-500 to-pink-600",
    description: "Approaching the peak",
  },
  CLIMAX: {
    label: "Climax",
    icon: "✨",
    color: "from-yellow-400 to-orange-500",
    description: "Explosive release",
  },
  AFTERCARE: {
    label: "Aftercare",
    icon: "💕",
    color: "from-blue-300 to-purple-400",
    description: "Warmth and tenderness",
  },
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SexGamePage() {
  // Game state
  const [setupMode, setSetupMode] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [climaxFlash, setClimaxFlash] = useState(false);

  // Characters list from API
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);

  // Setup form
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [relationshipType, setRelationshipType] = useState("partner");
  const [scenario, setScenario] = useState("");
  const [intensity, setIntensity] = useState(7);
  const [generateImage, setGenerateImage] = useState(false);

  const descriptionRef = useRef<HTMLDivElement>(null);

  // Load characters on mount
  useEffect(() => {
    fetchCharacters();
  }, []);

  // Scroll description into view when it updates
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.scrollTop = 0;
    }
  }, [game?.description]);

  // Climax flash effect
  useEffect(() => {
    if (game?.climaxAchieved) {
      setClimaxFlash(true);
      const timer = setTimeout(() => setClimaxFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [game?.climaxAchieved, game?.round]);

  // ─── API Calls ─────────────────────────────────────────────────────────

  const fetchCharacters = async () => {
    setCharactersLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setCharacters(response.data);
    } catch (err) {
      console.error("Failed to load characters:", err);
    } finally {
      setCharactersLoading(false);
    }
  };

  const handleCharacterSelect = (id: string) => {
    setCharacterId(id);
    if (id) {
      const char = characters.find((c) => c.id === id);
      if (char) {
        setCharacterName(char.name);
      }
    } else {
      setCharacterName("");
    }
  };

  const startGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sex-game/start`,
        {
          characterName: characterName || "Your Partner",
          characterId: characterId || undefined,
          relationshipType: relationshipType || "partner",
          scenario:
            scenario ||
            `A passionate evening with ${characterName || "your partner"}`,
          intensity,
          generateImage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setSessionId(response.data.sessionId);
      setSessionInfo(response.data.session);
      setGame(response.data.game);
      setSetupMode(false);
      setPlaying(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  const makeChoice = async (choiceId: number) => {
    if (!sessionId || loading) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sex-game/act`,
        { sessionId, choiceIndex: choiceId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setGame(response.data.game);
      setSessionInfo(response.data.session);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to process choice");
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setSetupMode(true);
    setPlaying(false);
    setSessionId(null);
    setSessionInfo(null);
    setGame(null);
    setError(null);
    setClimaxFlash(false);
  };

  // ─── Helper to get phase label ────────────────────────────────────────

  const getPhaseConfig = (phase: GamePhase) =>
    PHASE_CONFIG[phase] || PHASE_CONFIG.FOREPLAY;

  // ─── Arousal Color ────────────────────────────────────────────────────

  const getArousalColor = (value: number) => {
    if (value >= 90) return "bg-yellow-400";
    if (value >= 70) return "bg-orange-500";
    if (value >= 50) return "bg-red-500";
    if (value >= 25) return "bg-pink-500";
    return "bg-pink-300";
  };

  const getStaminaColor = (value: number) => {
    if (value >= 70) return "bg-green-400";
    if (value >= 40) return "bg-yellow-400";
    return "bg-red-400";
  };

  // ─── Choice Intensity Badge ───────────────────────────────────────────

  const getIntensityBadge = (intensity: number) => {
    if (intensity >= 9) return { label: "🔥 Intense", color: "text-red-300" };
    if (intensity >= 7)
      return { label: "💫 Passionate", color: "text-orange-300" };
    if (intensity >= 5) return { label: "💋 Warm", color: "text-pink-300" };
    return { label: "🌿 Gentle", color: "text-green-300" };
  };

  // ─── Render Setup Screen ──────────────────────────────────────────────

  if (setupMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <nav className="bg-black/50 backdrop-blur border-b border-purple-500/20 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              🎮 Sex Game
            </h1>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Start a New Session
            </h2>
            <p className="text-gray-400 mb-8">
              Set up your intimate encounter. All content is unrestricted.
            </p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Character Selection */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Character (from your library)
                </label>
                <select
                  value={characterId}
                  onChange={(e) => handleCharacterSelect(e.target.value)}
                  className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition"
                >
                  <option value="">-- Custom (type name below) --</option>
                  {charactersLoading ? (
                    <option disabled>Loading...</option>
                  ) : (
                    characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{" "}
                        {c.description
                          ? `— ${c.description.substring(0, 40)}`
                          : ""}
                      </option>
                    ))
                  )}
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  {characters.length > 0
                    ? `${characters.length} character${characters.length > 1 ? "s" : ""} available`
                    : "No characters yet — create some on the Characters page"}
                </div>
              </div>

              {/* Character Name */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Partner&apos;s Name {characterId ? "(auto-filled)" : ""}
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Your Partner"
                  disabled={!!characterId}
                  className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition disabled:opacity-50"
                />
              </div>

              {/* Relationship Type */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Relationship
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition"
                >
                  <option value="partner">Partner</option>
                  <option value="spouse">Spouse</option>
                  <option value="lover">Lover</option>
                  <option value="friend">Friend</option>
                  <option value="stranger">Stranger</option>
                  <option value="boss">Boss</option>
                  <option value="masseuse">Masseuse</option>
                </select>
              </div>

              {/* Scenario */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Scenario (optional)
                </label>
                <textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="A romantic evening by the fireplace..."
                  rows={3}
                  className="w-full bg-gray-700/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition resize-none"
                />
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Intensity Level: {intensity}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>🌿 Gentle</span>
                  <span>🔥 Wild</span>
                </div>
              </div>

              {/* Generate Image Toggle */}
              <div className="flex items-center justify-between bg-gray-700/30 rounded-lg px-4 py-3">
                <div>
                  <label className="text-gray-300 text-sm font-medium">
                    🎨 Generate Scene Images
                  </label>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Creates AI images for each scene (takes 10-30s per image)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGenerateImage(!generateImage)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    generateImage ? "bg-purple-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      generateImage ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Start Button */}
              <button
                onClick={startGame}
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? "Starting..." : "💫 Begin Experience"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render Game Screen ───────────────────────────────────────────────

  if (!game) return null;

  const phaseCfg = getPhaseConfig(game.phase);
  const sessionOver = game.sessionComplete;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Climax Flash Overlay */}
      {climaxFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-300/20 via-orange-400/10 to-transparent" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center">
            <div className="text-7xl mb-4">✨💫✨</div>
            <div className="text-3xl font-bold text-yellow-300 drop-shadow-glow">
              CLIMAX!
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="bg-black/50 backdrop-blur border-b border-purple-500/20 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {sessionInfo?.characterImageUrl ? (
              <img
                src={sessionInfo.characterImageUrl}
                alt={sessionInfo.characterName}
                className="w-10 h-10 rounded-full object-cover border-2 border-purple-400/50"
              />
            ) : null}
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              🎮 Sex Game
            </h1>
            <span className="text-gray-500 text-sm">
              with {sessionInfo?.characterName}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition"
            >
              {showHistory ? "Hide History" : "Show History"}
            </button>
            <button
              onClick={resetGame}
              className="text-gray-400 hover:text-pink-400 text-sm px-3 py-1 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition"
            >
              New Game
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left Column: Stats ─────────────────────────────────── */}
          <div className="space-y-4">
            {/* Phase Card */}
            <div
              className={`bg-gradient-to-br ${phaseCfg.color} bg-opacity-20 rounded-xl p-5 border border-white/10`}
            >
              <div className="text-3xl mb-2">{phaseCfg.icon}</div>
              <div className="text-white font-bold text-lg">
                {phaseCfg.label}
              </div>
              <div className="text-white/60 text-sm">
                {phaseCfg.description}
              </div>
              {game.climaxCount > 0 && (
                <div className="mt-2 text-yellow-300 text-sm font-semibold">
                  ✨ Climaxes: {game.climaxCount}
                </div>
              )}
            </div>

            {/* Arousal Meter */}
            <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-pink-300 text-sm font-medium">
                  🔥 Arousal
                </span>
                <span className="text-white font-bold">{game.arousal}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${getArousalColor(game.arousal)}`}
                  style={{ width: `${game.arousal}%` }}
                />
              </div>
            </div>

            {/* Stamina Meter */}
            <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-300 text-sm font-medium">
                  ⚡ Stamina
                </span>
                <span className="text-white font-bold">{game.stamina}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${getStaminaColor(game.stamina)}`}
                  style={{ width: `${game.stamina}%` }}
                />
              </div>
            </div>

            {/* Round Counter */}
            <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-4 text-center">
              <span className="text-gray-400 text-sm">Round </span>
              <span className="text-white font-bold text-2xl">
                {game.round}
              </span>
            </div>
          </div>

          {/* ─── Middle & Right: Description + Choices ──────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Session Over Screen */}
            {sessionOver ? (
              <div className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">💕</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Session Complete
                </h2>
                <p className="text-gray-300 text-lg mb-6">
                  You shared{" "}
                  {game.climaxCount > 0
                    ? `${game.climaxCount} beautiful climax${game.climaxCount > 1 ? "es" : ""}`
                    : "an intimate moment"}{" "}
                  with {sessionInfo?.characterName}. The experience was deeply
                  satisfying.
                </p>
                <p className="text-gray-400 mb-8">
                  Total Rounds: {game.round} | Peak Arousal: 100%
                </p>
                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-xl transition transform hover:scale-105"
                >
                  🔄 Start New Session
                </button>
              </div>
            ) : (
              <>
                {/* Description Card */}
                <div
                  ref={descriptionRef}
                  className="bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-6 max-h-96 overflow-y-auto"
                >
                  {game.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-purple-500/20">
                      <img
                        src={game.imageUrl}
                        alt="Scene visualization"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}
                  <div className="text-gray-200 leading-relaxed whitespace-pre-line text-base md:text-lg">
                    {game.description}
                  </div>
                </div>

                {/* Loading indicator */}
                {loading && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-pulse text-purple-400">
                      Generating next scene...
                    </div>
                  </div>
                )}

                {/* Choices Grid */}
                {!loading && game.choices.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                      What do you do?
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {game.choices.map((choice) => {
                        const badge = getIntensityBadge(choice.intensity);
                        return (
                          <button
                            key={choice.id}
                            onClick={() => makeChoice(choice.id)}
                            disabled={loading}
                            className="group text-left bg-gray-800/70 hover:bg-purple-700/40 border border-purple-500/20 hover:border-purple-400/40 rounded-xl p-4 transition-all duration-200 disabled:opacity-50"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-white group-hover:text-purple-200 transition flex-1">
                                {choice.text}
                              </span>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span
                                  className={`text-xs font-medium ${badge.color}`}
                                >
                                  {badge.label}
                                </span>
                                <div className="flex gap-2 text-xs text-gray-500">
                                  <span>+{choice.arousalGain}🔥</span>
                                  <span>-{choice.staminaCost}⚡</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ─── History Log ──────────────────────────────────────────── */}
        {showHistory && (
          <div className="mt-8 bg-gray-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">
              📜 Session History
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {game.round === 0 ? (
                <div className="text-gray-500 text-sm">
                  No actions yet. Make your first choice!
                </div>
              ) : (
                Array.from({ length: game.round }, (_, i) => i + 1).map((r) => {
                  // We don't have per-round history on frontend,
                  // show a summary
                  return (
                    <div
                      key={r}
                      className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/20"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300 font-medium">
                          Round {r}
                        </span>
                        {r === game.round && (
                          <span className="text-green-400 text-xs">
                            ← Current
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
