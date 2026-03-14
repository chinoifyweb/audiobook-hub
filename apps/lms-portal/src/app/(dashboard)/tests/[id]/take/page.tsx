"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardContent, Badge, Separator } from "@repo/ui";
import { Loader2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useTestStore, type TestQuestion } from "@/stores/test-store";
import { Timer } from "@/components/timer";
import { QuestionNav } from "@/components/question-nav";

export default function TestTakePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasStarted = useRef(false);

  const {
    attemptId,
    questions,
    answers,
    currentQuestionIndex,
    timeRemainingSeconds,
    isSubmitting,
    isSubmitted,
    initTest,
    setCurrentQuestion,
    setAnswer,
    tick,
    setSubmitting,
    setSubmitted,
    getAnswersArray,
    reset,
  } = useTestStore();

  const submitTest = useCallback(async () => {
    if (isSubmitting || isSubmitted) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tests/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: useTestStore.getState().attemptId,
          answers: useTestStore.getState().getAnswersArray(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit test");
        setSubmitting(false);
        return;
      }

      setSubmitted();
      reset();
      router.push(`/tests/${params.id}`);
      router.refresh();
    } catch {
      setError("Failed to submit test");
      setSubmitting(false);
    }
  }, [params.id, isSubmitting, isSubmitted, setSubmitting, setSubmitted, reset, router]);

  const handleTimeUp = useCallback(() => {
    submitTest();
  }, [submitTest]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function startTest() {
      try {
        const res = await fetch(`/api/tests/${params.id}/start`, {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to start test");
          return;
        }

        initTest(
          data.attemptId,
          data.questions as TestQuestion[],
          data.durationSeconds
        );
      } catch {
        setError("Failed to start test");
      } finally {
        setLoading(false);
      }
    }

    startTest();
  }, [params.id, initTest]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading test...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push(`/tests/${params.id}`)}>
            Back to Test Info
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-green-600 mb-4">
            Test submitted successfully!
          </p>
          <Button onClick={() => router.push(`/tests/${params.id}`)}>
            View Results
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion
    ? answers.get(currentQuestion.id)
    : null;

  const answeredIndices = new Set<number>();
  questions.forEach((q, i) => {
    const ans = answers.get(q.id);
    if (ans && (ans.selectedOption !== null || (ans.answerText && ans.answerText.trim()))) {
      answeredIndices.add(i);
    }
  });

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Header with timer */}
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
          <Timer
            timeRemainingSeconds={timeRemainingSeconds}
            onTick={tick}
            onTimeUp={handleTimeUp}
          />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Question Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-lg font-medium leading-relaxed">
                {currentQuestion.questionText}
              </p>
              <Badge variant="secondary" className="ml-4 shrink-0">
                {currentQuestion.points} {currentQuestion.points === 1 ? "pt" : "pts"}
              </Badge>
            </div>

            <Separator className="my-4" />

            {/* MCQ */}
            {currentQuestion.questionType === "mcq" &&
              currentQuestion.options && (
                <div className="space-y-3">
                  {(currentQuestion.options as { text: string }[]).map(
                    (option, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                          currentAnswer?.selectedOption === idx
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          checked={currentAnswer?.selectedOption === idx}
                          onChange={() =>
                            setAnswer(currentQuestion.id, {
                              selectedOption: idx,
                            })
                          }
                          className="h-4 w-4 text-primary"
                        />
                        <span>{option.text}</span>
                      </label>
                    )
                  )}
                </div>
              )}

            {/* True/False */}
            {currentQuestion.questionType === "true_false" && (
              <div className="space-y-3">
                {["True", "False"].map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      currentAnswer?.selectedOption === idx
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      checked={currentAnswer?.selectedOption === idx}
                      onChange={() =>
                        setAnswer(currentQuestion.id, {
                          selectedOption: idx,
                        })
                      }
                      className="h-4 w-4 text-primary"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Short Answer */}
            {currentQuestion.questionType === "short_answer" && (
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Type your answer..."
                value={currentAnswer?.answerText || ""}
                onChange={(e) =>
                  setAnswer(currentQuestion.id, {
                    answerText: e.target.value,
                  })
                }
              />
            )}

            {/* Fill in the Blank */}
            {currentQuestion.questionType === "fill_in_the_blank" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fill in the blank(s). If multiple blanks, separate answers with a comma.
                </p>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border-2 border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Type your answer(s) here..."
                  value={currentAnswer?.answerText || ""}
                  onChange={(e) =>
                    setAnswer(currentQuestion.id, {
                      answerText: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {/* Essay */}
            {currentQuestion.questionType === "essay" && (
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Write your answer..."
                value={currentAnswer?.answerText || ""}
                onChange={(e) =>
                  setAnswer(currentQuestion.id, {
                    answerText: e.target.value,
                  })
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submitTest}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Send className="mr-2 h-4 w-4" />
              Submit Test
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigation Sidebar */}
      <div className="lg:w-64 shrink-0">
        <Card className="sticky top-20">
          <CardContent className="py-4">
            <QuestionNav
              totalQuestions={questions.length}
              currentIndex={currentQuestionIndex}
              answeredIndices={answeredIndices}
              onNavigate={setCurrentQuestion}
            />

            <Separator className="my-4" />

            <div className="text-sm text-muted-foreground mb-3">
              {answeredIndices.size} of {questions.length} answered
            </div>

            <Button
              onClick={submitTest}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Test
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
