"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Loader2, UserX, UserCheck } from "lucide-react";

interface Props {
  studentId: string;
  status: string;
}

export function StudentActions({ studentId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange(newStatus: "active" | "suspended") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update student status");
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {status === "active" ? (
          <Button
            variant="destructive"
            onClick={() => handleStatusChange("suspended")}
            disabled={loading}
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
            Suspend Student
          </Button>
        ) : status === "suspended" ? (
          <Button
            onClick={() => handleStatusChange("active")}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
            Reactivate Student
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            No actions available for students with &quot;{status}&quot; status.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
