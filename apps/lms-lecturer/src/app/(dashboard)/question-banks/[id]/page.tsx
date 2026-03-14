"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, Trash2, ArrowLeft, Loader2, Check } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: QuestionOption[] | null;
  correctAnswer: string | null;
  points: number;
  sortOrder: number;
}

interface QuestionBank {
  id: string;
  title: string;
  courseAssignment: {
    course: { code: string; title: string };
  };
  questions: Question[];
}

export default function QuestionBankDetailPage({ params }: Props) {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionType: "mcq",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ] as QuestionOption[],
    correctAnswer: "",
    points: 1,
  });

  const fetchBank = useCallback(async () => {
    try {
      const res = await fetch(`/api/question-banks?id=${params.id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setBank(data);
    } catch {
      setError("Failed to load question bank");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchBank();
  }, [fetchBank]);

  function resetForm() {
    setNewQuestion({
      questionText: "",
      questionType: "mcq",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "",
      points: 1,
    });
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        questionBankId: params.id,
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        points: newQuestion.points,
      };

      if (newQuestion.questionType === "mcq") {
        body.options = newQuestion.options;
      } else if (newQuestion.questionType === "true_false") {
        body.options = [
          { text: "True", isCorrect: newQuestion.correctAnswer === "true" },
          { text: "False", isCorrect: newQuestion.correctAnswer === "false" },
        ];
      } else if (newQuestion.questionType === "short_answer" || newQuestion.questionType === "fill_in_the_blank") {
        body.correctAnswer = newQuestion.correctAnswer;
      }

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add question");
      }

      resetForm();
      setShowAddForm(false);
      await fetchBank();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm("Delete this question?")) return;

    try {
      const res = await fetch(`/api/questions?id=${questionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchBank();
    } catch {
      setError("Failed to delete question");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Question bank not found.</p>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    mcq: "MCQ",
    true_false: "True/False",
    short_answer: "Short Answer",
    essay: "Essay",
    fill_in_the_blank: "Fill in Blank",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/question-banks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{bank.title}</h1>
          <p className="text-muted-foreground">
            {bank.courseAssignment.course.code} &middot;{" "}
            {bank.courseAssignment.course.title} &middot;{" "}
            {bank.questions.length} questions
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Question
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Add Question Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newQuestion.questionText}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, questionText: e.target.value })
                  }
                  placeholder="Enter the question..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={newQuestion.questionType}
                    onValueChange={(val) =>
                      setNewQuestion({ ...newQuestion, questionType: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                      <SelectItem value="fill_in_the_blank">Fill in the Blank</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        points: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                  />
                </div>
              </div>

              {/* MCQ Options */}
              {newQuestion.questionType === "mcq" && (
                <div className="space-y-3">
                  <Label>Options (check the correct answer)</Label>
                  {newQuestion.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const opts = [...newQuestion.options];
                          opts[i] = { ...opts[i], isCorrect: e.target.checked };
                          setNewQuestion({ ...newQuestion, options: opts });
                        }}
                        className="h-4 w-4 rounded"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const opts = [...newQuestion.options];
                          opts[i] = { ...opts[i], text: e.target.value };
                          setNewQuestion({ ...newQuestion, options: opts });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* True/False */}
              {newQuestion.questionType === "true_false" && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select
                    value={newQuestion.correctAnswer}
                    onValueChange={(val) =>
                      setNewQuestion({ ...newQuestion, correctAnswer: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Short Answer */}
              {newQuestion.questionType === "short_answer" && (
                <div className="space-y-2">
                  <Label>Expected Answer</Label>
                  <Input
                    value={newQuestion.correctAnswer}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    placeholder="Expected correct answer"
                  />
                </div>
              )}

              {/* Fill in the Blank */}
              {newQuestion.questionType === "fill_in_the_blank" && (
                <div className="space-y-2">
                  <Label>Correct Answer for the Blank</Label>
                  <Input
                    value={newQuestion.correctAnswer}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    placeholder="The word/phrase that fills the blank"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use &quot;_____&quot; in the question text to indicate the blank. The answer is case-insensitive.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={addLoading}>
                  {addLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Question
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({bank.questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bank.questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No questions in this bank yet.
            </p>
          ) : (
            <div className="space-y-4">
              {bank.questions.map((q, index) => (
                <div key={q.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Q{index + 1}.
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {typeLabel[q.questionType] || q.questionType}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {q.points} {q.points === 1 ? "pt" : "pts"}
                        </Badge>
                      </div>
                      <p className="text-sm">{q.questionText}</p>

                      {/* Show options for MCQ/True-False */}
                      {q.options && Array.isArray(q.options) && (
                        <div className="mt-2 space-y-1 pl-4">
                          {(q.options as QuestionOption[]).map((opt, oi) => (
                            <div
                              key={oi}
                              className="flex items-center gap-2 text-sm"
                            >
                              {opt.isCorrect ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <span className="w-3.5" />
                              )}
                              <span
                                className={
                                  opt.isCorrect ? "font-medium text-green-700" : ""
                                }
                              >
                                {String.fromCharCode(65 + oi)}. {opt.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {q.correctAnswer && (
                        <p className="text-sm text-green-700 pl-4">
                          Answer: {q.correctAnswer}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
