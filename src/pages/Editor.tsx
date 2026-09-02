import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { OutfitDetection } from "@/convex/detect";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  LogOut,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WARDROBE,
  buildWardrobePrompt,
  buildCustomPrompt,
  type WardrobeItem,
} from "@/lib/wardrobe";

type Detection = OutfitDetection | null;
type CustomItem = Doc<"wardrobe_items"> & { imageUrl: string | null };
type WardrobeTab = "full" | "top" | "bottom" | "custom";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: number;
}

interface GarmentSelection {
  storageId: Id<"_storage">;
  name: string;
  previewUrl: string;
}

async function uploadFileToStorage(
  file: File,
  generateUploadUrl: () => Promise<string>,
): Promise<Id<"_storage">> {
  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  const { storageId } = (await response.json()) as { storageId: string };
  return storageId as Id<"_storage">;
}

/** Small animated typing indicator, like real AI chat apps. */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground">
        <Wand2 className="size-3.5 text-background" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
        <span
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm">
      {children}
    </span>
  );
}

export default function Editor() {
  const { projectId } = useParams<{ projectId: Id<"projects"> }>();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const project = useQuery(
    api.projects.get,
    projectId ? { projectId } : "skip",
  );
  const generations = useQuery(
    api.generations.listByProject,
    projectId ? { projectId } : "skip",
  );
  const customItems = useQuery(api.wardrobe.listCustom);

  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const createGeneration = useMutation(api.generations.create);
  const generateOutfit = useAction(api.generate.generateOutfit);
  const detectOutfit = useAction(api.detect.detectOutfit);
  const addCustom = useMutation(api.wardrobe.addCustom);
  const removeCustom = useMutation(api.wardrobe.removeCustom);

  // ── Wardrobe studio state ─────────────────────────────────────
  const [tab, setTab] = useState<WardrobeTab>("full");
  const [detection, setDetection] = useState<Detection>(null);
  const [detecting, setDetecting] = useState(true);
  const [activeResult, setActiveResult] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // ── Chat state (secondary) ────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [garmentImage, setGarmentImage] = useState<GarmentSelection | null>(
    null,
  );
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, generatingId, chatOpen, scrollToBottom]);

  // Auto-detect the subject's current outfit on load
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setDetecting(true);
    detectOutfit({ projectId })
      .then((res) => {
        if (!cancelled) setDetection(res);
      })
      .catch(() => {
        if (!cancelled) setDetection(null);
      })
      .finally(() => {
        if (!cancelled) setDetecting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, detectOutfit]);

  const similarItems = useMemo(() => {
    if (!detection?.style) return [];
    const style = detection.style.toLowerCase();
    return WARDROBE.filter((item) =>
      item.styles.some((tag) => style.includes(tag)),
    ).slice(0, 8);
  }, [detection]);

  const visibleItems = useMemo(() => {
    if (tab === "custom") return [];
    return WARDROBE.filter((item) => item.category === tab);
  }, [tab]);

  // ── Generation ────────────────────────────────────────────────
  const runGeneration = useCallback(
    async (opts: {
      promptText: string;
      garmentImageStorageId?: Id<"_storage">;
      marker: string;
    }): Promise<string | null> => {
      if (!projectId || generatingId !== null) return null;
      setGenError(null);
      setGeneratingId(opts.marker);
      try {
        const generationId = await createGeneration({
          projectId,
          prompt: opts.promptText,
          ...(opts.garmentImageStorageId && {
            garmentImageStorageId: opts.garmentImageStorageId,
          }),
        });
        const result = await generateOutfit({
          generationId,
          projectId,
          prompt: opts.promptText,
        });
        if (result.imageUrl) setActiveResult(result.imageUrl);
        return result.imageUrl ?? null;
      } finally {
        setGeneratingId(null);
      }
    },
    [projectId, generatingId, createGeneration, generateOutfit],
  );

  const tryWardrobe = useCallback(
    async (item: WardrobeItem) => {
      try {
        await runGeneration({
          promptText: buildWardrobePrompt(item, detection),
          marker: item.id,
        });
      } catch (error) {
        setGenError(
          error instanceof Error ? error.message : "Generation failed",
        );
      }
    },
    [runGeneration, detection],
  );

  const tryCustom = useCallback(
    async (item: CustomItem) => {
      try {
        await runGeneration({
          promptText: buildCustomPrompt(item.name),
          garmentImageStorageId: item.imageStorageId,
          marker: `custom:${item._id}`,
        });
      } catch (error) {
        setGenError(
          error instanceof Error ? error.message : "Generation failed",
        );
      }
    },
    [runGeneration],
  );

  // ── Chat ─────────────────────────────────────────────────────
  const handleGarmentFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      try {
        const storageId = await uploadFileToStorage(file, generateUploadUrl);
        setGarmentImage({
          storageId,
          name: file.name,
          previewUrl: URL.createObjectURL(file),
        });
      } catch (err) {
        console.error("Garment upload failed:", err);
      }
    },
    [generateUploadUrl],
  );

  const handleGarmentUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleGarmentFile(file);
      e.target.value = "";
    },
    [handleGarmentFile],
  );

  const removeGarment = useCallback(() => {
    if (garmentImage) URL.revokeObjectURL(garmentImage.previewUrl);
    setGarmentImage(null);
  }, [garmentImage]);

  const handleChatSend = useCallback(async () => {
    const text = prompt.trim();
    if (!text || !projectId || generatingId !== null) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      },
    ]);
    setPrompt("");
    setGarmentImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });

    try {
      const imageUrl = await runGeneration({
        promptText: text,
        garmentImageStorageId: garmentImage?.storageId,
        marker: "chat",
      });
      if (imageUrl) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "Here's your outfit change. Want to adjust anything?",
            imageUrl,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Generation returned no image. Please try again.",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Something went wrong: ${
            error instanceof Error ? error.message : "Please try again"
          }`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [prompt, projectId, generatingId, runGeneration, garmentImage]);

  // ── Custom attire ────────────────────────────────────────────
  const handleCustomUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const storageId = await uploadFileToStorage(file, generateUploadUrl);
        const name =
          file.name.replace(/\.[^.]+$/, "").trim() || "Custom attire";
        await addCustom({ name, category: "full", imageStorageId: storageId });
      } catch (err) {
        setGenError(
          err instanceof Error
            ? `Could not add attire: ${err.message}`
            : "Could not add attire. Please try again.",
        );
      }
      e.target.value = "";
    },
    [generateUploadUrl, addCustom],
  );

  const handleDeleteCustom = useCallback(
    async (item: CustomItem) => {
      if (confirm(`Remove "${item.name}" from your wardrobe?`)) {
        await removeCustom({ itemId: item._id });
      }
    },
    [removeCustom],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (project === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-muted-foreground">Project not found</p>
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const currentImage = activeResult ?? project.originalImageUrl ?? undefined;
  const completedGenerations =
    generations?.filter((g) => g.status === "completed" && g.resultImageUrl) ??
    [];

  return (
    <div className="relative flex h-dvh flex-col bg-background text-foreground">
      {/* Header */}
      <nav className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-3 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 cursor-pointer"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground">
              <Wand2 className="size-3.5 text-background" />
            </div>
            <span className="truncate text-sm font-semibold tracking-tight">
              {project.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 cursor-pointer text-muted-foreground"
            onClick={() => setChatOpen((v) => !v)}
            aria-label="Toggle chat editor"
          >
            <MessageCircle className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 cursor-pointer text-muted-foreground"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </nav>

      {/* Photo */}
      <section className="shrink-0 border-b border-border/50 bg-muted/10">
        <div className="relative flex h-[34dvh] items-center justify-center bg-muted/30 md:h-[38dvh]">
          <img
            src={currentImage}
            alt={activeResult ? "Generated outfit" : project.title}
            className="size-full object-contain"
          />

          {/* Outfit detection chips */}
          <div className="absolute left-2 right-2 top-2 flex flex-wrap items-center gap-1.5 sm:left-3 sm:top-3">
            {detecting ? (
              <Chip>
                <span className="size-1.5 animate-pulse rounded-full bg-foreground" />
                Detecting outfit…
              </Chip>
            ) : detection ? (
              <>
                {detection.top && <Chip>Top: {detection.top}</Chip>}
                {detection.bottom && <Chip>Bottom: {detection.bottom}</Chip>}
                {detection.style && <Chip>Style: {detection.style}</Chip>}
                {detection.colors.length > 0 && (
                  <Chip>Colors: {detection.colors.join(", ")}</Chip>
                )}
              </>
            ) : (
              <Chip>No outfit detected</Chip>
            )}
          </div>

          {/* Actions */}
          <div className="absolute right-2 top-2 flex gap-2 sm:right-3 sm:top-3">
            {activeResult && (
              <Button
                variant="secondary"
                size="sm"
                className="h-9 cursor-pointer gap-2 bg-background/85 px-3 backdrop-blur-sm"
                onClick={() => setActiveResult(null)}
              >
                <ImageIcon className="size-3.5" />
                Original
              </Button>
            )}
            {currentImage && (
              <Button
                variant="secondary"
                size="sm"
                className="h-9 cursor-pointer gap-2 bg-background/85 px-3 backdrop-blur-sm"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = currentImage;
                  a.download = `outfit-${Date.now()}.png`;
                  a.click();
                }}
              >
                Save
              </Button>
            )}
          </div>

          {/* Generation history strip */}
          {(completedGenerations.length > 0 || activeResult) && (
            <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 overflow-x-auto pb-1 sm:bottom-3 sm:left-3 sm:right-3">
              <button
                className={`flex size-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 bg-background/70 backdrop-blur-sm transition-all ${
                  !activeResult
                    ? "border-foreground"
                    : "border-transparent hover:border-border"
                }`}
                onClick={() => setActiveResult(null)}
                aria-label="Show original photo"
              >
                <img
                  src={project.originalImageUrl ?? undefined}
                  alt="Original"
                  className="size-full object-cover"
                />
              </button>
              {completedGenerations.map((gen) => (
                <button
                  key={gen._id}
                  className={`flex size-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 bg-background/70 backdrop-blur-sm transition-all ${
                    activeResult === gen.resultImageUrl
                      ? "border-foreground"
                      : "border-transparent hover:border-border"
                  }`}
                  onClick={() => setActiveResult(gen.resultImageUrl!)}
                  aria-label={`Generation: ${gen.prompt}`}
                >
                  <img
                    src={gen.resultImageUrl ?? undefined}
                    alt={gen.prompt}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Wardrobe */}
      <section className="flex min-h-0 flex-1 flex-col">
        {genError && (
          <div className="mx-4 mt-3 flex items-start justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <span className="leading-relaxed">{genError}</span>
            <button
              className="cursor-pointer text-destructive/70 hover:text-destructive"
              onClick={() => setGenError(null)}
              aria-label="Dismiss error"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Similar picks */}
        {similarItems.length > 0 && (
          <div className="shrink-0 px-4 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Similar to your look
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {similarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => tryWardrobe(item)}
                  disabled={generatingId !== null}
                  className="group w-20 shrink-0 cursor-pointer text-left disabled:cursor-default"
                >
                  <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-border/50 bg-muted text-2xl transition-colors group-hover:border-border group-active:bg-muted/60">
                    {generatingId === item.id ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      item.emoji
                    )}
                  </div>
                  <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground">
                    {item.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="shrink-0 px-4 pb-1 pt-3">
          <div className="flex w-full gap-1 rounded-full bg-muted p-1">
            {(
              [
                ["full", "Trending"],
                ["top", "Tops"],
                ["bottom", "Bottoms"],
                ["custom", "Custom"],
              ] as [WardrobeTab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-3 lg:grid-cols-4">
            {tab === "custom" ? (
              <>
                {/* Add custom attire */}
                <button
                  onClick={() => customInputRef.current?.click()}
                  disabled={generatingId !== null}
                  className="group flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 text-center transition-colors hover:border-border hover:bg-muted/40 disabled:cursor-default"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
                    <Plus className="size-4" />
                  </div>
                  <p className="px-2 text-[10px] font-medium text-muted-foreground">
                    Add custom attire
                  </p>
                </button>
                <input
                  ref={customInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomUpload}
                />

                {customItems?.map((item) => (
                  <div key={item._id} className="relative">
                    <button
                      onClick={() => tryCustom(item)}
                      disabled={generatingId !== null}
                      className="group block w-full cursor-pointer text-left disabled:cursor-default"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border/50 bg-muted">
                        <img
                          src={item.imageUrl ?? undefined}
                          alt={item.name}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        {generatingId === `custom:${item._id}` && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                            <Loader2 className="size-5 animate-spin text-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 truncate text-xs font-medium">
                        {item.name}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 size-7 cursor-pointer bg-background/80 text-destructive backdrop-blur-sm hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustom(item);
                      }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {customItems && customItems.length === 0 && (
                  <p className="col-span-full py-6 text-center text-xs text-muted-foreground">
                    No custom attire yet — add a garment photo above to build
                    your personal wardrobe.
                  </p>
                )}
              </>
            ) : (
              visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => tryWardrobe(item)}
                  disabled={generatingId !== null}
                  className="group cursor-pointer text-left disabled:cursor-default"
                >
                  <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-border/50 bg-muted text-3xl transition-all group-hover:border-border group-hover:bg-muted/60 group-active:scale-[0.98]">
                    {generatingId === item.id ? (
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    ) : (
                      item.emoji
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-xs font-medium">
                    {item.name}
                  </p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </section>

      {/* Chat overlay (optional, secondary feature) */}
      {chatOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 sm:bg-black/10"
            onClick={() => setChatOpen(false)}
          />
          <div className="relative flex h-full w-full flex-col border-l border-border/50 bg-background shadow-2xl sm:w-96">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/50 px-4">
              <span className="text-sm font-semibold">Chat editor</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 cursor-pointer text-muted-foreground"
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
              >
                <X className="size-4" />
              </Button>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-4 px-4 py-4">
                {messages.length === 0 && generatingId !== "chat" && (
                  <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
                    <p className="text-sm font-medium">Edit by chat</p>
                    <p className="max-w-[220px] text-xs text-muted-foreground">
                      Type a free-form request, e.g. "make the outfit all
                      black".
                    </p>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex w-full gap-2 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground">
                          <Wand2 className="size-3.5 text-background" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] ${
                          msg.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "rounded-br-sm bg-foreground text-background"
                              : "rounded-tl-sm bg-muted text-foreground"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.imageUrl && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                            <img
                              src={msg.imageUrl}
                              alt="Generated result"
                              className="max-h-72 w-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {generatingId === "chat" && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat input */}
            <div className="shrink-0 border-t border-border/50 bg-background/80 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
              {garmentImage && (
                <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/40 px-2.5 py-2">
                  <img
                    src={garmentImage.previewUrl}
                    alt="Garment reference"
                    className="size-9 shrink-0 rounded-lg border border-border/50 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Garment reference</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {garmentImage.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 cursor-pointer text-muted-foreground"
                    onClick={removeGarment}
                    aria-label="Remove garment"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-end gap-1.5 rounded-2xl border border-border/60 bg-muted/30 p-1.5 transition-colors focus-within:border-border">
                <input
                  ref={garmentInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGarmentUpload}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 cursor-pointer text-muted-foreground"
                  onClick={() => garmentInputRef.current?.click()}
                  title="Attach a garment photo as a style reference"
                  aria-label="Attach garment photo"
                >
                  <Paperclip className="size-4" />
                </Button>
                <Textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type your message…"
                  className="min-h-9 max-h-32 resize-none border-none bg-transparent px-2 py-2 text-base shadow-none focus-visible:ring-0 md:text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="size-9 shrink-0 cursor-pointer"
                  disabled={!prompt.trim() || generatingId !== null}
                  onClick={handleChatSend}
                  aria-label="Send message"
                >
                  {generatingId === "chat" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 hidden text-center text-[10px] text-muted-foreground/60 sm:block">
                Press Enter to send · Shift+Enter for a new line
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}