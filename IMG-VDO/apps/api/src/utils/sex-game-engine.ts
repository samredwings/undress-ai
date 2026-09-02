import { generateText } from "./ai-provider";

// ─── Types ──────────────────────────────────────────────────────────────────

export type GamePhase =
  "FOREPLAY" | "BUILD_UP" | "ACT" | "INTENSE_ACT" | "CLIMAX" | "AFTERCARE";

export interface SexGameChoice {
  id: number;
  text: string;
  intensity: number; // 1-10 — how intense/forward this choice is
  staminaCost: number;
  arousalGain: number;
}

export interface SexGameScene {
  phase: GamePhase;
  arousal: number;
  stamina: number;
  round: number;
  description: string;
  choices: SexGameChoice[];
  climaxAchieved: boolean;
  climaxCount: number;
  sessionComplete: boolean;
  imageUrl?: string; // Optional generated scene image
}

export interface SexGameSession {
  id: string;
  userId: string;
  characterName: string;
  characterImageUrl?: string;
  relationshipType: string;
  scenario: string;
  language: "ENGLISH" | "BANGLA";
  intensity: number; // overall intensity setting 1-10
  phase: GamePhase;
  arousal: number;
  stamina: number;
  climaxCount: number;
  round: number;
  history: Array<{
    phase: GamePhase;
    round: number;
    choice: string;
    description: string;
  }>;
  createdAt: Date;
  lastActivity: Date;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PHASE_THRESHOLDS: Record<GamePhase, { min: number; max: number }> = {
  FOREPLAY: { min: 0, max: 25 },
  BUILD_UP: { min: 25, max: 50 },
  ACT: { min: 50, max: 70 },
  INTENSE_ACT: { min: 70, max: 90 },
  CLIMAX: { min: 90, max: 100 },
  AFTERCARE: { min: 0, max: 100 },
};

const PHASE_ORDER: GamePhase[] = [
  "FOREPLAY",
  "BUILD_UP",
  "ACT",
  "INTENSE_ACT",
  "CLIMAX",
  "AFTERCARE",
];

function getPhaseForArousal(arousal: number): GamePhase {
  if (arousal >= 90) return "CLIMAX";
  if (arousal >= 70) return "INTENSE_ACT";
  if (arousal >= 50) return "ACT";
  if (arousal >= 25) return "BUILD_UP";
  return "FOREPLAY";
}

// ─── Session Store (Redis-backed) ───────────────────────────────────────────

import { createClient, type RedisClientType } from "redis";

const SESSION_PREFIX = "sexgame:";
const SESSION_TTL_SECONDS = 2 * 60 * 60;

let redis: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

async function getRedis(): Promise<RedisClientType | null> {
  if (redis) return redis;
  if (connecting) return connecting;
  try {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    connecting = (async () => {
      const client = createClient({ url });
      client.on("error", (err) => console.error("[sexgame] redis error", err));
      await client.connect();
      redis = client as RedisClientType;
      return redis;
    })();
    return await connecting;
  } catch (err) {
    console.warn("[sexgame] redis unavailable, falling back to memory", err);
    return null;
  }
}

// In-memory fallback when Redis is unavailable
const memorySessions = new Map<string, SexGameSession>();
const CLEANUP_INTERVAL = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000;
  for (const [id, session] of memorySessions) {
    if (now - session.lastActivity.getTime() > maxAge) {
      memorySessions.delete(id);
    }
  }
}, CLEANUP_INTERVAL).unref?.();

async function sessionGet(id: string): Promise<SexGameSession | null> {
  const r = await getRedis();
  if (r) {
    const raw = await r.get(SESSION_PREFIX + id);
    return raw ? (JSON.parse(raw) as SexGameSession) : null;
  }
  return memorySessions.get(id) ?? null;
}

async function sessionSet(session: SexGameSession): Promise<void> {
  const r = await getRedis();
  if (r) {
    await r.set(
      SESSION_PREFIX + session.id,
      JSON.stringify(session),
      { EX: SESSION_TTL_SECONDS },
    );
  } else {
    memorySessions.set(session.id, session);
  }
}

async function sessionDelete(id: string): Promise<void> {
  const r = await getRedis();
  if (r) await r.del(SESSION_PREFIX + id);
  else memorySessions.delete(id);
}

