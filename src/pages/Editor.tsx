import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Paperclip,
  Send,
  Wand2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const createGeneration = useMutation(api.generations.create);
  const generateOutfit = useAction(api.generate.generateOutfit);

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeResult, setActiveResult] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<GarmentSelection | null>(
    null,
  );
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll to the newest message like a real chat app
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isGenerating, scrollToBottom]);

  // Keep focus in the input after sending so the user can keep chatting
  useEffect(() => {
    if (!isGenerating) promptRef.current?.focus();
  }, [isGenerating]);

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

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !projectId || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsGenerating(true);

    try {
      const generationId = await createGeneration({
        projectId,
        prompt: prompt.trim(),
        ...(garmentImage && {
          garmentImageStorageId: garmentImage.storageId,
        }),
      });

      const result = await generateOutfit({
        generationId,
        projectId,
        prompt: prompt.trim(),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Here's your outfit change. Want to adjust anything?",
          imageUrl: result.imageUrl ?? undefined,
          timestamp: Date.now(),
        },
      ]);

      if (result.imageUrl) {
        setActiveResult(result.imageUrl);
      }

      removeGarment();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Generation failed";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Something went wrong: ${errorMessage}. Please try again.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [
    prompt,
    projectId,
    isGenerating,
    createGeneration,
    generateOutfit,
    garmentImage,
    removeGarment,
  ]);

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

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
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
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer gap-2 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </nav>

      {/* Content: image on top (mobile) / left (desktop), chat fills the rest */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Image Panel */}
        <section className="flex shrink-0 flex-col border-b border-border/50 bg-muted/10 md:w-[46%] md:shrink md:border-b-0 md:border-r md:bg-transparent">
          <div className="relative flex h-[34dvh] min-h-0 items-center justify-center bg-muted/30 md:h-auto md:flex-1 md:p-6">
            <img
              src={currentImage}
              alt={activeResult ? "Generated outfit" : project.title}
              className="size-full object-contain"
            />
            <div className="absolute bottom-3 left-3 flex gap-2 md:bottom-4 md:left-4">
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
          </div>

          {/* Generation History */}
          {generations && generations.length > 0 && (
            <div className="shrink-0 px-3 py-2.5 md:px-6 md:py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  className={`flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all md:size-16 ${
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
                {generations
                  .filter((g) => g.status === "completed" && g.resultImageUrl)
                  .map((gen) => (
                    <button
                      key={gen._id}
                      className={`flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all md:size-16 ${
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
            </div>
          )}
        </section>

        {/* Chat Panel */}
        <section className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 sm:px-6">
              {messages.length === 0 && !isGenerating && (
                <div className="flex flex-col items-center justify-center gap-1 py-12 text-center sm:py-16">
                  <p className="text-sm font-medium">Start a conversation</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Tell the editor what you'd like to change in the photo
                    below.
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
                      msg.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground">
                        <Wand2 className="size-3.5 text-background" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] ${
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
                            className="max-h-72 w-full object-contain sm:max-h-96"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isGenerating && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input (pinned to bottom) */}
          <div className="shrink-0 border-t border-border/50 bg-background/80 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-4">
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
                    handleGenerate();
                  }
                }}
              />
              <Button
                size="icon"
                className="size-9 shrink-0 cursor-pointer"
                disabled={!prompt.trim() || isGenerating}
                onClick={handleGenerate}
                aria-label="Send message"
              >
                {isGenerating ? (
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
        </section>
      </div>
    </div>
  );
}