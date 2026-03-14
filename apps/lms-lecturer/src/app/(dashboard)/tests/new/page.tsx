"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "@repo/ui";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  points: number;
}

interface QuestionBank {
  id: string;
  title: string;
  questions: Question[];
}

function NewTestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const [loading, setLoading] = useState(false);
  const [fetchingBanks, setFetchingBanks] = useState(true);
  const [error, setError] = useState("");
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    title: "",
    type: "test" as string,
    description: "",
    durationMinutes: 60,
    totalMarks: 100,
    passMark: 40,
    startTime: "",
    endTime: "",
    isProctored: false,
    shuffleQuestions: false,
    showResultsImmediately: false,
    isPublished: false,
  });

  useEffect(() => {
    async function fetchBanks() {
      try {
        const res = await fetch(`/api/question-banks?courseAssignmentId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setQuestionBanks(data);
        }
      } catch {
        // Silently handle - no banks is fine
      } finally {
        setFetchingBanks(false);
      }
    }
    fetchBanks();
  }, [courseId]);

  function toggleQuestion(qId: string) {
    const next = new Set(selectedQuestions);
    if (next.has(qId)) {
      next.delete(qId);
    } else {
      next.add(qId);
    }
    setSelectedQuestions(next);

    // Auto-calculate total marks
    let total = 0;
    questionBanks.forEach((bank) => {
      bank.questions.forEach((q) => {
        if (next.has(q.id)) total += q.points;
      });
    });
    setForm((prev) => ({ ...prev, totalMarks: total }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedQuestions.size === 0) {
      setError("Please select at least one question");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseAssignmentId: courseId,
          ...form,
          questionIds: Array.from(selectedQuestions),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create test");
      }

      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const typeLabel: Record<string, string> = {
    mcq: "MCQ",
    true_false: "T/F",
    short_answer: "Short",
    essay: "Essay",
    fill_in_the_blank: "Fill",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${courseId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Test / Exam</h1>
          <p className="text-muted-foreground">Set up a new test or exam</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Mid-Semester Test"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm({ ...form, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Test instructions and description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timing & Scoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })
                  }
                  min={1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={form.totalMarks}
                  onChange={(e) =>
                    setForm({ ...form, totalMarks: parseInt(e.target.value) || 0 })
                  }
                  min={1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Pass Mark</Label>
                <Input
                  type="number"
                  value={form.passMark}
                  onChange={(e) =>
                    setForm({ ...form, passMark: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="proctored"
                  checked={form.isProctored}
                  onChange={(e) => setForm({ ...form, isProctored: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="proctored" className="font-normal">
                  Proctored (restrict tab switching)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shuffle"
                  checked={form.shuffleQuestions}
                  onChange={(e) => setForm({ ...form, shuffleQuestions: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="shuffle" className="font-normal">
                  Shuffle question order
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showResults"
                  checked={form.showResultsImmediately}
                  onChange={(e) =>
                    setForm({ ...form, showResultsImmediately: e.target.checked })
                  }
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="showResults" className="font-normal">
                  Show results immediately after submission
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="published" className="font-normal">
                  Publish immediately
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Select Questions ({selectedQuestions.size} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fetchingBanks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : questionBanks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No question banks found for this course. Create a question bank first.
              </p>
            ) : (
              <div className="space-y-6">
                {questionBanks.map((bank) => (
                  <div key={bank.id}>
                    <h4 className="text-sm font-medium mb-2">{bank.title}</h4>
                    <div className="space-y-2">
                      {bank.questions.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent/50 cursor-pointer"
                          onClick={() => toggleQuestion(q.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(q.id)}
                            onChange={() => toggleQuestion(q.id)}
                            className="h-4 w-4 rounded mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm">{q.questionText}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {typeLabel[q.questionType] || q.questionType}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {q.points} pts
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {form.type === "exam" ? "Exam" : "Test"}
          </Button>
          <Link href={`/courses/${courseId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewTestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewTestPageContent />
    </Suspense>
  );
}
