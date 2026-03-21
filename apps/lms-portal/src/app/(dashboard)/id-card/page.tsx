"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Separator, Button } from "@repo/ui";
import { IdCard, Printer, Download, User, Loader2 } from "lucide-react";

interface StudentData {
  fullName: string;
  studentId: string;
  programName: string;
  departmentName: string;
  photoUrl: string | null;
  enrollmentDate: string;
  expectedGraduation: string | null;
  status: string;
  currentSemester: number;
}

export default function IdCardPage() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/student/profile");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load profile");
          return;
        }
        setStudent(data.student);
      } catch {
        setError("Failed to load student data");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Student ID Card</h1>
          <p className="text-muted-foreground">Your official student identification</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <IdCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error || "Student profile not found. Please contact admin."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student ID Card</h1>
          <p className="text-muted-foreground">
            Your official student identification
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* ID Card */}
      <div className="flex justify-center">
        <div className="w-[400px]" id="id-card">
          <Card className="overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] text-white p-4 text-center">
              <h2 className="text-lg font-bold tracking-wide">
                BEREAN BIBLE ACADEMY
              </h2>
              <p className="text-xs opacity-80 mt-1">
                Student Identification Card
              </p>
            </div>

            <CardContent className="py-6">
              <div className="flex gap-4">
                {/* Photo */}
                <div className="shrink-0">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt="Student photo"
                      className="h-28 w-24 rounded-lg object-cover border-2 border-[#1e3a5f]"
                    />
                  ) : (
                    <div className="h-28 w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm flex-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Full Name</p>
                    <p className="font-bold text-base">
                      {student.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Student ID</p>
                    <p className="font-mono font-bold text-[#1e3a5f]">
                      {student.studentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Program</p>
                    <p className="text-sm">{student.programName}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Department</p>
                  <p className="font-medium">{student.departmentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Enrolled</p>
                  <p className="font-medium">
                    {new Date(student.enrollmentDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Status</p>
                  <p className="font-medium capitalize">{student.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Semester</p>
                  <p className="font-medium">{student.currentSemester}</p>
                </div>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="bg-[#1e3a5f] px-4 py-2 text-center text-xs text-white/80">
              If found, please return to Berean Bible Academy
            </div>
          </Card>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Use the print button to save or print your ID card.
      </p>
    </div>
  );
}
