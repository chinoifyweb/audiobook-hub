"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import {
  FileQuestion,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Save,
  X,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface TestExam {
  id: string;
  title: string;
  type: string;
  description: string | null;
  durationMinutes: number;
  totalMarks: number;
  passMark: number;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  maxAttempts: number;
  courseAssignment: {
    id: string;
    course: { code: string; title: string };
  };
  attempts: { id: string; status: string; score: number | null }[];
  _count?: { questions: number };
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TestExam>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTests();
  }, []);

  async function fetchTests() {
    setLoading(true);
    try {
      const res = await fetch("/api/tests/list");
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch {
      setError("Failed to load tests");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(test: TestExam) {
    setEditingId(test.id);
    setEditData({
      title: test.title,
      type: test.type,
      description: test.description || "",
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      passMark: test.passMark,
      startTime: test.startTime,
      endTime: test.endTime,
      isPublished: test.isPublished,
      shuffleQuestions: test.shuffleQuestions,
      showResultsImmediately: test.showResultsImmediately,
      maxAttempts: test.maxAttempts,
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editData }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchTests();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTest(id: string) {
    if (!confirm("Are you sure you want to delete this test/exam? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/tests?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTests((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      setError("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublish(test: TestExam) {
    try {
      const res = await fetch("/api/tests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: test.id, isPublished: !test.isPublished }),
      });
      if (res.ok) {
        setTests((prev) =>
          prev.map((t) => (t.id === test.id ? { ...t, isPublished: !t.isPublished } : t))
        );
      }
    } catch {
      setError("Failed to update");
    }
  }

  const now = new Date();
  const filtered = tests.filter((t) => {
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.courseAssignment.course.code.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "published") return matchesSearch && t.isPublished;
    if (filter === "draft") return matchesSearch && !t.isPublished;
    if (filter === "active")
      return matchesSearch && new Date(t.startTime) <= now && new Date(t.endTime) >= now;
    if (filter === "ended") return matchesSearch && new Date(t.endTime) < now;
    if (filter === "ca") return matchesSearch && t.type === "ca";
    if (filter === "exam") return matchesSearch && t.type === "exam";
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tests & Exams</h1>
        <p className="text-muted-foreground">Manage all tests and exams across your courses</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by title or course code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({tests.length})</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="active">Active Now</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="ca">CA Only</SelectItem>
            <SelectItem value="exam">Exams Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {tests.length === 0
                ? "No tests or exams yet. Create one from a course page."
                : "No tests match your filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((te) => {
            const isUpcoming = new Date(te.startTime) > now;
            const isActive = new Date(te.startTime) <= now && new Date(te.endTime) >= now;
            const isEnded = new Date(te.endTime) < now;
            const gradedCount = te.attempts.filter((a) => a.status === "graded").length;
            const isEditing = editingId === te.id;

            if (isEditing) {
              return (
                <Card key={te.id} className="border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Pencil className="h-4 w-4 text-primary" />
                      Editing: {te.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={editData.title || ""}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={editData.type || "ca"}
                          onValueChange={(v) => setEditData({ ...editData, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ca">Continuous Assessment</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={(editData.description as string) || ""}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Duration (mins)</Label>
                        <Input
                          type="number"
                          value={editData.durationMinutes || 30}
                          onChange={(e) =>
                            setEditData({ ...editData, durationMinutes: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Marks</Label>
                        <Input
                          type="number"
                          value={editData.totalMarks || 0}
                          onChange={(e) =>
                            setEditData({ ...editData, totalMarks: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pass Mark</Label>
                        <Input
                          type="number"
                          value={editData.passMark || 0}
                          onChange={(e) =>
                            setEditData({ ...editData, passMark: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Attempts</Label>
                        <Input
                          type="number"
                          value={editData.maxAttempts || 2}
                          onChange={(e) =>
                            setEditData({ ...editData, maxAttempts: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="datetime-local"
                          value={
                            editData.startTime
                              ? new Date(editData.startTime).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setEditData({ ...editData, startTime: new Date(e.target.value).toISOString() })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="datetime-local"
                          value={
                            editData.endTime
                              ? new Date(editData.endTime).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setEditData({ ...editData, endTime: new Date(e.target.value).toISOString() })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editData.isPublished || false}
                          onChange={(e) =>
                            setEditData({ ...editData, isPublished: e.target.checked })
                          }
                        />
                        Published
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editData.shuffleQuestions || false}
                          onChange={(e) =>
                            setEditData({ ...editData, shuffleQuestions: e.target.checked })
                          }
                        />
                        Shuffle Questions
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editData.showResultsImmediately || false}
                          onChange={(e) =>
                            setEditData({ ...editData, showResultsImmediately: e.target.checked })
                          }
                        />
                        Show Results Immediately
                      </label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setEditingId(null)}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                      <Button onClick={saveEdit} disabled={saving}>
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={te.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {te.courseAssignment.course.code}
                      </Badge>
                      <p className="font-medium">{te.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {te.type === "ca" ? "CA" : "Exam"}
                      </Badge>
                      {!te.isPublished && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                          Draft
                        </Badge>
                      )}
                      {isUpcoming && (
                        <Badge className="text-xs bg-blue-100 text-blue-700">
                          <Clock className="mr-1 h-3 w-3" /> Upcoming
                        </Badge>
                      )}
                      {isActive && (
                        <Badge className="text-xs bg-green-100 text-green-700">
                          <CheckCircle className="mr-1 h-3 w-3" /> Active
                        </Badge>
                      )}
                      {isEnded && (
                        <Badge className="text-xs bg-gray-100 text-gray-600">
                          <XCircle className="mr-1 h-3 w-3" /> Ended
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(te.startTime), "MMM d, h:mm a")} –{" "}
                        {format(new Date(te.endTime), "MMM d, h:mm a")}
                      </span>
                      <span>{te.durationMinutes} min</span>
                      <span>{te.totalMarks} marks</span>
                      <span>Pass: {te.passMark}</span>
                      <span>
                        {gradedCount}/{te.attempts.length} graded
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublish(te)}
                      title={te.isPublished ? "Unpublish" : "Publish"}
                    >
                      {te.isPublished ? (
                        <XCircle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(te)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTest(te.id)}
                      disabled={deleting === te.id}
                    >
                      {deleting === te.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                    <Link href={`/tests/${te.id}/attempts`}>
                      <Button size="sm" variant="outline">
                        <Eye className="mr-1 h-3.5 w-3.5" /> Attempts
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