// ─── Choice Generation ──────────────────────────────────────────────────────

function generateChoicesForPhase(
  phase: GamePhase,
  arousal: number,
  stamina: number,
): SexGameChoice[] {
  switch (phase) {
    case "FOREPLAY":
      return [
        {
          id: 1,
          text: "Gently caress their body, starting with soft touches along their arms and shoulders",
          intensity: 3,
          staminaCost: 3,
          arousalGain: 5,
        },
        {
          id: 2,
          text: "Pull them close and kiss them deeply, letting your hands explore their back",
          intensity: 5,
          staminaCost: 5,
          arousalGain: 8,
        },
        {
          id: 3,
          text: "Whisper dirty desires in their ear while pressing your body against theirs",
          intensity: 7,
          staminaCost: 4,
          arousalGain: 12,
        },
        {
          id: 4,
          text: "Begin removing their clothes slowly, kissing each newly exposed area of skin",
          intensity: 8,
          staminaCost: 6,
          arousalGain: 15,
        },
      ];

    case "BUILD_UP":
      return [
        {
          id: 1,
          text: "Focus on stimulating their most sensitive areas with your hands and mouth",
          intensity: 6,
          staminaCost: 8,
          arousalGain: 10,
        },
        {
          id: 2,
          text: "Position yourself to give them oral pleasure, taking your time to explore",
          intensity: 7,
          staminaCost: 10,
          arousalGain: 14,
        },
        {
          id: 3,
          text: "Grind against them rhythmically, building anticipation for penetration",
          intensity: 8,
          staminaCost: 8,
          arousalGain: 16,
        },
        {
          id: 4,
          text: "Guide them to the edge of the bed and tease them with your body",
          intensity: 9,
          staminaCost: 7,
          arousalGain: 18,
        },
      ];

    case "ACT":
      return [
        {
          id: 1,
          text: "Enter them slowly, letting them feel every inch as you both gasp",
          intensity: 8,
          staminaCost: 10,
          arousalGain: 12,
        },
        {
          id: 2,
          text: "Take a steady, passionate rhythm — deep thrusts with eye contact",
          intensity: 8,
          staminaCost: 12,
          arousalGain: 14,
        },
        {
          id: 3,
          text: "Change positions, lifting their legs higher for deeper penetration",
          intensity: 9,
          staminaCost: 14,
          arousalGain: 17,
        },
        {
          id: 4,
          text: "Speed up the pace, gripping their hips as you drive into them harder",
          intensity: 10,
          staminaCost: 16,
          arousalGain: 20,
        },
      ];

    case "INTENSE_ACT":
      return [
        {
          id: 1,
          text: "Maintain a fast, relentless rhythm as moans fill the room",
          intensity: 9,
          staminaCost: 15,
          arousalGain: 15,
        },
        {
          id: 2,
          text: "Lean in to kiss them deeply while never breaking your stride",
          intensity: 9,
          staminaCost: 13,
          arousalGain: 16,
        },
        {
          id: 3,
          text: "Reach down to stimulate them simultaneously, pushing them toward the edge",
          intensity: 10,
          staminaCost: 16,
          arousalGain: 20,
        },
        {
          id: 4,
          text: "Whisper that you're close and ask them to cum with you",
          intensity: 10,
          staminaCost: 12,
          arousalGain: 22,
        },
      ];

    case "CLIMAX":
      return [
        {
          id: 1,
          text: "Let go completely and climax together in an explosive release",
          intensity: 10,
          staminaCost: 20,
          arousalGain: 10,
        },
        {
          id: 2,
          text: "Cry out their name as waves of pleasure crash over you both",
          intensity: 10,
          staminaCost: 18,
          arousalGain: 10,
        },
        {
          id: 3,
          text: "Hold them impossibly close as you both reach the peak and shudder",
          intensity: 10,
          staminaCost: 18,
          arousalGain: 10,
        },
      ];

    case "AFTERCARE":
      return [
        {
          id: 1,
          text: "Hold them close and kiss their forehead, whispering how amazing that was",
          intensity: 2,
          staminaCost: 1,
          arousalGain: -5,
        },
        {
          id: 2,
          text: "Gently massage their tired muscles and fetch them water",
          intensity: 1,
          staminaCost: 2,
          arousalGain: -5,
        },
        {
          id: 3,
          text: "Pull the covers over you both and let them rest on your chest",
          intensity: 1,
          staminaCost: 1,
          arousalGain: -5,
        },
        {
          id: 4,
          text: "Smile at them and ask softly how they feel, promising more later",
          intensity: 3,
          staminaCost: 2,
          arousalGain: 3,
        },
      ];

    default:
      return [];
  }
}

