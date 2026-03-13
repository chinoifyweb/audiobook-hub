"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Separator,
} from "@repo/ui";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";

interface ProgramOption {
  id: string;
  name: string;
  code: string;
  degreeType: string;
  durationSemesters: number;
}

interface EducationEntry {
  institution: string;
  qualification: string;
  year: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  previousEducation: EducationEntry[];
  programId: string;
  documents: string[];
}

const STEPS = [
  "Personal Information",
  "Education History",
  "Program Selection",
  "Document Upload",
  "Review & Submit",
];

export default function ApplicationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: session?.user?.email || "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    previousEducation: [{ institution: "", qualification: "", year: "" }],
    programId: "",
    documents: [],
  });

  useEffect(() => {
    if (session?.user?.email) {
      setFormData((prev) => ({ ...prev, email: session.user!.email! }));
    }
    // Fetch available programs
    fetch("/api/application?programs=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.programs) setPrograms(data.programs);
      })
      .catch(() => {});
  }, [session]);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function addEducation() {
    setFormData((prev) => ({
      ...prev,
      previousEducation: [
        ...prev.previousEducation,
        { institution: "", qualification: "", year: "" },
      ],
    }));
  }

  function removeEducation(index: number) {
    setFormData((prev) => ({
      ...prev,
      previousEducation: prev.previousEducation.filter((_, i) => i !== index),
    }));
  }

  function updateEducation(index: number, field: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      previousEducation: prev.previousEducation.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return !!(formData.firstName && formData.lastName && formData.email);
      case 1:
        return formData.previousEducation.some((e) => e.institution && e.qualification);
      case 2:
        return !!formData.programId;
      case 3:
        return true; // Documents are optional for now
      case 4:
        return true;
      default:
        return false;
    }
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit application");
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-700">Application Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your application has been received and is being reviewed. You will be
              notified of the outcome via email.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push("/application/status")}>
                Track Application Status
              </Button>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedProgram = programs.find((p) => p.id === formData.programId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Berean Bible Academy</h1>
          <p className="text-muted-foreground">Student Admission Application</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block h-0.5 w-8 mx-1 ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Step 1: Personal Information */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(val) => updateField("gender", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Education History */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add your previous educational qualifications.
                </p>
                {formData.previousEducation.map((entry, index) => (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Entry {index + 1}</span>
                      {formData.previousEducation.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={entry.institution}
                        onChange={(e) =>
                          updateEducation(index, "institution", e.target.value)
                        }
                        placeholder="e.g. University of Lagos"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Qualification</Label>
                        <Input
                          value={entry.qualification}
                          onChange={(e) =>
                            updateEducation(index, "qualification", e.target.value)
                          }
                          placeholder="e.g. B.Sc., SSCE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          value={entry.year}
                          onChange={(e) =>
                            updateEducation(index, "year", e.target.value)
                          }
                          placeholder="e.g. 2020"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addEducation} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Entry
                </Button>
              </div>
            )}

            {/* Step 3: Program Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the program you wish to apply for.
                </p>
                <div className="space-y-2">
                  <Label>Program *</Label>
                  <Select
                    value={formData.programId}
                    onValueChange={(val) => updateField("programId", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedProgram && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <h4 className="font-medium">{selectedProgram.name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Code: {selectedProgram.code}</div>
                      <div>Type: {selectedProgram.degreeType}</div>
                      <div>Duration: {selectedProgram.durationSemesters} semesters</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Document Upload */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload supporting documents. You can also submit these later.
                </p>
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Document upload will be available soon. You may proceed to submit
                    your application and upload documents later.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Name</div>
                    <div>{formData.firstName} {formData.lastName}</div>
                    <div className="text-muted-foreground">Email</div>
                    <div>{formData.email}</div>
                    <div className="text-muted-foreground">Phone</div>
                    <div>{formData.phone || "Not provided"}</div>
                    <div className="text-muted-foreground">Date of Birth</div>
                    <div>{formData.dateOfBirth || "Not provided"}</div>
                    <div className="text-muted-foreground">Gender</div>
                    <div>{formData.gender || "Not provided"}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Education History</h4>
                  {formData.previousEducation
                    .filter((e) => e.institution)
                    .map((entry, i) => (
                      <div key={i} className="text-sm">
                        {entry.institution} - {entry.qualification} ({entry.year})
                      </div>
                    ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Selected Program</h4>
                  <div className="text-sm">
                    {selectedProgram ? (
                      <span>
                        {selectedProgram.name} ({selectedProgram.code})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No program selected</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link
            href="/application/status"
            className="text-sm text-primary hover:underline"
          >
            Already applied? Check your application status
          </Link>
        </div>
      </div>
    </div>
  );
}
