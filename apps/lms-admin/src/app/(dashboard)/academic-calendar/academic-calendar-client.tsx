"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Plus, Loader2, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string | Date;
  endDate: string | Date | null;
}

interface SemesterData {
  id: string;
  name: string;
  number: number;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  calendarEvents: CalendarEvent[];
}

interface SessionData {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  semesters: SemesterData[];
}

interface Props {
  sessions: SessionData[];
}

const eventTypeColors: Record<string, string> = {
  registration: "bg-blue-100 text-blue-800",
  lectures_start: "bg-green-100 text-green-800",
  mid_semester: "bg-yellow-100 text-yellow-800",
  exam_start: "bg-red-100 text-red-800",
  exam_end: "bg-red-100 text-red-800",
  results_release: "bg-purple-100 text-purple-800",
  break_period: "bg-gray-100 text-gray-800",
  other: "bg-gray-100 text-gray-800",
};

export function AcademicCalendarClient({ sessions }: Props) {
  const router = useRouter();
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(sessions.filter((s) => s.isActive).map((s) => s.id))
  );

  function toggleExpanded(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  async function handleCreateSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/academic-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "session",
          name: formData.get("name"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create session");
        return;
      }
      setShowSessionForm(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowSessionForm(!showSessionForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      {showSessionForm && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Create Academic Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input id="name" name="name" placeholder="e.g. 2025/2026" required />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSessionForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No academic sessions found. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleExpanded(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expanded.has(session.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <CardTitle className="text-lg">{session.name}</CardTitle>
                    {session.isActive && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.startDate), "MMM d, yyyy")} –{" "}
                    {format(new Date(session.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </CardHeader>
              {expanded.has(session.id) && (
                <CardContent className="space-y-4">
                  {session.semesters.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No semesters configured.</p>
                  ) : (
                    session.semesters.map((sem) => (
                      <div key={sem.id} className="rounded-md border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium">{sem.name}</h4>
                            {sem.isActive && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(sem.startDate), "MMM d")} – {format(new Date(sem.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        {sem.calendarEvents.length > 0 && (
                          <div className="space-y-1">
                            {sem.calendarEvents.map((evt) => (
                              <div key={evt.id} className="flex items-center gap-2 text-sm">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${eventTypeColors[evt.eventType] || "bg-gray-100 text-gray-800"}`}>
                                  {evt.eventType.replace("_", " ")}
                                </span>
                                <span>{evt.title}</span>
                                <span className="text-muted-foreground">
                                  — {format(new Date(evt.startDate), "MMM d")}
                                  {evt.endDate && ` to ${format(new Date(evt.endDate), "MMM d")}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  );
}