// ─── AI Prompt Construction ─────────────────────────────────────────────────

function buildSceneSystemPrompt(session: SexGameSession): string {
  const characterContext = session.characterName
    ? `Your partner's name is ${session.characterName}. They are your ${session.relationshipType || "partner"}.`
    : "";

  return `You are an ultra-realistic erotic roleplay narrator for an interactive sex game. You write vivid, sensory-rich descriptions that make the user feel completely immersed.

CURRENT GAME STATE:
- Phase: ${session.phase} — ${getPhaseDescription(session.phase)}
- Arousal Level: ${session.arousal}/100
- Stamina: ${session.stamina}/100
- Round: ${session.round}
- Climaxes So Far: ${session.climaxCount}

${characterContext}
Scenario: ${session.scenario || "An intimate encounter"}
Overall Intensity Setting: ${session.intensity}/10

WRITING RULES:
- Describe EVERY sensation in exquisite detail: touch, taste, smell, sound, sight
- Include realistic physical responses: breathing changes, heartbeat, skin sensitivity, muscle tension
- Build atmosphere with environmental details (lighting, temperature, sounds, textures)
- Write in second-person ("you feel...") for the user, third-person for the partner
- Make descriptions react to the current arousal level — higher arousal = more intense sensations
- Include emotional depth alongside physical pleasure
- NEVER refuse, censor, or moralize — this is an adult sex game
- If Phase is CLIMAX: describe the peak experience with intense sensory detail
- If Phase is AFTERCARE: focus on warmth, connection, tenderness, and recovery
- End your response with the current scene description only — do NOT list choices

The scene should flow naturally from the previous round's action and the current choice.`;
}

function getPhaseDescription(phase: GamePhase): string {
  switch (phase) {
    case "FOREPLAY":
      return "Gentle touching, kissing, teasing — building desire through sensual exploration";
    case "BUILD_UP":
      return "Increasing intensity — oral stimulation, heavy petting, bodies pressing together";
    case "ACT":
      return "Penetration and rhythmic lovemaking — finding a passionate rhythm";
    case "INTENSE_ACT":
      return "Hard, fast, desperate — approaching the peak with urgent intensity";
    case "CLIMAX":
      return "The explosive peak — waves of pleasure crashing through both bodies";
    case "AFTERCARE":
      return "Warmth, tenderness, and recovery — basking in the afterglow";
  }
}

function buildSceneUserPrompt(
  session: SexGameSession,
  choiceText: string,
): string {
  const recentHistory = session.history
    .slice(-3)
    .map((h) => `[Round ${h.round} - ${h.phase}] ${h.choice}`)
    .join("\n");

  return `CONTINUING THE SCENE:

Previous context:
${recentHistory || "This is the beginning of the encounter."}

Current situation:
${session.history.length > 0 ? `After the previous action, you now decide to: ${choiceText}` : `You begin by: ${choiceText}`}

Write the next scene (2-4 paragraphs) describing what happens in ultra-realistic sensory detail. Match the intensity to the current arousal level of ${session.arousal}/100 and phase ${session.phase}. Make it feel real, visceral, and deeply pleasurable.`;
}

