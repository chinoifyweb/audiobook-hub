"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Loader2, ArrowLeft, Upload, FileUp } from "lucide-react";
import Link from "next/link";
import { uploadFileToStorage } from "@/lib/supabase";

const FILE_ACCEPTS: Record<string, string> = {
  video: ".mp4,.webm,.mov,.avi,.mkv",
  pdf: ".pdf",
  document: ".pdf,.docx,.pptx,.doc,.ppt,.xlsx,.xls,.txt",
  ebook: ".epub,.pdf,.mobi",
};

interface Props {
  params: { courseId: string };
}

export default function NewMaterialPage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "pdf" as string,
    contentUrl: "",
    sortOrder: 0,
    isPublished: true,
  });

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

      const publicUrl = await uploadFileToStorage(file, params.courseId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setForm((prev) => ({ ...prev, contentUrl: publicUrl }));

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
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseAssignmentId: params.courseId,
          ...form,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create material");
      }

      router.push(`/courses/${params.courseId}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${params.courseId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Material</h1>
          <p className="text-muted-foreground">Upload a new course material</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Week 1 - Introduction to Biblical Studies"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this material"
              />
            </div>

            <div className="space-y-2">
              <Label>Material Type</Label>
              <Select
                value={form.type}
                onValueChange={(val) => {
                  setForm({ ...form, type: val, contentUrl: "" });
                  setUploadProgress(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube_video">YouTube Video</SelectItem>
                  <SelectItem value="video">Video (Upload)</SelectItem>
                  <SelectItem value="pdf">PDF (Upload)</SelectItem>
                  <SelectItem value="ebook">Ebook (Upload)</SelectItem>
                  <SelectItem value="document">Document (Upload)</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File upload for uploadable types */}
            {isUploadableType && (
              <div className="space-y-3">
                <Label>Upload File</Label>
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
                      <div className="w-full bg-muted rounded-full h-2 max-w-xs mx-auto">
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
                      <p className="text-xs text-primary mt-1">Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to select a file</p>
                      <p className="text-xs text-muted-foreground">
                        Accepted: {FILE_ACCEPTS[form.type]?.replace(/\./g, "").replace(/,/g, ", ") || "Any"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>or paste a URL directly</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="contentUrl">
                {form.type === "youtube_video"
                  ? "YouTube URL"
                  : form.type === "link"
                  ? "External URL"
                  : "File URL"}
              </Label>
              <Input
                id="contentUrl"
                value={form.contentUrl}
                onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
                placeholder={
                  form.type === "youtube_video"
                    ? "https://youtube.com/watch?v=..."
                    : form.type === "link"
                    ? "https://..."
                    : "https://your-project.supabase.co/storage/v1/..."
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isPublished"
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPublished" className="font-normal">
                Publish immediately (visible to students)
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || isUploading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Material
              </Button>
              <Link href={`/courses/${params.courseId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
