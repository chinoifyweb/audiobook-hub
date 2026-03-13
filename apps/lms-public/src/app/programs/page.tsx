import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowRight, Clock, BookOpen, GraduationCap } from "lucide-react";
import { getDb } from "@/lib/db";
import { formatNaira, degreeTypeLabel, semesterDuration } from "@/lib/format";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Explore our range of accredited biblical education programs, from certificates to master's degrees.",
};

interface ProgramData {
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
}

const placeholderPrograms: ProgramData[] = [
  {
    id: "1",
    name: "Certificate in Christian Ministry",
    code: "CCM",
    description:
      "A foundational program equipping believers with essential ministry skills and biblical knowledge for effective service.",
    degreeType: "certificate",
    durationSemesters: 2,
    totalCredits: 30,
    tuitionPerSemester: 2500000,
    department: {
      name: "Department of Ministry Studies",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "2",
    name: "Certificate in Christian Education",
    code: "CCE",
    description:
      "Designed for Sunday School teachers and Christian educators seeking to improve their teaching methods and biblical understanding.",
    degreeType: "certificate",
    durationSemesters: 2,
    totalCredits: 28,
    tuitionPerSemester: 2500000,
    department: {
      name: "Department of Christian Education",
      faculty: { name: "Faculty of Education" },
    },
  },
  {
    id: "3",
    name: "Diploma in Theology",
    code: "DIT",
    description:
      "A comprehensive study of systematic theology, church history, and pastoral ministry for aspiring church leaders.",
    degreeType: "diploma",
    durationSemesters: 4,
    totalCredits: 60,
    tuitionPerSemester: 3500000,
    department: {
      name: "Department of Systematic Theology",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "4",
    name: "Diploma in Pastoral Studies",
    code: "DPS",
    description:
      "Practical training in pastoral care, counseling, preaching, and church administration for ministry workers.",
    degreeType: "diploma",
    durationSemesters: 4,
    totalCredits: 58,
    tuitionPerSemester: 3500000,
    department: {
      name: "Department of Pastoral Studies",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "5",
    name: "Bachelor of Biblical Studies",
    code: "BBS",
    description:
      "An in-depth academic program covering Old and New Testament, hermeneutics, biblical languages, and practical ministry.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 120,
    tuitionPerSemester: 5000000,
    department: {
      name: "Department of Biblical Studies",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "6",
    name: "Bachelor of Christian Leadership",
    code: "BCL",
    description:
      "Combines theological foundations with leadership principles to develop effective Christian leaders for church and society.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 118,
    tuitionPerSemester: 5000000,
    department: {
      name: "Department of Leadership Studies",
      faculty: { name: "Faculty of Ministry" },
    },
  },
  {
    id: "7",
    name: "Master of Divinity",
    code: "MDIV",
    description:
      "An advanced professional degree for those called to pastoral ministry, missions, or academic pursuits in biblical and theological studies.",
    degreeType: "masters",
    durationSemesters: 6,
    totalCredits: 90,
    tuitionPerSemester: 7500000,
    department: {
      name: "Department of Advanced Theological Studies",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "8",
    name: "Master of Arts in Biblical Counseling",
    code: "MABC",
    description:
      "Equips students with biblical principles and practical skills for effective counseling ministry in church and community contexts.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 60,
    tuitionPerSemester: 7500000,
    department: {
      name: "Department of Counseling",
      faculty: { name: "Faculty of Ministry" },
    },
  },
];

async function getPrograms(): Promise<ProgramData[]> {
  try {
    const db = await getDb();
    if (!db) return placeholderPrograms;

    const programs = await db.program.findMany({
      where: { isActive: true },
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
      },
      orderBy: [{ degreeType: "asc" }, { name: "asc" }],
    });

    if (programs.length === 0) return placeholderPrograms;
    return programs as unknown as ProgramData[];
  } catch {
    return placeholderPrograms;
  }
}

const degreeOrder: Record<string, number> = {
  certificate: 0,
  diploma: 1,
  bachelors: 2,
  masters: 3,
  phd: 4,
};

export default async function ProgramsPage() {
  const programs = await getPrograms();

  // Group by degree type
  const grouped = programs.reduce<Record<string, ProgramData[]>>(
    (acc, program) => {
      const key = program.degreeType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(program);
      return acc;
    },
    {}
  );

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (degreeOrder[a] ?? 99) - (degreeOrder[b] ?? 99)
  );

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Academic Programs
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            From foundational certificates to advanced master&apos;s degrees,
            find the program that aligns with your calling and career goals.
          </p>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="container">
          {sortedGroups.map(([degreeType, groupPrograms]) => (
            <div key={degreeType} className="mb-12 last:mb-0">
              <div className="mb-6 flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">
                  {degreeTypeLabel(degreeType)} Programs
                </h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groupPrograms.map((program) => (
                  <Card
                    key={program.id}
                    className="flex flex-col transition-shadow hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {degreeTypeLabel(program.degreeType)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {program.code}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {program.department.name} &middot;{" "}
                        {program.department.faculty.name}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <p className="mb-4 flex-1 text-sm text-muted-foreground">
                        {program.description}
                      </p>
                      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-md bg-slate-50 p-2">
                          <Clock className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                          <div className="font-medium">
                            {semesterDuration(program.durationSemesters)}
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-50 p-2">
                          <BookOpen className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                          <div className="font-medium">
                            {program.totalCredits} Credits
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-50 p-2">
                          <span className="mb-1 block text-base font-semibold text-primary">
                            &#8358;
                          </span>
                          <div className="font-medium">
                            {formatNaira(program.tuitionPerSemester)}/sem
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/programs/${program.code}`}>
                          View Details
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
