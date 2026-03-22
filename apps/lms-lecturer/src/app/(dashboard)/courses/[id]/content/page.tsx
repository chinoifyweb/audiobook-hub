"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui";
import {
  Plus,
  ArrowLeft,
  Loader2,
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  Video,
  FileText,
  Link as LinkIcon,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import Link from "next/link";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  contentUrl: string;
  sortOrder: number;
  isPublished: boolean;
}

interface Session {
  sessionNumber: number;
  sessionTitle: string;
  materials: Material[];
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/
  );
  return match ? match[1] : null;
}

function MaterialTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "youtube_video":
      return <Video className="h-4 w-4 text-red-500" />;
    case "pdf":
    case "document":
    case "ebook":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "link":
      return <LinkIcon className="h-4 w-4 text-green-500" />;
    default:
      return <BookOpen className="h-4 w-4 text-gray-500" />;
  }
}

function VideoPreview({ url }: { url: string }) {
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return (
      <div className="aspect-video rounded-md overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video preview"
        />
      </div>
    );
  }
  // Direct video URL
  return (
    <div className="aspect-video rounded-md overflow-hidden bg-black">
      <video src={url} controls className="w-full h-full">
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

interface AddContentDialogProps {
  courseId: string;
  sessionNumber: number;
  onCreated: () => void;
}

function AddContentDialog({ courseId, sessionNumber, onCreated }: AddContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "youtube_video" as string,
    contentUrl: "",
    isPublished: true,
  });

  const isVideoType = form.type === "youtube_video";
  const videoId = isVideoType ? getYouTubeId(form.contentUrl) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/courses/${courseId}/sessions/${sessionNumber}/content`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add content");
      }

      setForm({ title: "", description: "", type: "youtube_video", contentUrl: "", isPublished: true });
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Content
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Content Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select
              value={form.type}
              onValueChange={(val) => setForm({ ...form, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube_video">Video Lecture (YouTube)</SelectItem>
                <SelectItem value="link">Direct Video URL / Link</SelectItem>
                <SelectItem value="pdf">Reading Material (PDF)</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="ebook">Ebook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={
                isVideoType
                  ? "e.g., Lecture 1 - Introduction"
                  : "e.g., Chapter 1 Reading Notes"
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>
              {isVideoType
                ? "YouTube URL"
                : form.type === "link"
                ? "Video / Link URL"
                : "File URL"}
            </Label>
            <Input
              value={form.contentUrl}
              onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
              placeholder={
                isVideoType
                  ? "https://youtube.com/watch?v=... or https://youtu.be/..."
                  : "https://..."
              }
              required
            />
            {isVideoType && videoId && (
              <p className="text-xs text-green-600">
                YouTube video detected (ID: {videoId})
              </p>
            )}
            {isVideoType && form.contentUrl && !videoId && (
              <p className="text-xs text-yellow-600">
                Could not detect YouTube video ID. Make sure the URL is correct.
              </p>
            )}
          </div>

          {/* Preview for video */}
          {form.contentUrl && (isVideoType || form.type === "link") && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <VideoPreview url={form.contentUrl} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description or key terms/glossary..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="addPublished"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="addPublished" className="font-normal">
              Publish (visible to students)
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Content
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  params: { id: string };
}

export default function CourseContentPage({ params }: Props) {
  const router = useRouter();
  const courseId = params.id;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());
  const [addingSession, setAddingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        // Auto-expand all sessions
        setExpandedSessions(new Set(data.map((s: Session) => s.sessionNumber)));
      }
    } catch {
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function handleAddSession() {
    if (!newSessionTitle.trim()) return;
    setAddingSession(true);

    try {
      const nextNum = sessions.length > 0 ? Math.max(...sessions.map((s) => s.sessionNumber)) + 1 : 0;

      const res = await fetch(`/api/courses/${courseId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionNumber: nextNum, title: newSessionTitle }),
      });

      if (res.ok) {
        setNewSessionTitle("");
        fetchSessions();
      }
    } catch {
      setError("Failed to create session");
    } finally {
      setAddingSession(false);
    }
  }

  function toggleSession(sessionNum: number) {
    const next = new Set(expandedSessions);
    if (next.has(sessionNum)) {
      next.delete(sessionNum);
    } else {
      next.add(sessionNum);
    }
    setExpandedSessions(next);
  }

  async function togglePublish(materialId: string, currentlyPublished: boolean) {
    try {
      const material = sessions
        .flatMap((s) => s.materials)
        .find((m) => m.id === materialId);
      if (!material) return;

      const sessionNum = Math.floor(material.sortOrder / 100);

      await fetch(
        `/api/courses/${courseId}/sessions/${sessionNum}/content/${materialId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: !currentlyPublished }),
        }
      );
      fetchSessions();
    } catch {
      // silent
    }
  }

  async function deleteContent(materialId: string) {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const material = sessions
        .flatMap((s) => s.materials)
        .find((m) => m.id === materialId);
      if (!material) return;

      const sessionNum = Math.floor(material.sortOrder / 100);

      await fetch(
        `/api/courses/${courseId}/sessions/${sessionNum}/content/${materialId}`,
        { method: "DELETE" }
      );
      fetchSessions();
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Course Content</h1>
            <p className="text-muted-foreground">
              Organize content by study sessions/weeks
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Add New Session */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Add Study Session</Label>
              <Input
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="e.g., Week 1 - Introduction to the Old Testament"
                onKeyDown={(e) => e.key === "Enter" && handleAddSession()}
              />
            </div>
            <Button onClick={handleAddSession} disabled={addingSession || !newSessionTitle.trim()}>
              {addingSession ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No study sessions yet. Create one above to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.sessionNumber}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSession(session.sessionNumber)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {session.sessionTitle}
                        <Badge variant="secondary" className="text-xs">
                          {session.materials.filter((m) => m.contentUrl !== "#").length} items
                        </Badge>
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AddContentDialog
                      courseId={courseId}
                      sessionNumber={session.sessionNumber}
                      onCreated={fetchSessions}
                    />
                    {expandedSessions.has(session.sessionNumber) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedSessions.has(session.sessionNumber) && (
                <CardContent>
                  {session.materials.filter((m) => m.contentUrl !== "#").length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No content items yet. Click &quot;Add Content&quot; to add videos, readings, or materials.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {session.materials
                        .filter((m) => m.contentUrl !== "#")
                        .map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab shrink-0" />
                            <MaterialTypeIcon type={material.type} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {material.title}
                                </p>
                                <Badge variant="outline" className="text-xs capitalize shrink-0">
                                  {material.type.replace(/_/g, " ")}
                                </Badge>
                                {!material.isPublished && (
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    Draft
                                  </Badge>
                                )}
                              </div>
                              {material.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {material.description.replace(/^\[Session:[^\]]*\]\s*/, "")}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {(material.type === "youtube_video" || material.type === "link") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewMaterial(material);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePublish(material.id, material.isPublished);
                                }}
                                title={material.isPublished ? "Unpublish" : "Publish"}
                              >
                                {material.isPublished ? (
                                  <Eye className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteContent(material.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Video Preview Dialog */}
      {previewMaterial && (
        <Dialog open={!!previewMaterial} onOpenChange={() => setPreviewMaterial(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewMaterial.title}</DialogTitle>
            </DialogHeader>
            <VideoPreview url={previewMaterial.contentUrl} />
            {previewMaterial.description && (
              <p className="text-sm text-muted-foreground">
                {previewMaterial.description.replace(/^\[Session:[^\]]*\]\s*/, "")}
              </p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
