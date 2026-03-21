"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { ArrowLeft, BookOpen, Loader2, Search } from "lucide-react";

export default function TrackPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your tracking code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/application?track=${trimmed}`);
      if (!res.ok) {
        setError("No application found with that tracking code. Please check and try again.");
        return;
      }
      // Found — redirect to the tracking page
      router.push(`/application/track/${trimmed}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Track Application</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the tracking code you received after submitting your application.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Tracking Code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  placeholder="e.g. AB3K7NPQ"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  className="pl-10 text-center font-mono text-lg tracking-widest uppercase"
                  maxLength={8}
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                This is the 8-character code shown after you submitted your application.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || code.trim().length === 0}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Check Status
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signup">
                  New applicant? Create Account
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