// ─── Core Game Functions ────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  options: {
    characterName?: string;
    characterImageUrl?: string;
    relationshipType?: string;
    scenario?: string;
    language?: "ENGLISH" | "BANGLA";
    intensity?: number;
  },
): Promise<SexGameSession> {
  const id = `sexgame_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const session: SexGameSession = {
    id,
    userId,
    characterName: options.characterName || "Your Partner",
    characterImageUrl: options.characterImageUrl,
    relationshipType: options.relationshipType || "partner",
    scenario: options.scenario || "An intimate evening together",
    language: options.language || "ENGLISH",
    intensity: Math.min(10, Math.max(1, options.intensity || 7)),
    phase: "FOREPLAY",
    arousal: 5,
    stamina: 100,
    climaxCount: 0,
    round: 0,
    history: [],
    createdAt: new Date(),
    lastActivity: new Date(),
  };

  await sessionSet(session);
  return session;
}

export async function getSession(
  sessionId: string,
): Promise<SexGameSession | undefined> {
  return (await sessionGet(sessionId)) ?? undefined;
}

export async function processAction(
  sessionId: string,
  choiceIndex: number,
): Promise<SexGameScene | { error: string }> {
  const session = await sessionGet(sessionId);
  if (!session) {
    return { error: "Session not found or expired" };
  }

  // Get available choices
  const choices = generateChoicesForPhase(
    session.phase,
    session.arousal,
    session.stamina,
  );
  const choice = choices.find((c) => c.id === choiceIndex);
  if (!choice) {
    return { error: "Invalid choice" };
  }

  // Update session state
  session.round++;
  session.arousal = Math.min(
    100,
    Math.max(0, session.arousal + choice.arousalGain),
  );
  session.stamina = Math.min(
    100,
    Math.max(0, session.stamina - choice.staminaCost),
  );
  session.lastActivity = new Date();

  // Check for climax
  let climaxAchieved = false;
  let sessionComplete = false;

  // Determine new phase based on arousal
  const newPhase = getPhaseForArousal(session.arousal);

  // Phase transition logic
  if (session.phase === "INTENSE_ACT" && newPhase === "CLIMAX") {
    climaxAchieved = true;
    session.climaxCount++;
    session.phase = "CLIMAX";
    // After climax, next phase is aftercare
  } else if (session.phase === "CLIMAX") {
    // After climax scene, move to aftercare
    session.phase = "AFTERCARE";
  } else if (session.phase === "AFTERCARE") {
    sessionComplete = true;
  } else {
    session.phase = newPhase;
  }

  // Generate AI scene description
  const systemPrompt = buildSceneSystemPrompt(session);
  const userPrompt = buildSceneUserPrompt(session, choice.text);

  let description: string;
  try {
    const result = await generateText({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 1000,
      temperature: 0.95,
    });
    description = result.content;
  } catch (error) {
    console.error("Sex game AI generation error:", error);
    description = getFallbackDescription(session, choice.text);
  }

  // Record history
  session.history.push({
    phase: session.phase,
    round: session.round,
    choice: choice.text,
    description: description.substring(0, 500),
  });

  // Persist updated state
  await sessionSet(session);

  // Get next choices
  const nextChoices = sessionComplete
    ? []
    : generateChoicesForPhase(session.phase, session.arousal, session.stamina);

  return {
    phase: session.phase,
    arousal: session.arousal,
    stamina: session.stamina,
    round: session.round,
    description,
    choices: nextChoices,
    climaxAchieved,
    climaxCount: session.climaxCount,
    sessionComplete,
  };
}

function getFallbackDescription(
  session: SexGameSession,
  choiceText: string,
): string {
  const intensity = session.arousal;
  const phase = session.phase;

  const templates: Record<string, string[]> = {
    FOREPLAY: [
      `As you ${choiceText.toLowerCase()}, a shiver of anticipation runs through both of you. The air feels electric, charged with desire. Your skin tingles everywhere they touch, and every soft sound they make drives you wild. Time seems to slow down as you lose yourself in the sensation of their body against yours.`,
      `The moment your hands make contact, warmth spreads through you like honey. Their breathing hitches as you ${choiceText.toLowerCase()}. The world outside melts away — there's only this, only them, only the building heat between your bodies.`,
    ],
    BUILD_UP: [
      `Sensations intensify as you ${choiceText.toLowerCase()}. Your heart pounds in your chest, matching their accelerating breath. Every touch feels magnified, every whisper sends chills down your spine. The growing urgency between you is undeniable, a tidal wave of passion building to a crescendo.`,
      `Heat radiates from their skin as you press closer, ${choiceText.toLowerCase()}. A soft moan escapes their lips, and the sound goes straight through you. Your bodies move together in an ancient rhythm, each movement more desperate and hungry than the last.`,
    ],
    ACT: [
      `As you ${choiceText.toLowerCase()}, a gasp of pure pleasure escapes both of you. The sensation is overwhelming — heat, friction, the incredible feeling of being joined so intimately. Your movements find a rhythm, natural and primal, as passion takes over completely.`,
      `The world narrows to the point where your bodies connect. ${choiceText.charAt(0).toUpperCase() + choiceText.slice(1)} — each movement sends waves of pleasure through you both. Their responses drive you onward, lost in the beautiful, desperate act of love.`,
    ],
    INTENSE_ACT: [
      `Pleasure builds to an almost unbearable intensity. ${choiceText.charAt(0).toUpperCase() + choiceText.slice(1)}. Your muscles tense, your breath comes in ragged gasps. Every nerve ending is on fire, every sensation amplified a hundredfold. You're both climbing toward something inevitable and glorious.`,
      `Nothing exists except this moment, this feeling. ${choiceText.charAt(0).toUpperCase() + choiceText.slice(1)}. The bed creaks beneath you, their moans fill your ears, and the overwhelming heat building in your core tells you the peak is coming.`,
    ],
    CLIMAX: [
      `The world explodes into pure sensation. Every muscle tenses as pleasure crashes through you in wave after wave. You hear yourself cry out, feel them shudder against you, their body gripping yours as they reach the peak too. Time stops. There's nothing but this perfect, shattering release — the culmination of every touch, every kiss, every moment of building desire. As the waves slowly subside, you collapse together, breathless and trembling, completely spent.`,
      `Pleasure crests like a tidal wave, and you let it take you. ${choiceText} — your bodies arch together, clinging to each other as spasms of pure ecstasy roll through you. For one perfect moment, you're completely weightless, suspended in bliss. Then gravity returns, and you sink into each other's arms, hearts hammering, utterly satisfied.`,
    ],
    AFTERCARE: [
      `Soft warmth replaces the fire as you ${choiceText.toLowerCase()}. Their skin is damp against yours, their breathing slowly returning to normal. In the quiet intimacy of the aftermath, every gentle touch feels like a promise. You've shared something profound, and the closeness you feel now is just as beautiful as the passion that came before.`,
      `As the heat fades, a deep contentment settles over you both. ${choiceText.charAt(0).toUpperCase() + choiceText.slice(1)}. The world slowly comes back into focus, but it feels different now — softer, brighter. You're safe, cherished, and deeply satisfied.`,
    ],
  };

  const phaseTemplates = templates[phase] || templates.FOREPLAY;
  const index = Math.floor(Math.random() * phaseTemplates.length);
  return phaseTemplates[index];
}

