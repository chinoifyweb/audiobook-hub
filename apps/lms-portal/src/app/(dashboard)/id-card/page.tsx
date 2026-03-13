import { requireStudent } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, Button, Separator } from "@repo/ui";
import { IdCard, Printer, User } from "lucide-react";
import { format } from "date-fns";

export default async function IdCardPage() {
  const { studentProfile } = await requireStudent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student ID Card</h1>
          <p className="text-muted-foreground">
            Your official student identification
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {}}
          className="print:hidden"
          id="print-btn"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print ID Card
        </Button>
      </div>

      {/* ID Card */}
      <div className="flex justify-center">
        <div className="w-[400px]" id="id-card">
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-700 text-primary-foreground p-4 text-center">
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
                  {studentProfile.photoUrl ? (
                    <img
                      src={studentProfile.photoUrl}
                      alt="Student photo"
                      className="h-28 w-24 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-28 w-24 rounded-lg bg-muted flex items-center justify-center border">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-bold text-base">
                      {studentProfile.user?.fullName || "Student"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Student ID</p>
                    <p className="font-mono font-bold">
                      {studentProfile.studentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Program</p>
                    <p>{studentProfile.program.name}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {studentProfile.program.department.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Enrolled</p>
                  <p className="font-medium">
                    {format(
                      new Date(studentProfile.enrollmentDate),
                      "MMM yyyy"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">
                    {studentProfile.status}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Semester</p>
                  <p className="font-medium">
                    {studentProfile.currentSemester}
                  </p>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="mt-4 flex justify-center">
                <div className="h-20 w-20 rounded bg-muted flex items-center justify-center border">
                  <span className="text-[10px] text-muted-foreground text-center">
                    QR Code
                  </span>
                </div>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
              If found, please return to Berean Bible Academy
            </div>
          </Card>
        </div>
      </div>

      {/* Print Script */}
      <PrintScript />
    </div>
  );
}

function PrintScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('print-btn')?.addEventListener('click', function() {
            window.print();
          });
        `,
      }}
    />
  );
}
