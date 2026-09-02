import { useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Send,
  Wand2,
  Loader2,
  Image as ImageIcon,
  LogOut,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: number;
}

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const project = useQuery(
    api.projects.get,
    projectId ? { projectId: projectId as any } : "skip",
  );
  const generations = useQuery(
    api.generations.listByProject,
    projectId ? { projectId: projectId as any } : "skip",
  );
  const createGeneration = useMutation(api.generations.create);
  const generateOutfit = useAction(api.generate.generateOutfit);

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeResult, setActiveResult] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
        projectId: projectId as any,
        prompt: prompt.trim(),
        ...(garmentImage && { garmentImageUrl: garmentImage }),
      });

      // Add assistant thinking message
      const thinkingMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Generating your outfit change...",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, thinkingMessage]);
      scrollToBottom();

      const result = await generateOutfit({
        generationId,
        projectId: projectId as any,
        prompt: prompt.trim(),
      });

      // Replace thinking message with result
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingMessage.id
            ? {
                ...msg,
                content: "Here's your outfit change. Want to adjust anything?",
                imageUrl: result.imageUrl,
              }
            : msg,
        ),
      );

      if (result.imageUrl) {
        setActiveResult(result.imageUrl);
      }

      setGarmentImage(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Generation failed";
      setMessages((prev) => [
        ...prev.filter((m) => !m.content.includes("Generating")),
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
    scrollToBottom,
  ]);

  const handleGarmentUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file);
        setGarmentImage(dataUrl);
      } catch (err) {
        console.error("Garment upload failed:", err);
      }
      e.target.value = "";
    },
    [],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (project === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <p className="text-sm text-muted-foreground">Project not found</p>
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <nav className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer size-8"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-foreground">
              <Wand2 className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
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
          Sign out
        </Button>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Image Panel */}
        <div className="flex flex-1 flex-col border-r border-border/50 p-6">
          <div className="relative flex flex-1 items-center justify-center rounded-2xl bg-muted/30">
            {activeResult ? (
              <div className="relative size-full">
                <img
                  src={activeResult}
                  alt="Generated outfit"
                  className="size-full rounded-2xl object-contain"
                />
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer gap-2 bg-background/80 backdrop-blur-sm"
                    onClick={() => setActiveResult(null)}
                  >
                    <ImageIcon className="size-3.5" />
                    Original
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer gap-2 bg-background/80 backdrop-blur-sm"
                    onClick={() => {
                      if (activeResult) {
                        const a = document.createElement("a");
                        a.href = activeResult;
                        a.download = `outfit-${Date.now()}.png`;
                        a.click();
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <img
                src={project.originalImageUrl}
                alt={project.title}
                className="max-h-full rounded-2xl object-contain"
              />
            )}
          </div>

          {/* Generation History */}
          {generations && generations.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Recent generations
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  className={`flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
                    !activeResult
                      ? "border-foreground"
                      : "border-transparent hover:border-border"
                  }`}
                  onClick={() => setActiveResult(null)}
                >
                  <img
                    src={project.originalImageUrl}
                    alt="Original"
                    className="size-full object-cover"
                  />
                </button>
                {generations
                  .filter((g) => g.status === "completed" && g.resultImageUrl)
                  .map((gen) => (
                    <button
                      key={gen._id}
                      className={`flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
                        activeResult === gen.resultImageUrl
                          ? "border-foreground"
                          : "border-transparent hover:border-border"
                      }`}
                      onClick={() => setActiveResult(gen.resultImageUrl!)}
                    >
                      <img
                        src={gen.resultImageUrl}
                        alt={gen.prompt}
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="flex w-96 flex-col bg-background">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
                    <Wand2 className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Describe your outfit</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tell AI what outfit you want. Be as specific or creative as
                    you like.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-col ${
                          msg.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.imageUrl && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-border/50">
                            <img
                              src={msg.imageUrl}
                              alt="Generated result"
                              className="max-h-64 object-contain"
                            />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="shrink-0 border-t border-border/50 p-4">
            {/* Garment Image Preview */}
            {garmentImage && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                <img
                  src={garmentImage}
                  alt="Garment reference"
                  className="size-10 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-xs font-medium">Garment reference</p>
                  <p className="text-[10px] text-muted-foreground">
                    Will be used as style reference
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 cursor-pointer"
                  onClick={() => setGarmentImage(null)}
                >
                  ×
                </Button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={garmentInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGarmentUpload}
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 cursor-pointer"
                onClick={() => garmentInputRef.current?.click()}
                title="Upload garment reference"
              >
                <Upload className="size-4" />
              </Button>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the outfit you want..."
                className="min-h-[44px] max-h-32 resize-none rounded-xl border-border/60 bg-muted/30 focus-visible:ring-1 focus-visible:ring-foreground/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <Button
                size="icon"
                className="shrink-0 cursor-pointer"
                disabled={!prompt.trim() || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