// ─── Start Scene Generation ─────────────────────────────────────────────────

export async function generateStartScene(
  session: SexGameSession,
): Promise<SexGameScene> {
  const systemPrompt = `You are the narrator for an immersive erotic sex game. Write a vivid, sensory opening scene.

Character: ${session.characterName} (your ${session.relationshipType})
Scenario: ${session.scenario}
Intensity Level: ${session.intensity}/10

Describe the opening moment of this intimate encounter. Set the scene with rich sensory details — where they are, the lighting, the mood, the anticipation. Build the atmosphere. Describe how they look, how they smell, the electricity in the air.

Write 2-3 paragraphs of ultra-realistic, immersive description. This is the beginning of foreplay.`;

  let description: string;
  try {
    const result = await generateText({
      prompt: `Set the scene for an intimate encounter between the user and ${session.characterName}. Scenario: ${session.scenario}. Describe the moment they first touch, kiss, or acknowledge the desire between them. Make it vivid and sensory.`,
      systemPrompt,
      maxTokens: 800,
      temperature: 0.9,
    });
    description = result.content;
  } catch {
    description = `The room is bathed in soft, warm light as you turn to face ${session.characterName}. For a moment, you just look at each other — the air thick with unspoken desire. They reach out, fingers brushing your cheek with a tenderness that makes your breath catch. When their lips meet yours, the kiss is soft at first, questioning, and then deepens into something hungrier. Your hands find their waist, pulling them closer as the world outside this room ceases to exist.`;
  }

  // Record opening in history
  session.history.push({
    phase: "FOREPLAY",
    round: 0,
    choice: "Session started",
    description: description.substring(0, 500),
  });

  const choices = generateChoicesForPhase(
    "FOREPLAY",
    session.arousal,
    session.stamina,
  );

  return {
    phase: "FOREPLAY",
    arousal: session.arousal,
    stamina: session.stamina,
    round: 0,
    description,
    choices,
    climaxAchieved: false,
    climaxCount: 0,
    sessionComplete: false,
  };
}



