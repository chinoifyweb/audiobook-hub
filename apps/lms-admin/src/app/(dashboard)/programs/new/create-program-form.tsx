"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Loader2 } from "lucide-react";

interface Props {
  departments: Array<{ id: string; name: string; code: string }>;
}

const degreeTypes = [
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
];

export function CreateProgramForm({ departments }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      description: formData.get("description") as string,
      departmentId: formData.get("departmentId") as string,
      degreeType: formData.get("degreeType") as string,
      durationSemesters: parseInt(formData.get("durationSemesters") as string, 10),
      totalCredits: parseInt(formData.get("totalCredits") as string, 10),
      tuitionPerSemester: Math.round(parseFloat(formData.get("tuitionPerSemester") as string) * 100),
    };

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to create program");
        return;
      }

      router.push("/programs");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Program Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Certificate in Christian Leadership"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Program Code</Label>
              <Input
                id="code"
                name="code"
                placeholder="e.g. CCL"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Brief description of the program..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <select
                id="departmentId"
                name="departmentId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="degreeType">Degree Type</Label>
              <select
                id="degreeType"
                name="degreeType"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select degree type</option>
                {degreeTypes.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="durationSemesters">Duration (Semesters)</Label>
              <Input
                id="durationSemesters"
                name="durationSemesters"
                type="number"
                min="1"
                max="20"
                placeholder="e.g. 4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCredits">Total Credits</Label>
              <Input
                id="totalCredits"
                name="totalCredits"
                type="number"
                min="1"
                placeholder="e.g. 120"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tuitionPerSemester">Tuition/Semester ({"\u20A6"})</Label>
              <Input
                id="tuitionPerSemester"
                name="tuitionPerSemester"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50000"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Program
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
