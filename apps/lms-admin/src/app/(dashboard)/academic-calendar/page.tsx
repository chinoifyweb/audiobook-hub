import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { format } from "date-fns";
import { AcademicCalendarClient } from "./academic-calendar-client";

export const dynamic = "force-dynamic";

export default async function AcademicCalendarPage() {
  const sessions = await prisma.academicSession.findMany({
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        orderBy: { number: "asc" },
        include: {
          calendarEvents: { orderBy: { startDate: "asc" } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academic Calendar</h1>
        <p className="text-muted-foreground">Manage sessions, semesters, and events</p>
      </div>

      <AcademicCalendarClient sessions={sessions} />
    </div>
  );
}
