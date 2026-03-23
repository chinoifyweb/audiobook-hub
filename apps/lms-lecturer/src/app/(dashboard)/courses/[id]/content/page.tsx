"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Upload,
  ExternalLink,
  FileUp,
} from "lucide-react";
import Link from "next/link";
import { uploadFileToStorage } from "@/lib/supabase";

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
    case "video":
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
  return (
    <div className="aspect-video rounded-md overflow-hidden bg-black">
      <video src={url} controls className="w-full h-full">
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

/** Accepted file types by content type */
const FILE_ACCEPTS: Record<string, string> = {
  video: ".mp4,.webm,.mov,.avi,.mkv",
  pdf: ".pdf",
  document: ".pdf,.docx,.pptx,.doc,.ppt,.xlsx,.xls,.txt",
  ebook: ".epub,.pdf,.mobi",
};

interface AddContentDialogProps {
  courseId: string;
  sessionNumber: number;
  onCreated: () => void;
}

function AddContentDialog({ courseId, sessionNumber, onCreated }: AddContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "youtube_video" as string,
    contentUrl: "",
    isPublished: true,
  });
  const [inputMode, setInputMode] = useState<"url" | "upload">("url");

  const isVideoType = form.type === "youtube_video";
  const isUploadableType = ["video", "pdf", "document", "ebook"].includes(form.type);
  const videoId = isVideoType ? getYouTubeId(form.contentUrl) : null;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      // Simulate progress (actual upload doesn't provide granular progress with supabase-js)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const publicUrl = await uploadFileToStorage(file, courseId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setForm((prev) => ({ ...prev, contentUrl: publicUrl }));

      // Auto-fill title from filename if empty
      if (!form.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setForm((prev) => ({ ...prev, title: nameWithoutExt, contentUrl: publicUrl }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

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
      setInputMode("url");
      setUploadProgress(0);
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
              onValueChange={(val) => {
                setForm({ ...form, type: val, contentUrl: "" });
                setInputMode(val === "youtube_video" || val === "link" ? "url" : "upload");
                setUploadProgress(0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube_video">Video Lecture (YouTube)</SelectItem>
                <SelectItem value="video">Video (Upload from Device)</SelectItem>
                <SelectItem value="link">Direct Video URL / Link</SelectItem>
                <SelectItem value="pdf">PDF Document (Upload)</SelectItem>
                <SelectItem value="document">Document - DOCX, PPTX (Upload)</SelectItem>
                <SelectItem value="ebook">Ebook - EPUB, PDF (Upload)</SelectItem>
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

          {/* URL input for youtube/link types */}
          {(isVideoType || form.type === "link") && (
            <div className="space-y-2">
              <Label>
                {isVideoType ? "YouTube URL" : "Video / Link URL"}
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
          )}

          {/* File upload for uploadable types */}
          {isUploadableType && (
            <div className="space-y-2">
              <Label>Upload File</Label>
              {inputMode === "upload" || isUploadableType ? (
                <div className="space-y-3">
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={FILE_ACCEPTS[form.type] || "*"}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : form.contentUrl ? (
                      <div className="space-y-1">
                        <FileUp className="h-8 w-8 mx-auto text-green-600" />
                        <p className="text-sm text-green-600 font-medium">File uploaded successfully</p>
                        <p className="text-xs text-muted-foreground truncate max-w-sm mx-auto">
                          {form.contentUrl.split("/").pop()}
                        </p>
                        <p className="text-xs text-primary mt-1">Click to upload a different file</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to select a file, or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Accepted: {FILE_ACCEPTS[form.type]?.replace(/\./g, "").replace(/,/g, ", ") || "Any"}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>
          )}

          {/* Preview for video */}
          {form.contentUrl && (isVideoType || form.type === "link" || form.type === "video") && (
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
            <Button type="submit" disabled={loading || isUploading || !form.contentUrl}>
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

/** Edit Content Dialog - for editing existing content items */
interface EditContentDialogProps {
  courseId: string;
  material: Material;
  onUpdated: () => void;
}

function EditContentDialog({ courseId, material, onUpdated }: EditContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: material.title,
    description: material.description?.replace(/^\[Session:[^\]]*\]\s*/, "") || "",
    type: material.type,
    contentUrl: material.contentUrl,
    isPublished: material.isPublished,
  });

  const sessionNum = Math.floor(material.sortOrder / 100);
  const isUploadableType = ["video", "pdf", "document", "ebook"].includes(form.type);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);
      const publicUrl = await uploadFileToStorage(file, courseId);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setForm((prev) => ({ ...prev, contentUrl: publicUrl }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/courses/${courseId}/sessions/${sessionNum}/content/${material.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update content");
      }

      setOpen(false);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit content">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Content Item</DialogTitle>
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
                <SelectItem value="video">Video (Uploaded)</SelectItem>
                <SelectItem value="link">Direct Video URL / Link</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
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
              required
            />
          </div>

          {/* URL input only for non-uploadable types */}
          {!isUploadableType && (
            <div className="space-y-2">
              <Label>Content URL</Label>
              <Input
                value={form.contentUrl}
                onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
                required
              />
            </div>
          )}

          {/* File upload / replace for uploadable types */}
          {isUploadableType && (
            <div className="space-y-2">
              <Label>Upload File</Label>
              {form.contentUrl && (
                <p className="text-xs text-green-600 flex items-center gap-1 mb-1">
                  <FileUp className="h-3 w-3" /> Current file: {form.contentUrl.split("/").pop()}
                </p>
              )}
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_ACCEPTS[form.type] || "*"}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</p>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Click to upload a replacement file</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editPublished"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="editPublished" className="font-normal">
              Published (visible to students)
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || isUploading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
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

/** Edit Session Title Dialog */
interface EditSessionDialogProps {
  courseId: string;
  sessionNumber: number;
  currentTitle: string;
  onUpdated: () => void;
}

function EditSessionDialog({ courseId, sessionNumber, currentTitle, onUpdated }: EditSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(currentTitle);

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/courses/${courseId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionNumber, title }),
      });
      setOpen(false);
      onUpdated();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          title="Edit session title"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit Session Title</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={loading || !title.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Preview Dialog for any content type — with inline document viewer */
function PreviewDialog({ material, open, onClose }: { material: Material; open: boolean; onClose: () => void }) {
  const isVideo = material.type === "youtube_video" || material.type === "link" || material.type === "video";
  const isPdf = material.type === "pdf";
  const isDoc = material.type === "document" || material.type === "ebook";

  // Build Google Docs Viewer URL for non-PDF documents
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(material.contentUrl)}&embedded=true`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MaterialTypeIcon type={material.type} />
            {material.title}
          </DialogTitle>
        </DialogHeader>
        {isVideo && <VideoPreview url={material.contentUrl} />}
        {isPdf && (
          <div className="space-y-3">
            <iframe
              src={`${material.contentUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              className="w-full h-[65vh] rounded-md border"
              title="PDF Preview"
            />
            <div className="flex gap-2">
              <a href={material.contentUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" /> Open in New Tab
                </Button>
              </a>
              <a href={material.contentUrl} download>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FileUp className="h-4 w-4" /> Download
                </Button>
              </a>
            </div>
          </div>
        )}
        {isDoc && (
          <div className="space-y-3">
            <iframe
              src={googleViewerUrl}
              className="w-full h-[65vh] rounded-md border"
              title="Document Preview"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
            <div className="flex gap-2">
              <a href={material.contentUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" /> Open in New Tab
                </Button>
              </a>
              <a href={material.contentUrl} download>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FileUp className="h-4 w-4" /> Download
                </Button>
              </a>
            </div>
          </div>
        )}
        {material.description && (
          <p className="text-sm text-muted-foreground">
            {material.description.replace(/^\[Session:[^\]]*\]\s*/, "")}
          </p>
        )}
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
  const [togglingPublish, setTogglingPublish] = useState<Set<string>>(new Set());
  const [deletingContent, setDeletingContent] = useState<Set<string>>(new Set());

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
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
    setTogglingPublish((prev) => new Set(prev).add(materialId));
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
    } finally {
      setTogglingPublish((prev) => {
        const next = new Set(prev);
        next.delete(materialId);
        return next;
      });
    }
  }

  async function deleteContent(materialId: string) {
    if (!confirm("Are you sure you want to delete this content?")) return;

    setDeletingContent((prev) => new Set(prev).add(materialId));
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
    } finally {
      setDeletingContent((prev) => {
        const next = new Set(prev);
        next.delete(materialId);
        return next;
      });
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
                        <EditSessionDialog
                          courseId={courseId}
                          sessionNumber={session.sessionNumber}
                          currentTitle={session.sessionTitle}
                          onUpdated={fetchSessions}
                        />
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <AddContentDialog
                        courseId={courseId}
                        sessionNumber={session.sessionNumber}
                        onCreated={fetchSessions}
                      />
                    </div>
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
                              {/* Preview button - works for all types */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Preview"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewMaterial(material);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {/* Open in new tab */}
                              <a
                                href={material.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </a>
                              {/* Edit button */}
                              <EditContentDialog
                                courseId={courseId}
                                material={material}
                                onUpdated={fetchSessions}
                              />
                              {/* Publish/Unpublish */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePublish(material.id, material.isPublished);
                                }}
                                disabled={togglingPublish.has(material.id)}
                                title={material.isPublished ? "Unpublish" : "Publish"}
                              >
                                {togglingPublish.has(material.id) ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : material.isPublished ? (
                                  <Eye className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                              {/* Delete */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                disabled={deletingContent.has(material.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteContent(material.id);
                                }}
                              >
                                {deletingContent.has(material.id) ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
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

      {/* Preview Dialog */}
      {previewMaterial && (
        <PreviewDialog
          material={previewMaterial}
          open={!!previewMaterial}
          onClose={() => setPreviewMaterial(null)}
        />
      )}
    </div>
  );
}
