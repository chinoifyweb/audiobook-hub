import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowRight, Clock, BookOpen, GraduationCap } from "lucide-react";
import { getDb } from "@/lib/db";
import { formatNaira, degreeTypeLabel, semesterDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Explore our 7 academic programmes: 2 Bachelor of Arts degrees, PGD in Theology, 3 Master of Arts specialisations, and the Master of Divinity.",
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
  // Bachelor of Arts Programmes (90 Credits | 4 Years | 30 Courses)
  {
    id: "1",
    name: "B.A. Pastoral Ministry",
    code: "BA-PM-V2",
    description:
      "A comprehensive four-year programme equipping students for effective pastoral ministry through rigorous biblical studies, theological reflection, homiletics, pastoral care, and practical church leadership. 22 core courses plus 8 electives.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 90,
    tuitionPerSemester: 7500000,
    department: {
      name: "Department of Pastoral Ministry",
      faculty: { name: "Faculty of Ministry & Practical Studies" },
    },
  },
  {
    id: "2",
    name: "B.A. Christian Education",
    code: "BA-CE-V2",
    description:
      "A four-year programme preparing students to teach, design curricula, and lead educational ministries in churches, schools, and community settings with a strong biblical foundation. 22 core courses plus 8 electives.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 90,
    tuitionPerSemester: 7500000,
    department: {
      name: "Department of Missions & Education",
      faculty: { name: "Faculty of Ministry & Practical Studies" },
    },
  },
  // Postgraduate Diploma
  {
    id: "3",
    name: "PGD in Theology",
    code: "PGD-THEO-V2",
    description:
      "A one-year bridge programme for graduates of any discipline seeking to enter theological studies. 8 courses covering advanced hermeneutics, research methods, contemporary and biblical theology. Credits are transferable to M.A. programmes.",
    degreeType: "pgd",
    durationSemesters: 2,
    totalCredits: 24,
    tuitionPerSemester: 10000000,
    department: {
      name: "Department of Postgraduate Studies",
      faculty: { name: "Faculty of Postgraduate Studies" },
    },
  },
  // Master of Arts Programmes (36 Credits | 2 Years | 12 Courses)
  {
    id: "4",
    name: "M.A. Systematic Theology",
    code: "MA-ST-V2",
    description:
      "A two-year programme offering advanced study of Christian doctrine through historical, biblical, and philosophical perspectives. Prepares for doctoral studies, seminary teaching, and theological writing. 12 courses.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 36,
    tuitionPerSemester: 12500000,
    department: {
      name: "Department of Postgraduate Studies",
      faculty: { name: "Faculty of Postgraduate Studies" },
    },
  },
  {
    id: "5",
    name: "M.A. Pastoral Counselling",
    code: "MA-PC-V2",
    description:
      "A two-year programme integrating theology with psychology for effective soul care in churches, hospitals, and community settings. Includes trauma counselling and supervised practicum hours. 12 courses.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 36,
    tuitionPerSemester: 12500000,
    department: {
      name: "Department of Postgraduate Studies",
      faculty: { name: "Faculty of Postgraduate Studies" },
    },
  },
  {
    id: "6",
    name: "M.A. Christian Leadership",
    code: "MA-CL-V2",
    description:
      "A two-year programme developing transformational leaders for churches, ministries, and marketplace contexts through theological reflection, leadership theory, and governance best practices. 12 courses.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 36,
    tuitionPerSemester: 12500000,
    department: {
      name: "Department of Postgraduate Studies",
      faculty: { name: "Faculty of Postgraduate Studies" },
    },
  },
  // Master of Divinity (45 Credits | 3 Years | 15 Courses)
  {
    id: "7",
    name: "Master of Divinity (M.Div.)",
    code: "MDIV-V2",
    description:
      "The gold-standard three-year professional ministry degree covering biblical studies, systematic theology, pastoral care, homiletics, and supervised ministry practice. 15 courses.",
    degreeType: "masters",
    durationSemesters: 6,
    totalCredits: 45,
    tuitionPerSemester: 15000000,
    department: {
      name: "Department of Postgraduate Studies",
      faculty: { name: "Faculty of Postgraduate Studies" },
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
  pgd: 3,
  masters: 4,
  phd: 5,
};

const groupLabels: Record<string, string> = {
  bachelors: "Bachelor of Arts Programmes",
  pgd: "Postgraduate Diploma",
  masters: "Postgraduate Programmes",
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

  // Merge pgd into masters group for display
  if (grouped["pgd"] && grouped["masters"]) {
    grouped["masters"] = [...grouped["pgd"], ...grouped["masters"]];
    delete grouped["pgd"];
  } else if (grouped["pgd"]) {
    grouped["masters"] = grouped["pgd"];
    delete grouped["pgd"];
  }

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (degreeOrder[a] ?? 99) - (degreeOrder[b] ?? 99)
  );

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Academic Programmes
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            7 programmes across undergraduate and postgraduate levels with 48
            courses, delivered through our hybrid model of 70% online, 20%
            on-campus intensives, and 10% supervised practicum.
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
                  {groupLabels[degreeType] || `${degreeTypeLabel(degreeType)} Programs`}
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
                      <div className="mb-4 grid grid-cols-2 gap-2 text-center text-xs">
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
