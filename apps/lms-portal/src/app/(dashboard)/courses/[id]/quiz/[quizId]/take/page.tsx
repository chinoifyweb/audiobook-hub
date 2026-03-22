"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardContent, Badge, Separator } from "@repo/ui";
import {
  Loader2,
  Send,
  Flag,
  AlertTriangle,
  X,
} from "lucide-react";
import { useTestStore, type TestQuestion } from "@/stores/test-store";
import { PaymentGateClient } from "@/components/payment-gate-client";
import { QuizTimer } from "@/components/lms/quiz-timer";
import { QuizNav } from "@/components/lms/quiz-nav";

export default function QuizTakePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalDuration, setTotalDuration] = useState(0);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
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

  const submitQuiz = useCallback(async () => {
    if (isSubmitting || isSubmitted) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/courses/${params.id}/quiz/${params.quizId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: useTestStore.getState().attemptId,
            answers: useTestStore.getState().getAnswersArray(),
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit quiz");
        setSubmitting(false);
        return;
      }

      setSubmitted();
      reset();
      router.push(`/courses/${params.id}/quiz/${params.quizId}`);
      router.refresh();
    } catch {
      setError("Failed to submit quiz");
      setSubmitting(false);
    }
  }, [params.id, params.quizId, isSubmitting, isSubmitted, setSubmitting, setSubmitted, reset, router]);

  const handleTimeUp = useCallback(() => {
    submitQuiz();
  }, [submitQuiz]);

  const toggleFlag = useCallback(
    (index: number) => {
      setFlagged((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    },
    []
  );

  const clearChoice = useCallback(
    (questionId: string) => {
      setAnswer(questionId, { selectedOption: null, answerText: null });
    },
    [setAnswer]
  );

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function startQuiz() {
      try {
        const res = await fetch(`/api/tests/${params.quizId}/start`, {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to start quiz");
          return;
        }

        setTotalDuration(data.durationSeconds);
        initTest(
          data.attemptId,
          data.questions as TestQuestion[],
          data.durationSeconds
        );
      } catch {
        setError("Failed to start quiz");
      } finally {
        setLoading(false);
      }
    }

    startQuiz();
  }, [params.quizId, initTest]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Preparing your assessment...</p>
        <p className="text-xs text-gray-400 mt-1">Please do not close this page</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="font-bold text-lg mb-2">Unable to Start</h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Button
              onClick={() =>
                router.push(`/courses/${params.id}/quiz/${params.quizId}`)
              }
              variant="outline"
            >
              Back to Quiz Info
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="inline-flex rounded-full bg-green-100 p-4 mb-4">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-700 mb-2">
              Quiz Submitted!
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Your answers have been recorded successfully.
            </p>
            <Button
              onClick={() =>
                router.push(`/courses/${params.id}/quiz/${params.quizId}`)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion
    ? answers.get(currentQuestion.id)
    : null;

  const answeredIndices = new Set<number>();
  questions.forEach((q, i) => {
    const ans = answers.get(q.id);
    if (
      ans &&
      (ans.selectedOption !== null ||
        (ans.answerText && ans.answerText.trim()))
    ) {
      answeredIndices.add(i);
    }
  });

  if (!currentQuestion) return null;

  const hasAnswer =
    currentAnswer?.selectedOption !== null ||
    (currentAnswer?.answerText && currentAnswer.answerText.trim());

  const answerStatus = hasAnswer ? "Answer saved" : "Not yet answered";

  return (
    <PaymentGateClient message="Complete your tuition payment to take quizzes and assessments.">
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
      {/* Main content */}
      <div className="flex-1 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {/* Question Card - Moodle style with left info + right content */}
        <Card className="border shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left section - Question metadata */}
            <div className="md:w-56 shrink-0 bg-gray-50 border-b md:border-b-0 md:border-r p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Question {currentQuestionIndex + 1}
                </h3>
                <p className={`text-xs mt-1 ${hasAnswer ? "text-green-600" : "text-gray-500"}`}>
                  {answerStatus}
                </p>
              </div>

              <div className="text-xs text-gray-500">
                Marked out of {currentQuestion.points}
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={flagged.has(currentQuestionIndex)}
                    onChange={() => toggleFlag(currentQuestionIndex)}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <Flag
                    className={`h-3 w-3 ${
                      flagged.has(currentQuestionIndex)
                        ? "text-orange-500 fill-orange-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  <span className="text-gray-600 group-hover:text-gray-800">
                    Flag question
                  </span>
                </label>
              </div>
            </div>

            {/* Right section - Question content and answers */}
            <div className="flex-1 p-5">
              {/* Question text */}
              <p className="text-sm leading-relaxed text-gray-900 mb-5">
                {currentQuestion.questionText}
              </p>

              {/* MCQ options with a., b., c., d. labels */}
              {currentQuestion.questionType === "mcq" &&
                currentQuestion.options && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Select one:</p>
                    {(currentQuestion.options as { text: string }[]).map(
                      (option, idx) => {
                        const isSelected = currentAnswer?.selectedOption === idx;
                        const optionLetter = String.fromCharCode(97 + idx); // a, b, c, d...

                        return (
                          <label
                            key={idx}
                            className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              checked={isSelected}
                              onChange={() =>
                                setAnswer(currentQuestion.id, {
                                  selectedOption: idx,
                                })
                              }
                              className="mt-0.5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              <span className="font-medium text-gray-700">{optionLetter}.</span>{" "}
                              {option.text}
                            </span>
                          </label>
                        );
                      }
                    )}
                  </div>
                )}

              {/* True/False with a. True, b. False */}
              {currentQuestion.questionType === "true_false" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Select one:</p>
                  {["True", "False"].map((option, idx) => {
                    const isSelected = currentAnswer?.selectedOption === idx;
                    const optionLetter = String.fromCharCode(97 + idx); // a, b

                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          checked={isSelected}
                          onChange={() =>
                            setAnswer(currentQuestion.id, {
                              selectedOption: idx,
                            })
                          }
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">
                          <span className="font-medium text-gray-700">{optionLetter}.</span>{" "}
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Short Answer */}
              {currentQuestion.questionType === "short_answer" && (
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">
                    Type your answer below
                  </label>
                  <input
                    type="text"
                    className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm ring-offset-background placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Enter your answer..."
                    value={currentAnswer?.answerText || ""}
                    onChange={(e) =>
                      setAnswer(currentQuestion.id, {
                        answerText: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {/* Fill in the Blank */}
              {currentQuestion.questionType === "fill_in_the_blank" && (
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    Fill in the blank(s). If there are multiple blanks, separate
                    your answers with a comma.
                  </p>
                  <input
                    type="text"
                    className="flex h-11 w-full rounded-lg border border-dashed border-blue-300 bg-blue-50/30 px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
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
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">
                    Write your response below
                  </label>
                  <textarea
                    className="flex min-h-[180px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-y"
                    placeholder="Write your answer..."
                    value={currentAnswer?.answerText || ""}
                    onChange={(e) =>
                      setAnswer(currentQuestion.id, {
                        answerText: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {/* Clear my choice link */}
              {hasAnswer && (
                <button
                  onClick={() => clearChoice(currentQuestion.id)}
                  className="mt-3 text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
                >
                  Clear my choice
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Navigation between questions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Previous page
          </button>

          <button
            onClick={() => {
              if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestion(currentQuestionIndex + 1);
              }
            }}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Next page
          </button>
        </div>

        {/* Finish attempt button - always visible at bottom */}
        <div className="border-t pt-4">
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
            variant="outline"
            className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Finish attempt...
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="lg:w-72 shrink-0">
        <div className="sticky top-20 space-y-4">
          {/* Timer with circular dials */}
          <Card className="border shadow-sm">
            <CardContent className="py-5">
              <QuizTimer
                timeRemainingSeconds={timeRemainingSeconds}
                totalSeconds={totalDuration}
                onTick={tick}
                onTimeUp={handleTimeUp}
              />
            </CardContent>
          </Card>

          {/* Navigation grid */}
          <Card className="border shadow-sm">
            <CardContent className="py-4">
              <QuizNav
                totalQuestions={questions.length}
                currentIndex={currentQuestionIndex}
                answeredIndices={answeredIndices}
                flaggedIndices={flagged}
                onNavigate={setCurrentQuestion}
              />

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Answered</span>
                  <span className="font-semibold text-gray-900">
                    {answeredIndices.size}/{questions.length}
                  </span>
                </div>
                {flagged.size > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Flagged</span>
                    <span className="font-semibold text-orange-600">
                      {flagged.size}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Finish attempt link in sidebar */}
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isSubmitting}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors w-full text-left"
              >
                Finish attempt...
              </button>
            </CardContent>
          </Card>

          {/* Mobile timer */}
          <div className="lg:hidden fixed top-16 right-4 z-30">
            <div className="flex items-center gap-1 rounded-lg bg-white shadow-lg border px-3 py-1.5 text-sm font-mono font-bold text-blue-700">
              {Math.floor(timeRemainingSeconds / 60)}:
              {String(timeRemainingSeconds % 60).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal - exact reference design */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm mx-4 border-0 shadow-2xl rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-base font-bold text-gray-900">
                  Submit all your answers and finish?
                </h3>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-5 py-5">
                <p className="text-sm text-gray-600">
                  Once you submit your answers, you won't be able to change them.
                </p>

                {answeredIndices.size < questions.length && (
                  <p className="text-sm text-orange-600 mt-3">
                    You have {questions.length - answeredIndices.size} unanswered
                    question{questions.length - answeredIndices.size !== 1 ? "s" : ""}.
                  </p>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t bg-gray-50">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirm(false);
                    submitQuiz();
                  }}
                  disabled={isSubmitting}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit all and finish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </PaymentGateClient>
  );
}
