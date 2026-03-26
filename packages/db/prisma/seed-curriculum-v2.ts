/**
 * Curriculum V2 Seed Script
 *
 * Restructures the Berean Bible Academy curriculum from 222 courses / 12 programmes
 * down to 48 courses / 7 programmes.
 *
 * NOTE: This script was already executed against production on 2026-03-26 via
 * direct SQL through the Supabase MCP tools. It is kept here for reference and
 * for seeding new environments.
 *
 * Programmes (7):
 *   1. B.A. Pastoral Ministry       (4 yrs, 30 courses, 90 cr)
 *   2. B.A. Christian Education     (4 yrs, 30 courses, 90 cr)
 *   3. PGD in Theology              (1 yr,   8 courses, 24 cr)
 *   4. M.A. Systematic Theology     (2 yrs, 12 courses, 36 cr)
 *   5. M.A. Pastoral Counselling    (2 yrs, 12 courses, 36 cr)
 *   6. M.A. Christian Leadership    (2 yrs, 12 courses, 36 cr)
 *   7. M.Div                        (3 yrs, 15 courses, 45 cr)
 *
 * Courses (48):
 *   22 B.A. core + 4 Pastoral Ministry electives + 4 Christian Education electives
 *   + 4 shared electives + 14 postgraduate courses
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Curriculum V2 seed...");

  // ── Step 1: Deactivate all existing programs ──────────────────────────────
  await prisma.program.updateMany({
    data: { isActive: false },
  });
  console.log("All existing programs deactivated.");

  // Disconnect old courses from programs
  await prisma.course.updateMany({
    data: { programId: null },
  });
  console.log("Old courses disconnected from programs.");

  // ── Step 2: Create/update faculties ───────────────────────────────────────
  const facTBS = await prisma.faculty.upsert({
    where: { code: "TBS" },
    update: { name: "Faculty of Theology & Biblical Studies", description: "Biblical and Theological Studies" },
    create: { name: "Faculty of Theology & Biblical Studies", code: "TBS", description: "Biblical and Theological Studies" },
  });

  const facMPS = await prisma.faculty.upsert({
    where: { code: "MPS" },
    update: { name: "Faculty of Ministry & Practical Studies", description: "Pastoral, Missions, and Education Studies" },
    create: { name: "Faculty of Ministry & Practical Studies", code: "MPS", description: "Pastoral, Missions, and Education Studies" },
  });

  const facPGS = await prisma.faculty.upsert({
    where: { code: "PGS" },
    update: { name: "Faculty of Postgraduate Studies", description: "Postgraduate Theological Studies" },
    create: { name: "Faculty of Postgraduate Studies", code: "PGS", description: "Postgraduate Theological Studies" },
  });

  console.log("Faculties created/updated.");

  // ── Step 3: Create/update departments ─────────────────────────────────────
  const deptBIB = await prisma.department.upsert({
    where: { code: "BIB" },
    update: { facultyId: facTBS.id, name: "Department of Biblical Studies" },
    create: { facultyId: facTBS.id, name: "Department of Biblical Studies", code: "BIB" },
  });

  const deptTHD = await prisma.department.upsert({
    where: { code: "THD" },
    update: { facultyId: facTBS.id, name: "Department of Theology & Doctrine" },
    create: { facultyId: facTBS.id, name: "Department of Theology & Doctrine", code: "THD" },
  });

  const deptGEN = await prisma.department.upsert({
    where: { code: "GEN" },
    update: { facultyId: facTBS.id, name: "Department of General Studies" },
    create: { facultyId: facTBS.id, name: "Department of General Studies", code: "GEN" },
  });

  const deptPAS = await prisma.department.upsert({
    where: { code: "PAS" },
    update: { facultyId: facMPS.id, name: "Department of Pastoral Ministry" },
    create: { facultyId: facMPS.id, name: "Department of Pastoral Ministry", code: "PAS" },
  });

  const deptMIS = await prisma.department.upsert({
    where: { code: "MIS" },
    update: { facultyId: facMPS.id, name: "Department of Missions & Education" },
    create: { facultyId: facMPS.id, name: "Department of Missions & Education", code: "MIS" },
  });

  const deptPGS = await prisma.department.upsert({
    where: { code: "PGS" },
    update: { facultyId: facPGS.id, name: "Department of Postgraduate Studies" },
    create: { facultyId: facPGS.id, name: "Department of Postgraduate Studies", code: "PGS" },
  });

  console.log("Departments created/updated.");

  // ── Step 4: Create the 7 new programs ─────────────────────────────────────
  const programs = [
    {
      code: "BA-PM-V2",
      name: "B.A. Pastoral Ministry",
      description: "A four-year programme equipping students for effective pastoral ministry through biblical studies, theology, homiletics, pastoral care, and practical church leadership.",
      degreeType: "bachelors" as const,
      durationSemesters: 8,
      totalCredits: 90,
      tuitionPerSemester: 7500000,
      departmentId: deptPAS.id,
    },
    {
      code: "BA-CE-V2",
      name: "B.A. Christian Education",
      description: "A four-year programme preparing students to teach, design curricula, and lead educational ministries in churches, schools, and community settings.",
      degreeType: "bachelors" as const,
      durationSemesters: 8,
      totalCredits: 90,
      tuitionPerSemester: 7500000,
      departmentId: deptMIS.id,
    },
    {
      code: "PGD-THEO-V2",
      name: "PGD in Theology",
      description: "A one-year postgraduate diploma bridging graduates from any discipline into theological studies. Credits are transferable to M.A. programmes.",
      degreeType: "pgd" as const,
      durationSemesters: 2,
      totalCredits: 24,
      tuitionPerSemester: 10000000,
      departmentId: deptPGS.id,
    },
    {
      code: "MA-ST-V2",
      name: "M.A. Systematic Theology",
      description: "A two-year programme offering advanced study of Christian doctrine through historical, biblical, and philosophical perspectives.",
      degreeType: "masters" as const,
      durationSemesters: 4,
      totalCredits: 36,
      tuitionPerSemester: 12500000,
      departmentId: deptPGS.id,
    },
    {
      code: "MA-PC-V2",
      name: "M.A. Pastoral Counselling",
      description: "A two-year programme integrating theology with psychology for effective soul care in churches, hospitals, and community settings.",
      degreeType: "masters" as const,
      durationSemesters: 4,
      totalCredits: 36,
      tuitionPerSemester: 12500000,
      departmentId: deptPGS.id,
    },
    {
      code: "MA-CL-V2",
      name: "M.A. Christian Leadership",
      description: "A two-year programme developing transformational leaders for churches, ministries, and marketplace contexts.",
      degreeType: "masters" as const,
      durationSemesters: 4,
      totalCredits: 36,
      tuitionPerSemester: 12500000,
      departmentId: deptPGS.id,
    },
    {
      code: "MDIV-V2",
      name: "Master of Divinity (M.Div.)",
      description: "The gold-standard three-year professional ministry degree covering biblical studies, systematic theology, pastoral care, homiletics, and supervised ministry practice.",
      degreeType: "masters" as const,
      durationSemesters: 6,
      totalCredits: 45,
      tuitionPerSemester: 15000000,
      departmentId: deptPGS.id,
    },
  ];

  for (const prog of programs) {
    await prisma.program.upsert({
      where: { code: prog.code },
      update: { ...prog, isActive: true },
      create: { ...prog, isActive: true },
    });
  }
  console.log("7 new programs created.");

  // ── Step 5: Look up program IDs for course linking ────────────────────────
  const progBAPM = await prisma.program.findUnique({ where: { code: "BA-PM-V2" } });
  const progBACE = await prisma.program.findUnique({ where: { code: "BA-CE-V2" } });
  const progPGD = await prisma.program.findUnique({ where: { code: "PGD-THEO-V2" } });
  const progMAST = await prisma.program.findUnique({ where: { code: "MA-ST-V2" } });
  const progMAPC = await prisma.program.findUnique({ where: { code: "MA-PC-V2" } });
  const progMACL = await prisma.program.findUnique({ where: { code: "MA-CL-V2" } });
  const progMDIV = await prisma.program.findUnique({ where: { code: "MDIV-V2" } });

  // ── Step 6: Create 48 courses ─────────────────────────────────────────────
  interface CourseInput {
    code: string;
    title: string;
    description: string;
    creditUnits: number;
    semesterNumber: number;
    isElective: boolean;
    departmentId: string;
    programId: string | null;
  }

  const courses: CourseInput[] = [
    // === B.A. CORE (22 courses) ===
    { code: "GEN 101", title: "Introduction to Christian Faith", description: "An overview of core Christian beliefs, the nature of God, salvation, the church, and the Christian worldview.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptGEN.id, programId: null },
    { code: "GEN 102", title: "Bible Study Methods & Hermeneutics", description: "Principles and methods for interpreting Scripture accurately.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptGEN.id, programId: null },
    { code: "GEN 103", title: "Academic Writing & Research", description: "Essential academic skills including theological research methods and academic writing.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptGEN.id, programId: null },
    { code: "GEN 104", title: "Foundations of Leadership", description: "Biblical principles of leadership and servant leadership models.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptGEN.id, programId: null },
    { code: "BIB 201", title: "Old Testament Survey", description: "A comprehensive survey of the Old Testament.", creditUnits: 3, semesterNumber: 2, isElective: false, departmentId: deptBIB.id, programId: null },
    { code: "BIB 202", title: "New Testament Survey", description: "A comprehensive survey of the New Testament.", creditUnits: 3, semesterNumber: 2, isElective: false, departmentId: deptBIB.id, programId: null },
    { code: "BIB 301", title: "Genesis: Deep Study", description: "An in-depth study of the Book of Genesis.", creditUnits: 3, semesterNumber: 5, isElective: false, departmentId: deptBIB.id, programId: null },
    { code: "BIB 302", title: "Romans: Deep Study", description: "A detailed exegetical study of Paul's letter to the Romans.", creditUnits: 3, semesterNumber: 5, isElective: false, departmentId: deptBIB.id, programId: null },
    { code: "THE 201", title: "Systematic Theology I", description: "Doctrines of God, Christ, and the Holy Spirit.", creditUnits: 3, semesterNumber: 3, isElective: false, departmentId: deptTHD.id, programId: null },
    { code: "THE 202", title: "Systematic Theology II", description: "Doctrines of humanity, sin, salvation, church, and eschatology.", creditUnits: 3, semesterNumber: 3, isElective: false, departmentId: deptTHD.id, programId: null },
    { code: "THE 301", title: "The Holy Spirit (Pneumatology)", description: "Advanced study of the person and work of the Holy Spirit.", creditUnits: 3, semesterNumber: 5, isElective: false, departmentId: deptTHD.id, programId: null },
    { code: "THE 302", title: "Apologetics", description: "The defence of the Christian faith through rational argumentation.", creditUnits: 3, semesterNumber: 6, isElective: false, departmentId: deptTHD.id, programId: null },
    { code: "CHR 201", title: "Church History", description: "A survey of Christianity from the early church to the present.", creditUnits: 3, semesterNumber: 3, isElective: false, departmentId: deptGEN.id, programId: null },
    { code: "ETH 301", title: "Christian Ethics", description: "Moral reasoning from a Christian perspective.", creditUnits: 3, semesterNumber: 5, isElective: false, departmentId: deptTHD.id, programId: null },
    { code: "AFT 301", title: "African Theology & Contextualization", description: "Christian theology in interaction with African cultures and worldviews.", creditUnits: 3, semesterNumber: 6, isElective: false, departmentId: deptTHD.id, programId: null },
    { code: "SPF 201", title: "Spiritual Formation & Prayer", description: "Christian spiritual disciplines, prayer, worship, and spiritual maturity.", creditUnits: 3, semesterNumber: 2, isElective: false, departmentId: deptGEN.id, programId: null },
    { code: "HOM 301", title: "Homiletics (Preaching)", description: "The art and science of preparing and delivering biblical sermons.", creditUnits: 3, semesterNumber: 5, isElective: false, departmentId: deptPAS.id, programId: null },
    { code: "PAS 201", title: "Introduction to Pastoral Ministry", description: "Overview of calling, character, and competencies for pastoral ministry.", creditUnits: 3, semesterNumber: 3, isElective: false, departmentId: deptPAS.id, programId: null },
    { code: "MIS 201", title: "Missions & Evangelism", description: "Biblical basis for missions and strategies for evangelism.", creditUnits: 3, semesterNumber: 4, isElective: false, departmentId: deptMIS.id, programId: null },
    { code: "ADM 301", title: "Church Administration", description: "Managing church operations, finances, and governance.", creditUnits: 3, semesterNumber: 6, isElective: false, departmentId: deptPAS.id, programId: null },
    { code: "CNS 301", title: "Biblical Counselling", description: "Counselling from a biblical perspective.", creditUnits: 3, semesterNumber: 6, isElective: false, departmentId: deptPAS.id, programId: null },
    { code: "PRA 401", title: "Practicum & Capstone Project", description: "Supervised ministry placement combined with a capstone research project.", creditUnits: 3, semesterNumber: 8, isElective: false, departmentId: deptPAS.id, programId: null },

    // === B.A. PASTORAL MINISTRY ELECTIVES (4) ===
    { code: "PAS 302", title: "Church Planting & Growth", description: "Strategies and biblical principles for establishing new churches.", creditUnits: 3, semesterNumber: 6, isElective: true, departmentId: deptPAS.id, programId: progBAPM!.id },
    { code: "PAS 303", title: "Marriage & Family Ministry", description: "Pastoral approaches to marriage preparation and family counselling.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptPAS.id, programId: progBAPM!.id },
    { code: "PAS 304", title: "Advanced Pastoral Care", description: "Advanced techniques in pastoral visitation and crisis care.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptPAS.id, programId: progBAPM!.id },
    { code: "PAS 305", title: "Conflict Resolution & Peacemaking", description: "Biblical principles for resolving conflicts and fostering reconciliation.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptPAS.id, programId: progBAPM!.id },

    // === B.A. CHRISTIAN EDUCATION ELECTIVES (4) ===
    { code: "CED 302", title: "Christian Education Methods", description: "Teaching methodologies for Christian education contexts.", creditUnits: 3, semesterNumber: 6, isElective: true, departmentId: deptMIS.id, programId: progBACE!.id },
    { code: "CED 303", title: "Youth & Children's Ministry", description: "Ministry to children and young people.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptMIS.id, programId: progBACE!.id },
    { code: "CED 304", title: "Curriculum Design & Teaching", description: "Educational curriculum design and assessment methods.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptMIS.id, programId: progBACE!.id },
    { code: "CED 305", title: "Family Ministry", description: "Strategies for equipping families through the church.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptMIS.id, programId: progBACE!.id },

    // === SHARED ELECTIVE POOL (4) ===
    { code: "MIS 302", title: "Cross-Cultural Ministry", description: "Effective ministry across cultural boundaries.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptMIS.id, programId: null },
    { code: "KLE 301", title: "Kingdom Ethics & Social Justice", description: "Biblical perspectives on justice, mercy, and social responsibility.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptTHD.id, programId: null },
    { code: "WRL 301", title: "World Religions & Interfaith Dialogue", description: "Comparative study of major world religions.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptTHD.id, programId: null },
    { code: "BIB 303", title: "Biblical Greek Introduction", description: "Introduction to Koine Greek for New Testament study.", creditUnits: 3, semesterNumber: 7, isElective: true, departmentId: deptBIB.id, programId: null },

    // === POSTGRADUATE COURSES (14) ===
    { code: "PGD 501", title: "Advanced Hermeneutics", description: "Advanced methods of biblical interpretation.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptPGS.id, programId: progPGD!.id },
    { code: "PGD 502", title: "Theological Research Methods", description: "Research design and methodology for theological scholarship.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptPGS.id, programId: progPGD!.id },
    { code: "PGD 503", title: "Contemporary Theology", description: "Major theological movements from the 20th and 21st centuries.", creditUnits: 3, semesterNumber: 2, isElective: false, departmentId: deptPGS.id, programId: progPGD!.id },
    { code: "PGD 504", title: "Biblical Theology", description: "Theology of the Bible as a unified narrative.", creditUnits: 3, semesterNumber: 2, isElective: false, departmentId: deptPGS.id, programId: progPGD!.id },
    { code: "MST 601", title: "Advanced Systematic Theology", description: "Seminar-level exploration of selected doctrinal topics.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptPGS.id, programId: progMAST!.id },
    { code: "MPC 601", title: "Advanced Pastoral Counselling", description: "Advanced theory and practice of pastoral counselling.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptPGS.id, programId: progMAPC!.id },
    { code: "MPC 602", title: "Trauma & Crisis Counselling", description: "Trauma-informed care and crisis intervention.", creditUnits: 3, semesterNumber: 2, isElective: false, departmentId: deptPGS.id, programId: progMAPC!.id },
    { code: "MCL 601", title: "Transformational Leadership", description: "Leadership theories and practices for lasting positive change.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptPGS.id, programId: progMACL!.id },
    { code: "MCL 602", title: "Church Leadership & Governance", description: "Structures and best practices for governing churches.", creditUnits: 3, semesterNumber: 2, isElective: false, departmentId: deptPGS.id, programId: progMACL!.id },
    { code: "DIV 601", title: "Advanced Old Testament", description: "Advanced exegetical study of selected OT books.", creditUnits: 3, semesterNumber: 1, isElective: false, departmentId: deptPGS.id, programId: progMDIV!.id },
    { code: "DIV 602", title: "Advanced New Testament", description: "Advanced exegetical study of selected NT books.", creditUnits: 3, semesterNumber: 2, isElective: false, departmentId: deptPGS.id, programId: progMDIV!.id },
    { code: "DIV 603", title: "Pastoral Theology", description: "Theological reflection on the nature and practice of pastoral ministry.", creditUnits: 3, semesterNumber: 3, isElective: false, departmentId: deptPGS.id, programId: progMDIV!.id },
    { code: "DIV 604", title: "Church History Seminar", description: "Advanced seminar on selected topics in church history.", creditUnits: 3, semesterNumber: 4, isElective: false, departmentId: deptPGS.id, programId: progMDIV!.id },
    { code: "DIV 605", title: "Missiology & Global Christianity", description: "Advanced study of mission theology and world Christianity.", creditUnits: 3, semesterNumber: 5, isElective: false, departmentId: deptPGS.id, programId: progMDIV!.id },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: course,
      create: course,
    });
  }
  console.log(`${courses.length} courses created/updated.`);

  console.log("\nCurriculum V2 seed complete!");
  console.log("  - 7 active programs");
  console.log("  - 48 courses (22 core + 8 BA electives + 4 shared + 14 postgraduate)");
  console.log("  - 3 faculties, 6 departments");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
