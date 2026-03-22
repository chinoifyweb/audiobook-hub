"use client";

import { useState } from "react";
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
} from "@repo/ui";
import { Loader2, ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";

interface QuestionDraft {
  id: string; // client-side temp id
  questionText: string;
  questionType: "mcq" | "true_false" | "fill_in_the_blank";
  options: { text: string; isCorrect: boolean }[];
  correctAnswer: string;
  points: number;
}

function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface Props {
  params: { id: string };
}

export default function NewAssessmentPage({ params }: Props) {
  const router = useRouter();
  const courseId = params.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "test" as string,
    durationMinutes: 60,
    passMark: 40,
    startTime: "",
    endTime: "",
    isPublished: false,
    shuffleQuestions: false,
    showResultsImmediately: false,
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  function addQuestion(type: "mcq" | "true_false" | "fill_in_the_blank") {
    const newQ: QuestionDraft = {
      id: generateId(),
      questionText: "",
      questionType: type,
      options:
        type === "mcq"
          ? [
              { text: "", isCorrect: true },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ]
          : type === "true_false"
          ? [
              { text: "True", isCorrect: true },
              { text: "False", isCorrect: false },
            ]
          : [],
      correctAnswer: type === "fill_in_the_blank" ? "" : "",
      points: 1,
    };
    setQuestions([...questions, newQ]);
  }

  function updateQuestion(id: string, updates: Partial<QuestionDraft>) {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  }

  function updateOption(
    questionId: string,
    optionIndex: number,
    updates: Partial<{ text: string; isCorrect: boolean }>
  ) {
    setQuestions(
      questions.map((q) => {
        if (q.id !== questionId) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = { ...newOptions[optionIndex]!, ...updates };
        // If setting isCorrect to true, unset others (single correct answer)
        if (updates.isCorrect) {
          newOptions.forEach((opt, idx) => {
            if (idx !== optionIndex) opt.isCorrect = false;
          });
        }
        return { ...q, options: newOptions };
      })
    );
  }

  function removeQuestion(id: string) {
    setQuestions(questions.filter((q) => q.id !== id));
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.points, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      if (!q.questionText.trim()) {
        setError(`Question ${i + 1}: Please enter question text`);
        return;
      }
      if (q.questionType === "mcq") {
        const hasCorrect = q.options.some((o) => o.isCorrect);
        const allFilled = q.options.every((o) => o.text.trim());
        if (!hasCorrect) {
          setError(`Question ${i + 1}: Please mark the correct answer`);
          return;
        }
        if (!allFilled) {
          setError(`Question ${i + 1}: Please fill in all options`);
          return;
        }
      }
      if (q.questionType === "fill_in_the_blank" && !q.correctAnswer.trim()) {
        setError(`Question ${i + 1}: Please enter the correct answer`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        totalMarks,
        questions: questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options:
            q.questionType === "mcq" || q.questionType === "true_false"
              ? q.options
              : null,
          correctAnswer:
            q.questionType === "fill_in_the_blank"
              ? q.correctAnswer
              : q.questionType === "true_false"
              ? q.options.find((o) => o.isCorrect)?.text || "True"
              : q.options.find((o) => o.isCorrect)?.text || "",
          points: q.points,
        })),
      };

      const res = await fetch(`/api/courses/${courseId}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create assessment");
      }

      router.push(`/courses/${courseId}/assessments`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const typeLabels: Record<string, string> = {
    mcq: "Multiple Choice",
    true_false: "True / False",
    fill_in_the_blank: "Fill in the Blank",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${courseId}/assessments`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Assessment</h1>
          <p className="text-muted-foreground">
            Build a quiz or exam with questions
          </p>
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
                  placeholder="e.g., CA Test 1"
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
                    <SelectItem value="test">Test (CA)</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description / Instructions</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Instructions for students..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Timing & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timing & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Open Date/Time</Label>
                <Input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Close Date/Time</Label>
                <Input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time Limit (minutes)</Label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  min={1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Pass Mark (%)</Label>
                <Input
                  type="number"
                  value={form.passMark}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      passMark: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shuffle"
                  checked={form.shuffleQuestions}
                  onChange={(e) =>
                    setForm({ ...form, shuffleQuestions: e.target.checked })
                  }
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
                    setForm({
                      ...form,
                      showResultsImmediately: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="showResults" className="font-normal">
                  Show results to students immediately
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publish"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="publish" className="font-normal">
                  Publish immediately (visible to students)
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Questions ({questions.length}){" "}
                <span className="text-muted-foreground font-normal">
                  | Total: {totalMarks} marks
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("mcq")}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" /> MCQ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("true_false")}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" /> T/F
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("fill_in_the_blank")}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" /> Fill Blank
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No questions added. Use the buttons above to add questions.
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground/30 mt-1 shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Q{idx + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {typeLabels[q.questionType]}
                          </Badge>
                          <div className="flex items-center gap-1 ml-auto">
                            <Input
                              type="number"
                              value={q.points}
                              onChange={(e) =>
                                updateQuestion(q.id, {
                                  points: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-16 h-7 text-xs"
                              min={1}
                            />
                            <span className="text-xs text-muted-foreground">
                              pts
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => removeQuestion(q.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <textarea
                          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={q.questionText}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              questionText: e.target.value,
                            })
                          }
                          placeholder="Enter your question here..."
                        />

                        {/* MCQ Options */}
                        {q.questionType === "mcq" && (
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Options (click radio to mark correct)
                            </Label>
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  name={`correct_${q.id}`}
                                  checked={opt.isCorrect}
                                  onChange={() =>
                                    updateOption(q.id, optIdx, {
                                      isCorrect: true,
                                    })
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="text-xs font-medium text-muted-foreground w-4">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <Input
                                  value={opt.text}
                                  onChange={(e) =>
                                    updateOption(q.id, optIdx, {
                                      text: e.target.value,
                                    })
                                  }
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  className="h-8 text-sm"
                                />
                                {opt.isCorrect && (
                                  <Badge className="text-xs bg-green-100 text-green-700 shrink-0">
                                    Correct
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* True/False Options */}
                        {q.questionType === "true_false" && (
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Correct answer:
                            </Label>
                            <div className="flex gap-4">
                              {q.options.map((opt, optIdx) => (
                                <label
                                  key={optIdx}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`tf_${q.id}`}
                                    checked={opt.isCorrect}
                                    onChange={() =>
                                      updateOption(q.id, optIdx, {
                                        isCorrect: true,
                                      })
                                    }
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm">{opt.text}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fill in the Blank */}
                        {q.questionType === "fill_in_the_blank" && (
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Correct answer(s) — separate multiple accepted
                              answers with commas
                            </Label>
                            <Input
                              value={q.correctAnswer}
                              onChange={(e) =>
                                updateQuestion(q.id, {
                                  correctAnswer: e.target.value,
                                })
                              }
                              placeholder="e.g., Jerusalem, jerusalem"
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {form.type === "exam" ? "Exam" : "Test"}
          </Button>
          <Link href={`/courses/${courseId}/assessments`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
