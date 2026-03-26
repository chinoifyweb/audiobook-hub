import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Users,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { formatNaira, degreeTypeLabel, semesterDuration } from "@/lib/format";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

interface CourseData {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  semesterNumber: number;
  isElective: boolean;
}

interface ProgramDetail {
  id: string;
  name: string;
  code: string;
  description: string | null;
  degreeType: string;
  durationSemesters: number;
  totalCredits: number;
  tuitionPerSemester: number;
  department: {
    name: string;
    faculty: {
      name: string;
    };
  };
  courses: CourseData[];
}

const placeholderDetail: Record<string, ProgramDetail> = {
  BBS: {
    id: "5",
    name: "Bachelor of Biblical Studies",
    code: "BBS",
    description:
      "The Bachelor of Biblical Studies is an in-depth academic program covering Old and New Testament, hermeneutics, biblical languages, and practical ministry. This degree prepares students for further graduate study or immediate ministry engagement.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 120,
    tuitionPerSemester: 5000000,
    department: {
      name: "Department of Biblical Studies",
      faculty: { name: "Faculty of Theology" },
    },
    courses: [
      { id: "c1", code: "BIB101", title: "Introduction to the Old Testament", creditUnits: 3, semesterNumber: 1, isElective: false },
      { id: "c2", code: "BIB102", title: "Introduction to the New Testament", creditUnits: 3, semesterNumber: 1, isElective: false },
      { id: "c3", code: "THE101", title: "Foundations of Christian Theology", creditUnits: 3, semesterNumber: 1, isElective: false },
      { id: "c4", code: "MIN101", title: "Principles of Christian Ministry", creditUnits: 2, semesterNumber: 1, isElective: false },
      { id: "c5", code: "GEN101", title: "Academic Writing & Research", creditUnits: 2, semesterNumber: 1, isElective: false },
      { id: "c6", code: "BIB201", title: "Pentateuch Studies", creditUnits: 3, semesterNumber: 2, isElective: false },
      { id: "c7", code: "BIB202", title: "Gospels and Acts", creditUnits: 3, semesterNumber: 2, isElective: false },
      { id: "c8", code: "THE201", title: "Systematic Theology I", creditUnits: 3, semesterNumber: 2, isElective: false },
      { id: "c9", code: "HIS201", title: "Church History I", creditUnits: 3, semesterNumber: 2, isElective: false },
      { id: "c10", code: "BIB301", title: "Biblical Hermeneutics", creditUnits: 3, semesterNumber: 3, isElective: false },
      { id: "c11", code: "BIB302", title: "Pauline Epistles", creditUnits: 3, semesterNumber: 3, isElective: false },
      { id: "c12", code: "THE301", title: "Systematic Theology II", creditUnits: 3, semesterNumber: 3, isElective: false },
      { id: "c13", code: "MIN301", title: "Homiletics (Preaching)", creditUnits: 3, semesterNumber: 4, isElective: false },
      { id: "c14", code: "BIB401", title: "Prophetic Literature", creditUnits: 3, semesterNumber: 4, isElective: false },
      { id: "c15", code: "ETH401", title: "Christian Ethics", creditUnits: 3, semesterNumber: 4, isElective: false },
    ],
  },
};

async function getProgram(code: string): Promise<ProgramDetail | null> {
  try {
    const db = await getDb();
    if (!db) {
      return placeholderDetail[code.toUpperCase()] || null;
    }

    const program = await db.program.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
        courses: {
          orderBy: [{ semesterNumber: "asc" }, { code: "asc" }],
        },
      },
    });

    if (!program) {
      return placeholderDetail[code.toUpperCase()] || null;
    }

    return program as unknown as ProgramDetail;
  } catch {
    return placeholderDetail[code.toUpperCase()] || null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const program = await getProgram(params.code);
  if (!program) {
    return { title: "Program Not Found" };
  }
  return {
    title: program.name,
    description:
      program.description ||
      `Learn more about the ${program.name} program at Berean Bible Academy.`,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: { code: string };
}) {
  const program = await getProgram(params.code);

  if (!program) {
    notFound();
  }

  // Group courses by semester
  const coursesBySemester = program.courses.reduce<
    Record<number, CourseData[]>
  >((acc, course) => {
    const key = course.semesterNumber;
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});

  const sortedSemesters = Object.entries(coursesBySemester)
    .map(([sem, courses]) => ({ semester: Number(sem), courses }))
    .sort((a, b) => a.semester - b.semester);

  const totalTuition = program.tuitionPerSemester * program.durationSemesters;

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container">
          <Link
            href="/programs"
            className="mb-4 inline-flex items-center gap-1 text-sm text-blue-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Programs
          </Link>
          <div className="flex items-start gap-3">
            <Badge className="mt-1 bg-white/20 text-white hover:bg-white/30">
              {degreeTypeLabel(program.degreeType)}
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {program.name}
              </h1>
              <p className="mt-2 text-blue-100">
                {program.department.name} &middot;{" "}
                {program.department.faculty.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Description */}
              {program.description && (
                <div className="mb-10">
                  <h2 className="mb-3 text-xl font-semibold">
                    Program Overview
                  </h2>
                  <p className="leading-relaxed text-muted-foreground">
                    {program.description}
                  </p>
                </div>
              )}

              {/* Course List */}
              {sortedSemesters.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-semibold">Course List</h2>
                  <div className="space-y-6">
                    {sortedSemesters.map(({ semester, courses }) => (
                      <div key={semester}>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Semester {semester}
                        </h3>
                        <div className="overflow-hidden rounded-lg border">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                                  Code
                                </th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                                  Course Title
                                </th>
                                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">
                                  Credits
                                </th>
                                <th className="hidden px-4 py-2.5 text-center font-medium text-muted-foreground sm:table-cell">
                                  Type
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {courses.map((course) => (
                                <tr key={course.id}>
                                  <td className="px-4 py-2.5 font-mono text-xs">
                                    {course.code}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {course.title}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    {course.creditUnits}
                                  </td>
                                  <td className="hidden px-4 py-2.5 text-center sm:table-cell">
                                    <Badge
                                      variant={
                                        course.isElective
                                          ? "outline"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {course.isElective
                                        ? "Elective"
                                        : "Required"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sortedSemesters.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p>
                      The detailed course list for this program will be
                      available soon. Please contact us for more information.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Program Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Degree Type
                      </div>
                      <div className="font-medium">
                        {degreeTypeLabel(program.degreeType)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Duration
                      </div>
                      <div className="font-medium">
                        {semesterDuration(program.durationSemesters)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Total Credits
                      </div>
                      <div className="font-medium">
                        {program.totalCredits} Credit Units
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Department
                      </div>
                      <div className="font-medium">
                        {program.department.name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tuition */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tuition & Fees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Per Semester
                    </span>
                    <span className="font-semibold">
                      &#8358;{formatNaira(program.tuitionPerSemester)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total ({program.durationSemesters} Semesters)
                    </span>
                    <span className="font-semibold">
                      &#8358;{formatNaira(totalTuition)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tuition is payable per semester. Payment plans are available.
                  </p>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="space-y-3 pt-6">
                  <h3 className="font-semibold">Ready to Apply?</h3>
                  <p className="text-sm text-muted-foreground">
                    Start your application today and take the first step toward
                    your degree.
                  </p>
                  <Button className="w-full" asChild>
                    <Link href={`${PORTAL_URL}/application`}>
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/admissions">View Requirements</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
