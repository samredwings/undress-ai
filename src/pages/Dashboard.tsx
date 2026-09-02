import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  LogOut,
  Trash2,
  Image as ImageIcon,
  Wand2,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const projects = useQuery(api.projects.list);
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const createProject = useMutation(api.projects.create);
  const deleteProject = useMutation(api.projects.remove);

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setIsUploading(true);
      setUploadError(null);
      setPreviewUrl(URL.createObjectURL(file));
      try {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`);
        }
        const { storageId } = (await response.json()) as {
          storageId: string;
        };
        const projectId = await createProject({
          title: file.name.replace(/\.[^.]+$/, "") || "Untitled",
          storageId: storageId as Id<"_storage">,
        });
        navigate(`/editor/${projectId}`);
      } catch (err) {
        console.error("Upload failed:", err);
        setUploadError(
          err instanceof Error
            ? err.message
            : "Upload failed. Please try again.",
        );
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [createProject, generateUploadUrl, navigate],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, projectId: Id<"projects">) => {
      e.stopPropagation();
      if (confirm("Delete this project?")) {
        await deleteProject({ projectId });
      }
    },
    [deleteProject],
  );

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-foreground"
              onClick={() => navigate("/")}
            >
              <Wand2 className="size-4 text-background" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Outfit Studio
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email || "Guest"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer gap-2 text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your Projects
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a photo to start changing outfits.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`mb-12 cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            dragActive
              ? "border-foreground bg-muted/50"
              : "border-border/60 hover:border-border hover:bg-muted/20"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col items-center gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-48 rounded-xl border border-border/50 object-contain"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                {isUploading ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                ) : (
                  <Upload className="size-6 text-muted-foreground" />
                )}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">
                {isUploading
                  ? "Uploading..."
                  : "Drop a photo here or click to upload"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG, or WebP — any size
              </p>
            </div>
            {uploadError && (
              <p className="text-xs font-medium text-destructive">
                {uploadError}
              </p>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {projects === undefined ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl bg-muted/50"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/40 py-20 text-center">
            <ImageIcon className="mb-4 size-10 text-border" />
            <p className="text-sm font-medium text-muted-foreground">
              No projects yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Upload a photo above to create your first project
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {projects.map((project) => (
                <motion.div
                  key={project._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="group cursor-pointer overflow-hidden border-border/50 bg-card transition-all hover:border-border hover:shadow-md"
                    onClick={() => navigate(`/editor/${project._id}`)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={project.originalImageUrl ?? undefined}
                        alt={project.title}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-3 size-8 cursor-pointer bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-background"
                        onClick={(e) => handleDelete(e, project._id)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                      <div className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex size-8 items-center justify-center rounded-full bg-foreground">
                          <ArrowRight className="size-3.5 text-background" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="truncate text-sm font-medium">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(project.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
