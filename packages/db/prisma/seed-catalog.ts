import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════════
// Berean Bible Academy — Full Catalog Seed
// Run after main seed: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-catalog.ts
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🏫 Seeding Berean Bible Academy full catalog...\n");

  // ─── 1. Faculties ─────────────────────────────────────────────────────────

  console.log("Creating faculties...");

  const facultyTBS = await prisma.faculty.upsert({
    where: { code: "FTB" },
    update: {
      name: "Faculty of Theology & Biblical Studies",
      description:
        "The Faculty of Theology & Biblical Studies oversees all undergraduate and postgraduate programmes in biblical studies, systematic theology, and related disciplines. It provides rigorous academic training grounded in Scripture and the Christian tradition.",
    },
    create: {
      code: "FTB",
      name: "Faculty of Theology & Biblical Studies",
      description:
        "The Faculty of Theology & Biblical Studies oversees all undergraduate and postgraduate programmes in biblical studies, systematic theology, and related disciplines. It provides rigorous academic training grounded in Scripture and the Christian tradition.",
    },
  });

  const facultyMPS = await prisma.faculty.upsert({
    where: { code: "FMP" },
    update: {
      name: "Faculty of Ministry & Practical Studies",
      description:
        "The Faculty of Ministry & Practical Studies equips students for hands-on ministry in pastoral care, missions, children & youth work, and Christian education. It blends theoretical knowledge with practical ministry skills and digital fluency.",
    },
    create: {
      code: "FMP",
      name: "Faculty of Ministry & Practical Studies",
      description:
        "The Faculty of Ministry & Practical Studies equips students for hands-on ministry in pastoral care, missions, children & youth work, and Christian education. It blends theoretical knowledge with practical ministry skills and digital fluency.",
    },
  });

  const facultyPGS = await prisma.faculty.upsert({
    where: { code: "FPG" },
    update: {
      name: "Faculty of Postgraduate Studies",
      description:
        "The Faculty of Postgraduate Studies administers all postgraduate diploma, master's, and doctoral programmes. It fosters advanced scholarship, original research, and professional leadership development for ministry and the marketplace.",
    },
    create: {
      code: "FPG",
      name: "Faculty of Postgraduate Studies",
      description:
        "The Faculty of Postgraduate Studies administers all postgraduate diploma, master's, and doctoral programmes. It fosters advanced scholarship, original research, and professional leadership development for ministry and the marketplace.",
    },
  });

  // ─── 2. Departments ──────────────────────────────────────────────────────

  console.log("Creating departments...");

  const departments: Record<
    string,
    { code: string; name: string; facultyId: string; description: string }
  > = {
    GEN: {
      code: "GEN",
      name: "General Studies",
      facultyId: facultyTBS.id,
      description:
        "The Department of General Studies provides foundational courses in academic writing, communication, psychology, and digital literacy that equip students with essential skills for academic success and modern ministry.",
    },
    BTS: {
      code: "BTS",
      name: "Biblical & Theological Studies",
      facultyId: facultyTBS.id,
      description:
        "The Department of Biblical & Theological Studies offers core courses in Old and New Testament studies, systematic theology, hermeneutics, church history, and spiritual formation that form the backbone of all programmes.",
    },
    PAS: {
      code: "PAS",
      name: "Pastoral Ministry",
      facultyId: facultyMPS.id,
      description:
        "The Department of Pastoral Ministry trains students in preaching, pastoral care, church administration, evangelism, and contemporary digital ministry to prepare effective shepherd-leaders for the 21st-century church.",
    },
    MIS: {
      code: "MIS",
      name: "Missions & Intercultural Studies",
      facultyId: facultyMPS.id,
      description:
        "The Department of Missions & Intercultural Studies prepares students for cross-cultural ministry, global outreach, and missionary service with emphasis on Africa's strategic role in world missions and digital evangelism.",
    },
    CYM: {
      code: "CYM",
      name: "Children & Youth Ministry",
      facultyId: facultyMPS.id,
      description:
        "The Department of Children & Youth Ministry equips students to effectively engage younger generations through creative programming, digital discipleship, social media strategy, and age-appropriate spiritual formation.",
    },
    CED: {
      code: "CED",
      name: "Christian Education",
      facultyId: facultyMPS.id,
      description:
        "The Department of Christian Education trains students in teaching, curriculum development, e-learning design, educational technology, and Christian school administration with a biblical worldview.",
    },
    PGS: {
      code: "PGS",
      name: "Postgraduate Studies",
      facultyId: facultyPGS.id,
      description:
        "The Department of Postgraduate Studies coordinates the PGD, Master of Arts, and M.Div. programmes, providing advanced theological education and professional development for ministry leaders.",
    },
    DIV: {
      code: "DIV",
      name: "Divinity",
      facultyId: facultyPGS.id,
      description:
        "The Department of Divinity administers the Master of Divinity programme, the gold-standard professional degree for ministry preparation, integrating biblical languages, systematic theology, pastoral care, and practical ministry.",
    },
  };

  const deptRecords: Record<string, { id: string }> = {};
  for (const [key, dept] of Object.entries(departments)) {
    deptRecords[key] = await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        facultyId: dept.facultyId,
        description: dept.description,
      },
      create: dept,
    });
  }

  // ─── 3. Deactivate old placeholder programs ───────────────────────────────

  console.log("Deactivating old placeholder programs...");

  const oldProgramCodes = ["CBS", "DIT", "BOM", "CCL"];
  for (const code of oldProgramCodes) {
    await prisma.program.updateMany({
      where: { code },
      data: { isActive: false },
    });
  }

  // ─── 4. Programs ─────────────────────────────────────────────────────────

  console.log("Creating programs...");

  const programDefs = [
    {
      code: "BA-PM",
      name: "B.A. Pastoral Ministry",
      departmentCode: "PAS",
      degreeType: "bachelors" as const,
      durationSemesters: 8,
      totalCredits: 120,
      tuitionPerSemester: 0,
      description:
        "The B.A. in Pastoral Ministry blends the homiletics and pastoral care of classical seminary training with pneumatological depth, faith principles, prayer-and-power DNA, plus social media ministry, content creation, and AI-era church leadership. Graduates are equipped to lead local churches, plant new congregations, and navigate the challenges of 21st-century pastoral ministry with both spiritual power and digital fluency.",
    },
    {
      code: "BA-MIS",
      name: "B.A. Missions & Intercultural Studies",
      departmentCode: "MIS",
      degreeType: "bachelors" as const,
      durationSemesters: 8,
      totalCredits: 120,
      tuitionPerSemester: 0,
      description:
        "The B.A. in Missions & Intercultural Studies prepares students for cross-cultural ministry, missionary service, and global outreach. The programme blends missiology and cultural anthropology with digital evangelism, social media, Business as Mission, and AI translation tools. It places special emphasis on Africa's strategic role in global missions and reverse missions movements.",
    },
    {
      code: "BA-CYM",
      name: "B.A. Children & Youth Ministry",
      departmentCode: "CYM",
      degreeType: "bachelors" as const,
      durationSemesters: 8,
      totalCredits: 120,
      tuitionPerSemester: 0,
      description:
        "The B.A. in Children & Youth Ministry combines developmental psychology, creative programming, social media strategy, and digital discipleship with strong spiritual formation. The programme places emphasis on engaging Gen-Z and Gen-Alpha through content creation, gamification, and online community building.",
    },
    {
      code: "BA-CED",
      name: "B.A. Christian Education",
      departmentCode: "CED",
      degreeType: "bachelors" as const,
      durationSemesters: 8,
      totalCredits: 120,
      tuitionPerSemester: 0,
      description:
        "The B.A. in Christian Education focuses on teaching, curriculum development, e-learning design, and Christian school administration. The programme integrates pedagogy, educational technology, AI tools, and biblical worldview, with strong emphasis on online course development, social media for education, and marketplace training.",
    },
    {
      code: "PGD-THEO",
      name: "PGD in Theology",
      departmentCode: "PGS",
      degreeType: "diploma" as const,
      durationSemesters: 2,
      totalCredits: 36,
      tuitionPerSemester: 0,
      description:
        "The Postgraduate Diploma in Theology is a one-year bridge programme designed for graduates of any discipline who wish to pursue graduate theological studies. It provides a comprehensive foundation in Old and New Testament theology, systematic theology, hermeneutics, pneumatology, homiletics, and digital ministry. Credits are transferable to M.A. programmes.",
    },
    {
      code: "MA-ST",
      name: "M.A. Systematic Theology",
      departmentCode: "PGS",
      degreeType: "masters" as const,
      durationSemesters: 4,
      totalCredits: 48,
      tuitionPerSemester: 0,
      description:
        "The M.A. in Systematic Theology offers advanced study of Christian doctrine through historical, biblical, pneumatological, and philosophical perspectives. The programme engages Patristic, Reformed, Pentecostal, and African theological traditions and prepares students for doctoral studies, seminary teaching, and theological writing.",
    },
    {
      code: "MA-PC",
      name: "M.A. Pastoral Counselling",
      departmentCode: "PGS",
      degreeType: "masters" as const,
      durationSemesters: 4,
      totalCredits: 48,
      tuitionPerSemester: 0,
      description:
        "The M.A. in Pastoral Counselling integrates theology with psychology for effective soul care. The programme equips students for pastoral care in churches, hospitals, workplaces, and online settings. It includes training in tele-counselling, workplace chaplaincy, and mental health ministry, with a 200-hour supervised practicum.",
    },
    {
      code: "MA-CA",
      name: "M.A. Church Administration",
      departmentCode: "PGS",
      degreeType: "masters" as const,
      durationSemesters: 4,
      totalCredits: 48,
      tuitionPerSemester: 0,
      description:
        "The M.A. in Church Administration develops managerial, financial, legal, digital, and organisational competencies for church governance. The programme blends theology with nonprofit management, digital operations, AI analytics, social media branding, and marketplace equipping, with a 150-hour field placement.",
    },
    {
      code: "MA-CC",
      name: "M.A. Christian Counselling",
      departmentCode: "PGS",
      degreeType: "masters" as const,
      durationSemesters: 4,
      totalCredits: 54,
      tuitionPerSemester: 0,
      description:
        "The M.A. in Christian Counselling is the most intensive counselling programme offered. It integrates biblical wisdom with contemporary counselling theory, psychopathology, and clinical skills. The programme includes a 300-hour supervised clinical experience covering digital counselling, workplace stress management, and mental health ministry.",
    },
    {
      code: "MA-ML",
      name: "M.A. Ministry Leadership",
      departmentCode: "PGS",
      degreeType: "masters" as const,
      durationSemesters: 3,
      totalCredits: 42,
      tuitionPerSemester: 0,
      description:
        "The M.A. in Ministry Leadership is designed for pastors, church staff, and marketplace professionals. The programme covers visionary leadership, social media influence, digital transformation, marketplace ministry, entrepreneurship, and AI-powered decision-making, with a 120-hour leadership practicum.",
    },
    {
      code: "MA-MFM",
      name: "M.A. Marriage & Family Ministry",
      departmentCode: "PGS",
      degreeType: "masters" as const,
      durationSemesters: 4,
      totalCredits: 48,
      tuitionPerSemester: 0,
      description:
        "The M.A. in Marriage & Family Ministry addresses the family crisis in church and society. The programme covers premarital preparation, marriage enrichment, family counselling, parenting in the digital age, and crisis intervention. It includes training in online family counselling, work-life balance, and social media's impact on families, with a 200-hour practicum.",
    },
    {
      code: "MDIV",
      name: "Master of Divinity",
      departmentCode: "DIV",
      degreeType: "masters" as const,
      durationSemesters: 6,
      totalCredits: 78,
      tuitionPerSemester: 0,
      description:
        "The Master of Divinity (M.Div.) is the gold-standard professional degree for ministry preparation. At 78 credits, it exceeds the ATS minimum of 72. The programme covers biblical languages, systematic theology, pneumatology, homiletics, pastoral care, digital ministry, and marketplace theology, with a 400-hour supervised ministry practicum.",
    },
  ];

  const programRecords: Record<string, { id: string }> = {};
  for (const prog of programDefs) {
    const dept = deptRecords[prog.departmentCode];
    if (!dept) {
      console.error(`Department ${prog.departmentCode} not found for program ${prog.code}`);
      continue;
    }
    programRecords[prog.code] = await prisma.program.upsert({
      where: { code: prog.code },
      update: {
        name: prog.name,
        departmentId: dept.id,
        degreeType: prog.degreeType,
        durationSemesters: prog.durationSemesters,
        totalCredits: prog.totalCredits,
        tuitionPerSemester: prog.tuitionPerSemester,
        description: prog.description,
        isActive: true,
      },
      create: {
        code: prog.code,
        name: prog.name,
        departmentId: dept.id,
        degreeType: prog.degreeType,
        durationSemesters: prog.durationSemesters,
        totalCredits: prog.totalCredits,
        tuitionPerSemester: prog.tuitionPerSemester,
        description: prog.description,
        isActive: true,
      },
    });
  }

  // ─── 5. Courses ──────────────────────────────────────────────────────────

  console.log("Creating courses...");

  // Helper type
  interface CourseDef {
    code: string;
    title: string;
    credits: number;
    departmentCode: string;
    programCode: string | null;
    semesterNumber: number;
    isElective: boolean;
    description: string;
  }

  const courses: CourseDef[] = [
    // ═══════════════════════════════════════════════════════════════════════
    // GENERAL STUDIES CORE (4 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "GEN 111",
      title: "Use of English & Academic Writing",
      credits: 3,
      departmentCode: "GEN",
      programCode: null,
      semesterNumber: 1,
      isElective: false,
      description:
        "Develops competence in English grammar, academic writing conventions, essay structure, citation methods, and critical reading skills essential for theological studies and professional communication.",
    },
    {
      code: "GEN 112",
      title: "Communication, Public Speaking & Media Literacy",
      credits: 3,
      departmentCode: "GEN",
      programCode: null,
      semesterNumber: 2,
      isElective: false,
      description:
        "Covers principles of effective communication, public speaking techniques, presentation skills, media literacy, and digital communication strategies for ministry and marketplace contexts.",
    },
    {
      code: "GEN 211",
      title: "Introduction to Psychology & Human Behaviour",
      credits: 3,
      departmentCode: "GEN",
      programCode: null,
      semesterNumber: 5,
      isElective: false,
      description:
        "Introduces foundational concepts of psychology, human development, motivation, personality theories, and behavioral patterns, providing a framework for understanding people in ministry and counselling settings.",
    },
    {
      code: "GEN 212",
      title: "Digital Literacy, AI Tools & Ministry Technology",
      credits: 3,
      departmentCode: "GEN",
      programCode: null,
      semesterNumber: 6,
      isElective: false,
      description:
        "Equips students with digital literacy skills, including the use of AI tools, productivity software, social media platforms, and ministry-specific technology for effective 21st-century service.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BIBLICAL & THEOLOGICAL CORE (14 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "BIB 111",
      title: "Bible Survey: Panoramic View of Scripture",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 1,
      isElective: false,
      description:
        "Provides a comprehensive overview of the entire Bible, tracing the grand narrative of Scripture from Genesis to Revelation, including key themes, literary genres, historical contexts, and the unfolding plan of redemption.",
    },
    {
      code: "BIB 121",
      title: "Old Testament: Pentateuch, Historical & Wisdom Books",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 1,
      isElective: false,
      description:
        "Examines the first seventeen books of the Old Testament, covering the Pentateuch (Genesis-Deuteronomy), historical books (Joshua-Esther), and wisdom literature (Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon) in their historical and theological contexts.",
    },
    {
      code: "BIB 122",
      title: "New Testament I: Life of Christ & the Gospels",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 1,
      isElective: false,
      description:
        "Studies the four Gospels with focus on the life, teachings, miracles, death, and resurrection of Jesus Christ, examining the historical, cultural, and theological context of first-century Palestine.",
    },
    {
      code: "BIB 211",
      title: "New Testament II: Acts, Pauline & General Epistles",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 2,
      isElective: false,
      description:
        "Covers the book of Acts and the New Testament epistles, exploring the birth and expansion of the early church, Pauline theology, and the teachings of the general epistles for Christian faith and practice.",
    },
    {
      code: "THE 221",
      title: "Systematic Theology I: God, Christ & Salvation",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 3,
      isElective: false,
      description:
        "Introduces systematic theology with focused study on the doctrines of God (theology proper), Jesus Christ (Christology), and salvation (soteriology), drawing from Scripture, historical creeds, and contemporary theological reflection.",
    },
    {
      code: "THE 222",
      title: "Systematic Theology II: Church, Holy Spirit & Last Things",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 3,
      isElective: false,
      description:
        "Continues systematic theology with the doctrines of the church (ecclesiology), the Holy Spirit (pneumatology in broader context), and eschatology (last things), examining diverse perspectives within evangelical tradition.",
    },
    {
      code: "BIB 311",
      title: "Biblical Hermeneutics & Interpretation",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 4,
      isElective: false,
      description:
        "Teaches principles and methods of biblical interpretation including grammatical-historical exegesis, literary analysis, genre-specific hermeneutics, and application of interpretive skills to preaching and teaching.",
    },
    {
      code: "THE 312",
      title: "Church History: Ancient Church to Modern Era",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 4,
      isElective: false,
      description:
        "Surveys the history of Christianity from the apostolic age through the medieval period, Reformation, and modern era, examining key figures, councils, movements, and their impact on contemporary faith and practice.",
    },
    {
      code: "THE 321",
      title: "Islam, World Religions & Contemporary Cults",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: false,
      description:
        "Examines the major world religions including Islam, Hinduism, Buddhism, and African Traditional Religion, along with contemporary cults and new religious movements, equipping students for informed dialogue and witness.",
    },
    {
      code: "THE 411",
      title: "Christian Ethics & Contemporary Issues",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 6,
      isElective: false,
      description:
        "Explores the foundations of Christian ethics and applies biblical moral principles to contemporary issues such as bioethics, social justice, sexuality, technology ethics, environmental stewardship, and marketplace integrity.",
    },
    {
      code: "PNE 211",
      title: "Pneumatology: Person & Ministry of the Holy Spirit",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 1,
      isElective: false,
      description:
        "Studies the person, nature, and ministry of the Holy Spirit, including the baptism in the Holy Spirit, spiritual gifts, the fruit of the Spirit, and the Spirit's role in empowering believers for life and ministry.",
    },
    {
      code: "SPR 221",
      title: "Prayer, Intercession & Spiritual Warfare",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 2,
      isElective: false,
      description:
        "Examines the biblical foundations of prayer, intercession, and spiritual warfare, equipping students with practical strategies for effective prayer life, spiritual discernment, and overcoming spiritual opposition in ministry.",
    },
    {
      code: "CHR 311",
      title: "Character Development, Holiness & Integrity",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 3,
      isElective: false,
      description:
        "Focuses on the formation of Christlike character, personal holiness, moral integrity, and ethical leadership as the non-negotiable foundation for effective ministry and marketplace witness.",
    },
    {
      code: "SPF 321",
      title: "Spiritual Formation, Devotional Life & Disciplines",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 4,
      isElective: false,
      description:
        "Explores classical and contemporary spiritual disciplines including prayer, fasting, meditation on Scripture, solitude, worship, and community, cultivating a deep and sustainable devotional life.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // KINGDOM LIFE ELECTIVES (10 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "KLE 301",
      title: "Kingdom Finance & Biblical Prosperity",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Examines biblical principles of finance, stewardship, giving, wealth creation, and prosperity from a Kingdom perspective, integrating faith with sound financial management practices.",
    },
    {
      code: "KLE 302",
      title: "Understanding the Anointing, Gifts & Spiritual Operations",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Studies the biblical concept of the anointing, the operation of spiritual gifts, and the dynamics of the Holy Spirit's power in ministry, drawing from Pentecostal and charismatic traditions.",
    },
    {
      code: "KLE 303",
      title: "Vision, Purpose, Divine Direction & Destiny",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Explores biblical principles for discovering personal vision, understanding divine purpose, receiving guidance from God, and fulfilling one's God-given destiny in ministry and the marketplace.",
    },
    {
      code: "KLE 304",
      title: "Biblical Business Strategy & Entrepreneurship",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Integrates biblical principles with business strategy, entrepreneurship, and innovation, equipping students to build Kingdom-minded enterprises that create value and advance God's purposes in the marketplace.",
    },
    {
      code: "KLE 305",
      title: "Signs, Wonders & the Dynamics of God's Power",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Examines the biblical basis for signs, wonders, and miracles, exploring how the power of God operates in ministry, healing, deliverance, and supernatural demonstrations in both historical and contemporary contexts.",
    },
    {
      code: "KLE 306",
      title: "Dynamics of Praise, Worship & the Prophetic",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Studies the theology and practice of praise, worship, and the prophetic ministry, including worship leading, prophetic expression, and creating environments for encountering God's presence.",
    },
    {
      code: "KLE 307",
      title: "Social Media Ministry & Digital Church Strategy",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Explores the use of social media platforms and digital strategies for ministry, church growth, community engagement, and gospel proclamation in the online space.",
    },
    {
      code: "KLE 308",
      title: "Marketplace Ministry & Faith-Work Integration",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Examines how to integrate faith with professional work, exercising Kingdom influence in the marketplace through ethical leadership, vocational calling, and workplace ministry.",
    },
    {
      code: "KLE 309",
      title: "Marriage, Family & Relationship Foundations",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Provides biblical foundations for understanding marriage, family dynamics, healthy relationships, conflict resolution, and building strong family units within the context of Christian community.",
    },
    {
      code: "KLE 310",
      title: "Mental Health Awareness & Emotional Wellness",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 5,
      isElective: true,
      description:
        "Introduces mental health awareness, emotional intelligence, stress management, and wellness strategies from a biblical perspective, equipping students to support congregational and personal wellbeing.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PRACTICUM & THESIS (4 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "PRA 301",
      title: "Supervised Ministry Practicum I (150 Hours)",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 6,
      isElective: false,
      description:
        "A 150-hour supervised field placement in a local church, ministry, or approved site, providing hands-on experience in pastoral duties, teaching, outreach, and ministry administration under the guidance of an approved field mentor.",
    },
    {
      code: "PRA 401",
      title: "Supervised Ministry Practicum II (150 Hours)",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 7,
      isElective: false,
      description:
        "A second 150-hour supervised field placement building on Practicum I, providing advanced ministry experience with greater responsibility, leadership opportunities, and reflective practice in a different ministry context.",
    },
    {
      code: "RES 411",
      title: "Research Methods & Thesis Writing",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 8,
      isElective: false,
      description:
        "Introduces research methodology, academic writing conventions, literature review techniques, and thesis proposal development, preparing students to conduct original theological research.",
    },
    {
      code: "RES 412",
      title: "Capstone Thesis / Project & Defence",
      credits: 3,
      departmentCode: "BTS",
      programCode: null,
      semesterNumber: 8,
      isElective: false,
      description:
        "The culminating academic exercise where students complete and defend their original thesis or capstone project, demonstrating mastery of their field of study and research competence.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // B.A. PASTORAL MINISTRY SPECIALISATION (14 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "PAS 211",
      title: "Homiletics: Principles of Biblical Preaching",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 2,
      isElective: false,
      description:
        "Covers the foundational principles and techniques of biblical preaching, including sermon preparation, outlining, illustration, and delivery methods for effective proclamation of God's Word.",
    },
    {
      code: "PAS 212",
      title: "Expository Preaching & Sermon Laboratory",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 2,
      isElective: false,
      description:
        "Advances preaching skills through the practice of expository preaching, with a sermon laboratory component where students prepare, deliver, and receive feedback on sermons from biblical texts.",
    },
    {
      code: "PAS 221",
      title: "Pastoral Theology & the Shepherd's Role",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 3,
      isElective: false,
      description:
        "Explores the biblical and theological foundations of pastoral ministry, examining the role of the pastor as shepherd, teacher, leader, and caregiver within the local church and wider community.",
    },
    {
      code: "PAS 222",
      title: "Pastoral Counselling & Soul Care",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 3,
      isElective: false,
      description:
        "Introduces pastoral counselling principles and techniques for soul care, including listening skills, crisis intervention, grief support, and referral practices within the context of local church ministry.",
    },
    {
      code: "PAS 311",
      title: "Evangelism, Discipleship & Church Growth",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 4,
      isElective: false,
      description:
        "Examines strategies for effective evangelism, discipleship, and church growth, integrating biblical models with contemporary approaches for reaching and retaining believers in diverse contexts.",
    },
    {
      code: "PAS 312",
      title: "Church Planting & Growth Strategies",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 4,
      isElective: false,
      description:
        "Covers the principles and practical strategies for planting new churches, including community analysis, team building, launch planning, financial sustainability, and growth management.",
    },
    {
      code: "PAS 321",
      title: "Church Administration, Governance & Finance",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 5,
      isElective: false,
      description:
        "Addresses the administrative, governance, and financial aspects of church leadership, including organisational structure, policy development, budgeting, legal compliance, and stewardship principles.",
    },
    {
      code: "PAS 322",
      title: "Signs, Wonders & the Power of God",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 5,
      isElective: false,
      description:
        "Studies the theological and practical dimensions of signs, wonders, healing, and supernatural manifestations in pastoral ministry, drawing from biblical examples and contemporary Pentecostal practice.",
    },
    {
      code: "PAS 411",
      title: "Dynamics of Praise, Worship & the Prophetic",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 6,
      isElective: false,
      description:
        "Explores the role of praise, worship, and prophetic ministry within the local church, including worship planning, prophetic protocol, and creating an atmosphere for encountering God's presence.",
    },
    {
      code: "PAS 412",
      title: "Content Creation & Media Production for Ministry",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 6,
      isElective: false,
      description:
        "Trains students in creating compelling digital content for ministry, including video production, podcasting, graphic design, and social media content strategies to extend pastoral influence online.",
    },
    {
      code: "PAS 413",
      title: "Online Church Models & Virtual Ministry",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 7,
      isElective: false,
      description:
        "Examines emerging models of online church, virtual worship services, digital community building, and hybrid ministry approaches that integrate physical and digital congregation experiences.",
    },
    {
      code: "PAS 414",
      title: "AI, Technology & the Future of the Church",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 7,
      isElective: false,
      description:
        "Explores the impact of artificial intelligence, emerging technologies, and digital transformation on the future of church ministry, including ethical considerations and strategic adoption for kingdom purposes.",
    },
    {
      code: "PAS 421",
      title: "Pastoral Leadership, Mentoring & Team Building",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 8,
      isElective: false,
      description:
        "Develops skills in pastoral leadership, mentoring relationships, team development, succession planning, and building healthy leadership cultures within churches and ministry organisations.",
    },
    {
      code: "PAS 422",
      title: "Pastoral Ethics, Etiquette & Ministerial Conduct",
      credits: 3,
      departmentCode: "PAS",
      programCode: "BA-PM",
      semesterNumber: 8,
      isElective: false,
      description:
        "Addresses the ethical standards, professional etiquette, and codes of conduct expected of pastoral ministers, including boundaries, confidentiality, financial integrity, and relational ethics in ministry.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // B.A. MISSIONS & INTERCULTURAL STUDIES SPECIALISATION (14 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "MIS 211",
      title: "Biblical Theology of Missions & the Great Commission",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 2,
      isElective: false,
      description:
        "Examines the biblical foundations of missions from Genesis to Revelation, tracing God's redemptive plan for all nations and the church's mandate to fulfil the Great Commission in every generation.",
    },
    {
      code: "MIS 212",
      title: "Cultural Anthropology & Cross-Cultural Communication",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 2,
      isElective: false,
      description:
        "Introduces cultural anthropology and cross-cultural communication principles essential for effective ministry in multicultural contexts, including cultural analysis, contextualisation, and overcoming ethnocentrism.",
    },
    {
      code: "MIS 221",
      title: "History & Analysis of World Missions",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 3,
      isElective: false,
      description:
        "Surveys the history of Christian missions from the early church to the present, analysing key movements, strategies, successes, failures, and the shifting centre of global Christianity.",
    },
    {
      code: "MIS 222",
      title: "Church Planting in Cross-Cultural Contexts",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 3,
      isElective: false,
      description:
        "Covers principles and strategies for planting indigenous churches in cross-cultural settings, including community engagement, leadership development, and culturally appropriate worship and discipleship models.",
    },
    {
      code: "MIS 311",
      title: "Unreached People Groups & Frontier Missions",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 4,
      isElective: false,
      description:
        "Focuses on understanding and reaching unreached people groups, studying frontier mission strategies, people group research, prayer mobilisation, and innovative approaches to gospel access.",
    },
    {
      code: "MIS 312",
      title: "Islam, African Traditional Religion & Christian Witness",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 4,
      isElective: false,
      description:
        "Studies Islam and African Traditional Religion in depth, equipping students with knowledge and skills for respectful, informed, and effective Christian witness among adherents of these faiths.",
    },
    {
      code: "MIS 321",
      title: "Digital Missions & Online Evangelism Strategies",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 5,
      isElective: false,
      description:
        "Explores the use of digital platforms, social media, and online tools for evangelism and missions, including strategies for reaching digital natives and building online faith communities across cultures.",
    },
    {
      code: "MIS 322",
      title: "Social Media & Content Creation for Global Outreach",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 5,
      isElective: false,
      description:
        "Develops practical skills in social media management and content creation for global missionary outreach, including video, audio, graphic, and written content production for cross-cultural audiences.",
    },
    {
      code: "MIS 411",
      title: "Tentmaking, Business as Mission & Marketplace Ministry",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 6,
      isElective: false,
      description:
        "Examines tentmaking and Business as Mission (BAM) models, exploring how marketplace professionals can serve as effective missionaries through vocational work, enterprise development, and workplace witness.",
    },
    {
      code: "MIS 412",
      title: "Urban Mission & Social Transformation",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 6,
      isElective: false,
      description:
        "Addresses the challenges and opportunities of urban mission, including strategies for social transformation, community development, justice advocacy, and holistic ministry in urban contexts.",
    },
    {
      code: "MIS 413",
      title: "Diaspora Ministry, Migration & Refugee Care",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 7,
      isElective: false,
      description:
        "Explores ministry to diaspora communities, migrants, and refugees, including pastoral care, legal awareness, cultural adaptation support, and leveraging migration as an opportunity for gospel witness.",
    },
    {
      code: "MIS 414",
      title: "AI, Translation Technology & Modern Mission Tools",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 7,
      isElective: false,
      description:
        "Examines the role of artificial intelligence, language translation technology, and modern digital tools in advancing missionary work, Bible translation, and cross-cultural communication.",
    },
    {
      code: "MIS 421",
      title: "Leadership, Mentoring & Team Building in Missions",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 8,
      isElective: false,
      description:
        "Develops leadership, mentoring, and team-building skills specific to missionary contexts, including cross-cultural team dynamics, conflict resolution, and developing indigenous leaders.",
    },
    {
      code: "MIS 422",
      title: "Contextual Theology, Indigenisation & Global Christianity",
      credits: 3,
      departmentCode: "MIS",
      programCode: "BA-MIS",
      semesterNumber: 8,
      isElective: false,
      description:
        "Studies contextual theology and indigenisation movements within global Christianity, examining how the gospel takes root in diverse cultural soils while maintaining biblical integrity and unity.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // B.A. CHILDREN & YOUTH MINISTRY SPECIALISATION (14 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "CYM 211",
      title: "Foundations of Children's Ministry & Faith Formation",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 2,
      isElective: false,
      description:
        "Provides foundational knowledge for children's ministry, including child development theories, faith formation stages, age-appropriate teaching methods, and building effective children's ministry programmes.",
    },
    {
      code: "CYM 212",
      title: "Foundations of Youth Ministry & Adolescent Development",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 2,
      isElective: false,
      description:
        "Examines the foundations of youth ministry and adolescent development, including identity formation, peer dynamics, mentoring approaches, and creating relevant ministry programmes for teenagers.",
    },
    {
      code: "CYM 221",
      title: "Teaching Methods for Children & Youth",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 3,
      isElective: false,
      description:
        "Explores creative and effective teaching methods tailored for children and youth, including storytelling, visual aids, interactive learning, experiential education, and assessment strategies.",
    },
    {
      code: "CYM 222",
      title: "Creative Programming & Event Management",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 3,
      isElective: false,
      description:
        "Covers the design and management of creative programmes and events for children and youth ministry, including camps, retreats, VBS, holiday programmes, and outreach events.",
    },
    {
      code: "CYM 311",
      title: "Social Media Ministry & Digital Discipleship for Youth",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 4,
      isElective: false,
      description:
        "Explores strategies for using social media platforms for youth ministry, digital discipleship, online mentoring, and building authentic faith communities in virtual spaces.",
    },
    {
      code: "CYM 312",
      title: "Content Creation: Video, Podcast & Media for Youth",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 4,
      isElective: false,
      description:
        "Develops practical skills in creating engaging media content for youth audiences, including video production, podcasting, graphic design, and social media content creation.",
    },
    {
      code: "CYM 321",
      title: "Campus, Student & Intergenerational Ministry",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 5,
      isElective: false,
      description:
        "Examines ministry approaches for campus and student contexts, as well as intergenerational ministry that bridges age gaps and fosters meaningful connections across generations in the church.",
    },
    {
      code: "CYM 322",
      title: "Youth Culture, Gen-Z/Alpha & Contextual Engagement",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 5,
      isElective: false,
      description:
        "Analyses contemporary youth culture, Gen-Z and Gen-Alpha characteristics, digital native worldviews, and develops strategies for contextual engagement that connects the gospel to young people's lived experiences.",
    },
    {
      code: "CYM 411",
      title: "Online Youth Ministry & Virtual Community Building",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 6,
      isElective: false,
      description:
        "Explores models of online youth ministry, virtual community building, digital small groups, and hybrid approaches that maintain authentic relational ministry in online environments.",
    },
    {
      code: "CYM 412",
      title: "Mental Health & Emotional Wellness for Young People",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 6,
      isElective: false,
      description:
        "Addresses mental health challenges facing young people, including anxiety, depression, self-harm, and social media impact, equipping students to provide pastoral support and appropriate referral.",
    },
    {
      code: "CYM 413",
      title: "Safeguarding, Child Protection & Ministry Ethics",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 7,
      isElective: false,
      description:
        "Covers safeguarding policies, child protection protocols, ethical standards, and legal responsibilities for those working with children and youth in ministry settings.",
    },
    {
      code: "CYM 414",
      title: "Gamification, Technology & AI in Youth Engagement",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 7,
      isElective: false,
      description:
        "Explores innovative approaches to youth engagement through gamification, technology tools, and AI applications for interactive learning, discipleship, and community building.",
    },
    {
      code: "CYM 421",
      title: "Family Systems & Ministry to Families",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 8,
      isElective: false,
      description:
        "Studies family systems theory and its application to ministry, equipping students to support and strengthen families through pastoral care, education, and programme development.",
    },
    {
      code: "CYM 422",
      title: "Youth Ministry Administration & Fundraising",
      credits: 3,
      departmentCode: "CYM",
      programCode: "BA-CYM",
      semesterNumber: 8,
      isElective: false,
      description:
        "Covers the administrative, organisational, and financial aspects of youth ministry, including budgeting, fundraising strategies, volunteer management, and programme evaluation.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // B.A. CHRISTIAN EDUCATION SPECIALISATION (14 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "CED 211",
      title: "Foundations & Philosophy of Christian Education",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 2,
      isElective: false,
      description:
        "Explores the philosophical and theological foundations of Christian education, examining historical and contemporary approaches to teaching and learning within a biblical worldview.",
    },
    {
      code: "CED 212",
      title: "Educational Psychology & Learning Theory",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 2,
      isElective: false,
      description:
        "Studies educational psychology and learning theories, including cognitive, behavioral, and constructivist approaches, and their application to Christian teaching and discipleship contexts.",
    },
    {
      code: "CED 221",
      title: "Teaching Methods & Instructional Strategies",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 3,
      isElective: false,
      description:
        "Covers a range of teaching methods and instructional strategies for effective Christian education, including lecture, discussion, cooperative learning, case study, and experiential approaches.",
    },
    {
      code: "CED 222",
      title: "Bible Teaching Methods & Curriculum Design",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 3,
      isElective: false,
      description:
        "Develops skills in designing curriculum and teaching the Bible effectively, including lesson planning, scope-and-sequence development, and creating age-appropriate Bible study materials.",
    },
    {
      code: "CED 311",
      title: "E-Learning Design & Online Course Development",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 4,
      isElective: false,
      description:
        "Trains students in designing and developing online courses using learning management systems, multimedia tools, and instructional design principles for effective digital education.",
    },
    {
      code: "CED 312",
      title: "Educational Technology, AI & Digital Tools",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 4,
      isElective: false,
      description:
        "Explores the integration of educational technology, artificial intelligence, and digital tools into Christian education, including adaptive learning, assessment technology, and productivity platforms.",
    },
    {
      code: "CED 321",
      title: "Social Media & Content Creation for Education",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 5,
      isElective: false,
      description:
        "Develops skills in using social media platforms and content creation tools for educational purposes, including building learning communities, sharing resources, and engaging students online.",
    },
    {
      code: "CED 322",
      title: "Adult Education, Andragogy & Workplace Training",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 5,
      isElective: false,
      description:
        "Studies principles of adult education and andragogy, equipping students to design and deliver effective training programmes for adults in church, workplace, and professional development contexts.",
    },
    {
      code: "CED 411",
      title: "Sunday School, Small Groups & Discipleship Education",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 6,
      isElective: false,
      description:
        "Covers the organisation and leadership of Sunday school programmes, small group ministries, and discipleship education models within the local church and beyond.",
    },
    {
      code: "CED 412",
      title: "Christian School Administration & Governance",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 6,
      isElective: false,
      description:
        "Examines the principles and practices of administering Christian schools, including governance structures, staff management, accreditation processes, and maintaining a Christ-centred educational environment.",
    },
    {
      code: "CED 413",
      title: "Assessment, Evaluation & Grading",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 7,
      isElective: false,
      description:
        "Covers assessment design, evaluation methods, grading practices, and programme assessment in Christian education, including formative and summative approaches, rubric development, and data-driven improvement.",
    },
    {
      code: "CED 414",
      title: "Special Needs & Inclusive Education",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 7,
      isElective: false,
      description:
        "Addresses inclusive education practices for learners with special needs, including differentiated instruction, accommodation strategies, and creating accessible learning environments in Christian educational settings.",
    },
    {
      code: "CED 421",
      title: "Marketplace Education: Faith-Work Integration",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 8,
      isElective: false,
      description:
        "Explores educational approaches to integrating faith and work in the marketplace, equipping students to develop training programmes that prepare believers for Kingdom impact in professional settings.",
    },
    {
      code: "CED 422",
      title: "Video Production, Podcasting & Media for Education",
      credits: 3,
      departmentCode: "CED",
      programCode: "BA-CED",
      semesterNumber: 8,
      isElective: false,
      description:
        "Develops practical skills in video production, podcasting, and media creation for educational purposes, including instructional video design, educational podcast development, and multimedia learning resources.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PGD IN THEOLOGY (12 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "PGD 501",
      title: "Old Testament Theology",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 1,
      isElective: false,
      description:
        "Advanced study of Old Testament theology, examining major theological themes, covenantal frameworks, messianic prophecy, and the theological contribution of each Old Testament corpus.",
    },
    {
      code: "PGD 502",
      title: "New Testament Theology",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 1,
      isElective: false,
      description:
        "Advanced study of New Testament theology, tracing Christological, soteriological, and ecclesiological themes across the Gospels, Acts, Epistles, and Revelation.",
    },
    {
      code: "PGD 503",
      title: "Systematic Theology: Foundations & Methods",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 1,
      isElective: false,
      description:
        "Introduces the methods and major loci of systematic theology, providing a comprehensive framework for understanding Christian doctrine from evangelical and Pentecostal perspectives.",
    },
    {
      code: "PGD 504",
      title: "Church History: Major Movements & Themes",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 1,
      isElective: false,
      description:
        "Surveys major movements and themes in church history, from the apostolic fathers through the Reformation, modern missions, Pentecostal revival, and the rise of global Christianity.",
    },
    {
      code: "PGD 505",
      title: "Biblical Hermeneutics & Exegetical Methods",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 1,
      isElective: false,
      description:
        "Advanced study of hermeneutical theory and exegetical methods, equipping students with tools for rigorous biblical interpretation including genre analysis, contextual study, and theological synthesis.",
    },
    {
      code: "PGD 506",
      title: "Pneumatology & Spiritual Gifts",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 1,
      isElective: false,
      description:
        "Examines the doctrine of the Holy Spirit and spiritual gifts at the postgraduate level, engaging with Pentecostal, charismatic, and cessationist perspectives through careful biblical and theological analysis.",
    },
    {
      code: "PGD 507",
      title: "Prayer, Spiritual Warfare & Character Formation",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 2,
      isElective: false,
      description:
        "Advanced study of prayer theology, spiritual warfare, and character formation, integrating biblical teaching with practical spiritual disciplines for leadership development.",
    },
    {
      code: "PGD 508",
      title: "Homiletics: Principles of Preaching",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 2,
      isElective: false,
      description:
        "Develops preaching competence at the postgraduate level, covering sermon preparation, hermeneutical foundations for preaching, rhetorical strategies, and contemporary delivery methods.",
    },
    {
      code: "PGD 509",
      title: "Ministry in the Digital Age: Social Media, AI & Online Church",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 2,
      isElective: false,
      description:
        "Explores the transformation of ministry in the digital age, covering social media strategy, AI integration, online church models, and digital communication for effective 21st-century ministry.",
    },
    {
      code: "PGD 510",
      title: "Marketplace Theology & Faith-Work Integration",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 2,
      isElective: false,
      description:
        "Develops a theology of work and marketplace ministry, exploring how Christians integrate faith with professional practice and exercise Kingdom influence in secular workplaces.",
    },
    {
      code: "PGD 511",
      title: "Research Methods in Theological Studies",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 2,
      isElective: false,
      description:
        "Introduces postgraduate research methodology for theological studies, including research design, literature review, academic writing, and ethical considerations in religious research.",
    },
    {
      code: "PGD 512",
      title: "Research Project",
      credits: 3,
      departmentCode: "PGS",
      programCode: "PGD-THEO",
      semesterNumber: 2,
      isElective: false,
      description:
        "A supervised research project in which students apply research methods to investigate a theological question, producing an original scholarly work demonstrating postgraduate-level competence.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // M.A. SYSTEMATIC THEOLOGY (16 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "MST 601",
      title: "Theological Method & Prolegomena",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 1,
      isElective: false,
      description:
        "Examines the nature, sources, methods, and norms of theology, including prolegomena questions about revelation, authority, reason, experience, and tradition in constructing systematic theology.",
    },
    {
      code: "MST 602",
      title: "Doctrine of God: Trinity & Divine Action",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 1,
      isElective: false,
      description:
        "Advanced study of the doctrine of God, focusing on Trinitarian theology, divine attributes, divine action in the world, and contemporary debates in theology proper.",
    },
    {
      code: "MST 603",
      title: "Christology: Person & Work of Christ",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 1,
      isElective: false,
      description:
        "Examines the person and work of Jesus Christ from biblical, historical, and systematic perspectives, engaging with classical creeds, contemporary Christological debates, and contextual Christologies.",
    },
    {
      code: "MST 604",
      title: "Pneumatology: Advanced Studies in the Holy Spirit",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 1,
      isElective: false,
      description:
        "Advanced study of the Holy Spirit's person and work, engaging Pentecostal, charismatic, and classical traditions, with attention to Spirit baptism, gifts, sanctification, and ecclesial renewal.",
    },
    {
      code: "MST 605",
      title: "Theological Anthropology: Humanity, Sin & Grace",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 2,
      isElective: false,
      description:
        "Studies the theological understanding of human nature, the doctrine of sin, and the nature of divine grace, examining historical positions and contemporary challenges from science and culture.",
    },
    {
      code: "MST 606",
      title: "Soteriology: Atonement & Sanctification",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 2,
      isElective: false,
      description:
        "Advanced study of salvation theology, examining models of atonement, justification, regeneration, sanctification, perseverance, and the ordo salutis across theological traditions.",
    },
    {
      code: "MST 607",
      title: "Ecclesiology, Sacraments & the Digital Church",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 2,
      isElective: false,
      description:
        "Examines the doctrine of the church, sacramental theology, and emerging ecclesiological questions raised by digital church models, online communion, and virtual community.",
    },
    {
      code: "MST 608",
      title: "Eschatology: Biblical Hope & Last Things",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 2,
      isElective: false,
      description:
        "Advanced study of biblical eschatology, examining millennial views, the intermediate state, resurrection, judgement, and the new creation, with attention to hope as a theological virtue.",
    },
    {
      code: "MST 609",
      title: "Historical Theology: Patristic to Modern Era",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 3,
      isElective: false,
      description:
        "Traces the development of Christian doctrine from the church fathers through medieval scholasticism, the Reformation, and modern theology, analysing how doctrinal understanding has evolved.",
    },
    {
      code: "MST 610",
      title: "African Theology & Global Voices",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 3,
      isElective: false,
      description:
        "Explores African theological contributions, including inculturation theology, liberation theology, African Pentecostalism, and other non-Western perspectives shaping global Christianity.",
    },
    {
      code: "MST 611",
      title: "Theology of Work, Vocation & Marketplace Ministry",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 3,
      isElective: false,
      description:
        "Develops a robust theology of work and vocation, examining how systematic theology informs marketplace ministry, professional ethics, and the integration of faith and work.",
    },
    {
      code: "MST 612",
      title: "Theology, Technology & AI: Ethical Frameworks",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 3,
      isElective: false,
      description:
        "Examines the theological and ethical implications of technology and artificial intelligence, developing frameworks for faithful engagement with emerging technologies in church and society.",
    },
    {
      code: "MST 613",
      title: "Public Theology, Social Media & Cultural Engagement",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 4,
      isElective: false,
      description:
        "Explores how theology engages the public sphere through social media, cultural commentary, and prophetic witness, equipping students to articulate Christian perspectives in contemporary discourse.",
    },
    {
      code: "MST 614",
      title: "Research Methods & Theological Writing",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 4,
      isElective: false,
      description:
        "Advanced research methods for theological scholarship, including historiographical techniques, qualitative research, thesis development, and the craft of academic theological writing.",
    },
    {
      code: "MST 615",
      title: "Thesis I: Proposal & Literature Review",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 4,
      isElective: false,
      description:
        "Guides students through developing a thesis proposal and comprehensive literature review, establishing the research question, methodology, and theoretical framework for their thesis.",
    },
    {
      code: "MST 616",
      title: "Thesis II: Writing & Defence",
      credits: 3,
      departmentCode: "PGS",
      programCode: "MA-ST",
      semesterNumber: 4,
      isElective: false,
      description:
        "Supports students in completing and defending their master's thesis, including writing, revision, committee feedback integration, and oral defence preparation.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // M.A. PASTORAL COUNSELLING (16 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "MPC 601", title: "Theology of Pastoral Care & Soul Care", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 1, isElective: false,
      description: "Examines the theological foundations of pastoral care and soul care, integrating biblical, historical, and practical perspectives on shepherding God's people through life's challenges.",
    },
    {
      code: "MPC 602", title: "Integration of Psychology & Theology", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 1, isElective: false,
      description: "Explores models for integrating psychological science with theological truth, examining complementary and competing frameworks for understanding human nature and healing.",
    },
    {
      code: "MPC 603", title: "Theories & Techniques of Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 1, isElective: false,
      description: "Surveys major counselling theories and techniques including cognitive-behavioral, person-centred, psychodynamic, and solution-focused approaches, evaluated from a Christian perspective.",
    },
    {
      code: "MPC 604", title: "Crisis Intervention & Trauma-Informed Ministry", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 1, isElective: false,
      description: "Equips students with crisis intervention skills and trauma-informed approaches for ministry, including emergency response, stabilisation techniques, and referral protocols.",
    },
    {
      code: "MPC 605", title: "Marriage & Family Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 2, isElective: false,
      description: "Covers principles and techniques of marriage and family counselling from a pastoral perspective, addressing communication, conflict, intimacy, and family dynamics.",
    },
    {
      code: "MPC 606", title: "Grief, Loss & Bereavement Ministry", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 2, isElective: false,
      description: "Studies the theology and psychology of grief, loss, and bereavement, equipping students to provide compassionate pastoral care to those experiencing death, divorce, and other significant losses.",
    },
    {
      code: "MPC 607", title: "Addiction, Recovery & Restoration Ministry", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 2, isElective: false,
      description: "Examines the nature of addiction, recovery processes, and restoration ministry, integrating 12-step models with biblical principles for freedom and wholeness.",
    },
    {
      code: "MPC 608", title: "Mental Health First Aid & Congregational Wellness", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 2, isElective: false,
      description: "Trains students in mental health first aid and strategies for promoting congregational wellness, including identifying mental health needs and building supportive church communities.",
    },
    {
      code: "MPC 609", title: "Online Pastoral Care & Tele-Counselling Ethics", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 3, isElective: false,
      description: "Explores the practice and ethics of online pastoral care and tele-counselling, including platform selection, confidentiality, boundary management, and effective virtual care delivery.",
    },
    {
      code: "MPC 610", title: "Workplace Chaplaincy & Marketplace Pastoral Care", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 3, isElective: false,
      description: "Develops competence in workplace chaplaincy and marketplace pastoral care, equipping students to provide spiritual support in corporate, healthcare, and community settings.",
    },
    {
      code: "MPC 611", title: "Spiritual Direction, Formation & Inner Healing", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 3, isElective: false,
      description: "Studies the ministry of spiritual direction, formation practices, and inner healing prayer, integrating contemplative traditions with Pentecostal and evangelical approaches.",
    },
    {
      code: "MPC 612", title: "Social Media, Digital Burnout & Pastoral Response", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 3, isElective: false,
      description: "Addresses the pastoral challenges of social media addiction, digital burnout, and online toxicity, developing pastoral response strategies for the digital age.",
    },
    {
      code: "MPC 613", title: "Supervised Practicum (200 hrs)", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 4, isElective: false,
      description: "A 200-hour supervised clinical practicum providing hands-on counselling experience under professional supervision, with regular case review and competency evaluation.",
    },
    {
      code: "MPC 614", title: "Research Methods in Pastoral Care", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 4, isElective: false,
      description: "Covers research methods specific to pastoral care and counselling, including qualitative, quantitative, and mixed-methods approaches for studying pastoral practice effectiveness.",
    },
    {
      code: "MPC 615", title: "Capstone I: Proposal", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 4, isElective: false,
      description: "Guides students through developing a capstone project proposal in pastoral counselling, establishing the research problem, methodology, and expected contribution to the field.",
    },
    {
      code: "MPC 616", title: "Capstone II: Execution & Defence", credits: 3, departmentCode: "PGS", programCode: "MA-PC", semesterNumber: 4, isElective: false,
      description: "Supports students in completing and defending their capstone project, demonstrating competence in pastoral counselling research and professional practice.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // M.A. CHURCH ADMINISTRATION (16 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "MCA 601", title: "Theology of Church Governance & Polity", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 1, isElective: false,
      description: "Examines biblical and theological foundations of church governance, comparing episcopal, presbyterian, and congregational polities and their practical implications for church leadership.",
    },
    {
      code: "MCA 602", title: "Church Financial Management & Stewardship", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 1, isElective: false,
      description: "Covers financial management principles for churches and ministries, including budgeting, accounting, financial reporting, stewardship campaigns, and fiscal responsibility.",
    },
    {
      code: "MCA 603", title: "Strategic Planning for Churches & Ministries", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 1, isElective: false,
      description: "Teaches strategic planning methodologies applied to church and ministry contexts, including vision casting, SWOT analysis, goal setting, implementation, and evaluation.",
    },
    {
      code: "MCA 604", title: "Human Resource Management & Volunteer Dev.", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 1, isElective: false,
      description: "Covers human resource management for churches, including staff recruitment, training, evaluation, volunteer development, team building, and creating healthy organizational cultures.",
    },
    {
      code: "MCA 605", title: "Legal & Regulatory Framework for Religious Orgs", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 2, isElective: false,
      description: "Examines the legal and regulatory environment affecting religious organisations, including incorporation, tax exemption, employment law, insurance, and compliance requirements.",
    },
    {
      code: "MCA 606", title: "Digital Church Operations: Tech, AI & Automation", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 2, isElective: false,
      description: "Explores digital tools, AI solutions, and automation technologies for streamlining church operations, including church management software, communication platforms, and data management.",
    },
    {
      code: "MCA 607", title: "Church Branding, Social Media & Digital Comms", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 2, isElective: false,
      description: "Develops competence in church branding, social media strategy, and digital communications, including website management, email marketing, and building an online church identity.",
    },
    {
      code: "MCA 608", title: "Nonprofit Accounting, Compliance & Grant Writing", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 2, isElective: false,
      description: "Covers nonprofit accounting standards, compliance requirements, and grant writing skills for churches and faith-based organisations seeking external funding and maintaining financial accountability.",
    },
    {
      code: "MCA 609", title: "Church Growth, Data Analytics & Ministry Metrics", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 3, isElective: false,
      description: "Explores data-driven approaches to church growth, including analytics tools, key performance indicators, membership tracking, and using data to inform ministry strategy.",
    },
    {
      code: "MCA 610", title: "Conflict Management & Crisis Communication", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 3, isElective: false,
      description: "Develops skills in conflict management, crisis communication, and reputation management for churches, including mediation techniques and responding to public relations challenges.",
    },
    {
      code: "MCA 611", title: "Facilities, Events & Online/Hybrid Service Mgmt", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 3, isElective: false,
      description: "Covers church facility management, event planning, and the administration of online and hybrid worship services, including technical production and volunteer coordination.",
    },
    {
      code: "MCA 612", title: "Marketplace Ministry: Equipping for Workplace Impact", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 3, isElective: false,
      description: "Explores how church administration can support marketplace ministry, equipping congregants for workplace influence and developing church programmes that bridge Sunday and Monday.",
    },
    {
      code: "MCA 613", title: "Supervised Admin Field Placement (150 hrs)", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 4, isElective: false,
      description: "A 150-hour supervised field placement in a church or ministry administrative setting, providing hands-on experience in governance, operations, and organizational leadership.",
    },
    {
      code: "MCA 614", title: "Research Methods in Ministry Administration", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 4, isElective: false,
      description: "Covers research methods applicable to ministry administration, including programme evaluation, organisational assessment, survey design, and action research in church settings.",
    },
    {
      code: "MCA 615", title: "Capstone I: Institutional Analysis", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 4, isElective: false,
      description: "Guides students through conducting an institutional analysis of a church or ministry organisation, identifying strengths, challenges, and opportunities for administrative improvement.",
    },
    {
      code: "MCA 616", title: "Capstone II: Strategic Plan & Defence", credits: 3, departmentCode: "PGS", programCode: "MA-CA", semesterNumber: 4, isElective: false,
      description: "Students develop and defend a comprehensive strategic plan for a church or ministry organisation, demonstrating mastery of church administration principles and leadership competence.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // M.A. CHRISTIAN COUNSELLING (18 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "MCC 601", title: "Foundations of Christian Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 1, isElective: false,
      description: "Establishes the biblical, theological, and historical foundations for Christian counselling practice, examining models of integration and the counsellor's identity and calling.",
    },
    {
      code: "MCC 602", title: "Theories & Techniques of Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 1, isElective: false,
      description: "Comprehensive survey of major counselling theories and therapeutic techniques, evaluated and integrated from a Christian worldview for effective clinical practice.",
    },
    {
      code: "MCC 603", title: "Abnormal Psychology & Psychopathology", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 1, isElective: false,
      description: "Studies abnormal psychology and psychopathology, including DSM diagnostic categories, etiology, symptom presentation, and differential diagnosis from an integrated Christian perspective.",
    },
    {
      code: "MCC 604", title: "Integration of Theology & Psychology", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 1, isElective: false,
      description: "Examines advanced models for integrating theology and psychology, addressing philosophical questions about human nature, consciousness, suffering, and healing.",
    },
    {
      code: "MCC 605", title: "Marriage & Family Therapy", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 1, isElective: false,
      description: "Covers theoretical foundations and practical techniques of marriage and family therapy, including systems theory, Gottman method, emotionally focused therapy, and biblical perspectives.",
    },
    {
      code: "MCC 606", title: "Trauma, Crisis & Disaster Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 2, isElective: false,
      description: "Prepares students for trauma counselling, crisis intervention, and disaster response, including PTSD treatment, critical incident debriefing, and resilience building.",
    },
    {
      code: "MCC 607", title: "Child & Adolescent Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 2, isElective: false,
      description: "Covers specialised counselling approaches for children and adolescents, including play therapy, developmental considerations, family involvement, and school-based interventions.",
    },
    {
      code: "MCC 608", title: "Addiction Counselling & Recovery Ministry", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 2, isElective: false,
      description: "Examines the neuroscience and psychology of addiction alongside Christian recovery approaches, covering substance abuse, behavioral addictions, and recovery programme development.",
    },
    {
      code: "MCC 609", title: "Group Counselling & Facilitation", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 2, isElective: false,
      description: "Teaches the theory and practice of group counselling, including group dynamics, facilitation skills, therapeutic factors, and designing group programmes for church and clinical settings.",
    },
    {
      code: "MCC 610", title: "Digital Counselling & Tele-Pastoral Care", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 2, isElective: false,
      description: "Explores the growing field of digital counselling and tele-pastoral care, including platform management, virtual rapport building, ethical considerations, and technology best practices.",
    },
    {
      code: "MCC 611", title: "Ethics, Law & Professional Standards", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 3, isElective: false,
      description: "Covers ethical codes, legal requirements, and professional standards for Christian counsellors, including confidentiality, informed consent, dual relationships, and record-keeping.",
    },
    {
      code: "MCC 612", title: "Mental Health Ministry & Congregational Wellness", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 3, isElective: false,
      description: "Develops strategies for church-based mental health ministry, including psychoeducation, support groups, stigma reduction, and creating congregations that promote emotional and spiritual wellness.",
    },
    {
      code: "MCC 613", title: "Workplace Stress, Burnout & Vocational Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 3, isElective: false,
      description: "Addresses workplace stress, professional burnout, and vocational counselling from a Christian perspective, helping clients find meaning, balance, and purpose in their work lives.",
    },
    {
      code: "MCC 614", title: "Human Sexuality, Gender & Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 3, isElective: false,
      description: "Examines human sexuality and gender issues from biblical, psychological, and clinical perspectives, equipping counsellors to address sensitive topics with truth, compassion, and professionalism.",
    },
    {
      code: "MCC 615", title: "Counselling Practicum (150 hrs)", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 3, isElective: false,
      description: "A 150-hour supervised counselling practicum providing clinical experience in assessment, treatment planning, therapeutic intervention, and professional documentation under supervision.",
    },
    {
      code: "MCC 616", title: "Counselling Internship (150 hrs)", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 4, isElective: false,
      description: "A 150-hour supervised counselling internship building on the practicum, providing advanced clinical experience with greater independence and a broader range of client populations.",
    },
    {
      code: "MCC 617", title: "Research Methods in Counselling", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 4, isElective: false,
      description: "Covers research methods for counselling psychology, including quantitative and qualitative designs, outcome research, programme evaluation, and evidence-based practice.",
    },
    {
      code: "MCC 618", title: "Thesis or Capstone Case Portfolio", credits: 3, departmentCode: "PGS", programCode: "MA-CC", semesterNumber: 4, isElective: false,
      description: "The culminating project where students complete either a research thesis or a comprehensive capstone case portfolio demonstrating clinical competence and scholarly reflection.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // M.A. MINISTRY LEADERSHIP (14 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "MML 601", title: "Theology of Leadership: Biblical Foundations", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 1, isElective: false,
      description: "Examines the biblical and theological foundations of leadership, studying leadership models from Scripture and developing a theology of servant leadership for ministry contexts.",
    },
    {
      code: "MML 602", title: "Transformational & Servant Leadership", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 1, isElective: false,
      description: "Studies transformational and servant leadership theories, comparing secular leadership models with biblical principles and developing practical skills for leading organisational change.",
    },
    {
      code: "MML 603", title: "Strategic Vision, Planning & Execution", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 1, isElective: false,
      description: "Develops skills in strategic vision casting, planning, and execution for ministry leaders, including goal setting, resource allocation, stakeholder engagement, and measuring impact.",
    },
    {
      code: "MML 604", title: "Organisational Behaviour & Team Dynamics", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 1, isElective: false,
      description: "Studies organisational behaviour theory and team dynamics, equipping leaders to understand group processes, motivate teams, manage culture, and build high-performing ministry teams.",
    },
    {
      code: "MML 605", title: "Financial Leadership & Resource Stewardship", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 1, isElective: false,
      description: "Covers financial leadership principles for ministry leaders, including budgeting, fundraising, resource stewardship, financial accountability, and sustainable ministry economics.",
    },
    {
      code: "MML 606", title: "Leading Change & Digital Transformation", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 2, isElective: false,
      description: "Addresses the theory and practice of leading organisational change and digital transformation in ministry settings, including change management models and technology adoption strategies.",
    },
    {
      code: "MML 607", title: "Conflict Resolution & Crisis Leadership", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 2, isElective: false,
      description: "Develops skills in conflict resolution, mediation, negotiation, and crisis leadership, equipping ministry leaders to navigate interpersonal and organisational challenges effectively.",
    },
    {
      code: "MML 608", title: "Social Media Strategy & Online Influence", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 2, isElective: false,
      description: "Explores social media strategy, personal branding, and online influence building for ministry leaders, including content strategy, audience engagement, and digital reputation management.",
    },
    {
      code: "MML 609", title: "Marketplace Ministry: Beyond Church Walls", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 2, isElective: false,
      description: "Examines how ministry leadership extends beyond church walls into the marketplace, equipping leaders to serve as Kingdom agents in business, government, and civil society.",
    },
    {
      code: "MML 610", title: "AI, Data & Tech for Ministry Decision-Making", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 2, isElective: false,
      description: "Explores how artificial intelligence, data analytics, and technology tools can enhance ministry decision-making, strategic planning, and operational effectiveness.",
    },
    {
      code: "MML 611", title: "Entrepreneurship & Kingdom Business", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 3, isElective: false,
      description: "Integrates entrepreneurship principles with Kingdom theology, equipping leaders to launch and manage Kingdom-minded businesses and social enterprises.",
    },
    {
      code: "MML 612", title: "Supervised Leadership Practicum (120 hrs)", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 3, isElective: false,
      description: "A 120-hour supervised leadership practicum providing hands-on experience in leading ministry initiatives, teams, or programmes under the guidance of an experienced mentor.",
    },
    {
      code: "MML 613", title: "Research Methods in Leadership", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 3, isElective: false,
      description: "Covers research methods applicable to leadership studies, including case study research, action research, survey design, and data analysis for ministry leadership contexts.",
    },
    {
      code: "MML 614", title: "Capstone: Strategic Leadership Project", credits: 3, departmentCode: "PGS", programCode: "MA-ML", semesterNumber: 3, isElective: false,
      description: "The culminating project where students design, implement, and evaluate a strategic leadership initiative, demonstrating mastery of leadership theory and practice.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // M.A. MARRIAGE & FAMILY MINISTRY (16 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "MMF 601", title: "Theology of Marriage, Sexuality & Family", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 1, isElective: false,
      description: "Examines the biblical and theological foundations of marriage, human sexuality, and family, establishing a framework for ministry that affirms God's design for relationships.",
    },
    {
      code: "MMF 602", title: "Family Systems Theory & Intervention", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 1, isElective: false,
      description: "Studies family systems theory and intervention strategies, including structural, strategic, and Bowenian approaches to understanding and addressing family dynamics.",
    },
    {
      code: "MMF 603", title: "Premarital Counselling & Marriage Preparation", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 1, isElective: false,
      description: "Develops skills in premarital counselling and marriage preparation programmes, including assessment tools, communication skills training, and addressing expectations and compatibility.",
    },
    {
      code: "MMF 604", title: "Marriage Enrichment & Communication Skills", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 1, isElective: false,
      description: "Covers marriage enrichment approaches and communication skills training, equipping students to lead couples retreats, workshops, and ongoing support programmes for married couples.",
    },
    {
      code: "MMF 605", title: "Divorce, Remarriage & Blended Family Ministry", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 2, isElective: false,
      description: "Addresses the pastoral and counselling dimensions of divorce, remarriage, and blended family dynamics, providing biblical guidance and practical ministry strategies.",
    },
    {
      code: "MMF 606", title: "Parenting in the Digital Age", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 2, isElective: false,
      description: "Explores the challenges and opportunities of parenting in the digital age, including screen time management, online safety, digital discipleship, and maintaining family connection.",
    },
    {
      code: "MMF 607", title: "Adolescence, Identity & Family Transitions", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 2, isElective: false,
      description: "Studies adolescent development, identity formation, and family life transitions, equipping students to support families navigating the challenges of raising teenagers.",
    },
    {
      code: "MMF 608", title: "Domestic Violence & Family Crisis Intervention", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 2, isElective: false,
      description: "Addresses domestic violence, abuse, and family crisis intervention, covering safety planning, legal awareness, trauma response, and pastoral care for affected families.",
    },
    {
      code: "MMF 609", title: "Online Family Counselling & Virtual Support", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 3, isElective: false,
      description: "Explores online family counselling methods and virtual support group facilitation, including technology platforms, ethical considerations, and best practices for remote care.",
    },
    {
      code: "MMF 610", title: "Work-Life Balance & Marketplace Stress", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 3, isElective: false,
      description: "Addresses work-life balance challenges and marketplace stress from a family ministry perspective, helping families navigate dual careers, financial pressure, and competing demands.",
    },
    {
      code: "MMF 611", title: "Mental Health & Family Resilience", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 3, isElective: false,
      description: "Studies mental health issues affecting families and strategies for building family resilience, including prevention, early intervention, and creating supportive church environments.",
    },
    {
      code: "MMF 612", title: "Ethics in Marriage & Family Practice", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 3, isElective: false,
      description: "Covers ethical standards and professional guidelines for marriage and family ministry practice, including confidentiality, boundaries, dual relationships, and cultural sensitivity.",
    },
    {
      code: "MMF 613", title: "Supervised Family Ministry Practicum (200 hrs)", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 4, isElective: false,
      description: "A 200-hour supervised practicum in family ministry settings, providing hands-on experience in premarital counselling, marriage enrichment, family counselling, and programme facilitation.",
    },
    {
      code: "MMF 614", title: "Research Methods in Family Studies", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 4, isElective: false,
      description: "Covers research methods applicable to family studies, including survey research, qualitative interviews, programme evaluation, and evidence-based practice in family ministry.",
    },
    {
      code: "MMF 615", title: "Capstone I: Family Ministry Plan", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 4, isElective: false,
      description: "Guides students through developing a comprehensive family ministry plan for a church or organisation, integrating theory, research, and practical strategies.",
    },
    {
      code: "MMF 616", title: "Capstone II: Presentation & Defence", credits: 3, departmentCode: "PGS", programCode: "MA-MFM", semesterNumber: 4, isElective: false,
      description: "Students present and defend their family ministry plan, demonstrating mastery of family systems knowledge, counselling skills, and programme development competence.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MASTER OF DIVINITY (26 courses)
    // ═══════════════════════════════════════════════════════════════════════
    {
      code: "DIV 601", title: "OT Exegesis I: Pentateuch & Historical Books", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 1, isElective: false,
      description: "Advanced exegetical study of the Pentateuch and Historical Books, employing critical methods to interpret the text in its ancient Near Eastern context and draw theological significance.",
    },
    {
      code: "DIV 602", title: "OT Exegesis II: Prophets & Wisdom", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 1, isElective: false,
      description: "Advanced exegetical study of the Prophetic and Wisdom literature of the Old Testament, exploring their literary forms, theological themes, and contemporary relevance.",
    },
    {
      code: "DIV 603", title: "NT Exegesis I: Gospels & Acts", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 2, isElective: false,
      description: "Advanced exegetical study of the Synoptic Gospels, the Gospel of John, and the Acts of the Apostles, employing redaction criticism, narrative analysis, and theological interpretation.",
    },
    {
      code: "DIV 604", title: "NT Exegesis II: Epistles & Revelation", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 2, isElective: false,
      description: "Advanced exegetical study of the Pauline and General Epistles and Revelation, examining their theological contributions to New Testament Christianity and contemporary application.",
    },
    {
      code: "DIV 605", title: "Biblical Greek: Grammar & Exegesis", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 1, isElective: false,
      description: "Studies the grammar and syntax of biblical Greek (Koine), enabling students to read, translate, and exegete the New Testament in its original language.",
    },
    {
      code: "DIV 606", title: "Biblical Hebrew: Grammar & OT Reading", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 2, isElective: false,
      description: "Studies the grammar and syntax of biblical Hebrew, enabling students to read, translate, and interpret selected Old Testament passages in the original language.",
    },
    {
      code: "DIV 607", title: "Systematic Theology I: God, Christ & Salvation", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 1, isElective: false,
      description: "Graduate-level systematic theology covering the doctrines of God, Christ, and salvation, integrating biblical exegesis, historical development, and contemporary theological reflection.",
    },
    {
      code: "DIV 608", title: "Systematic Theology II: Church, Spirit & Last Things", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 2, isElective: false,
      description: "Graduate-level systematic theology covering ecclesiology, pneumatology, and eschatology, engaging diverse denominational perspectives and contemporary challenges.",
    },
    {
      code: "DIV 609", title: "Historical Theology: Patristics to Modern", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 2, isElective: false,
      description: "Surveys the development of Christian theology from the patristic period to the modern era, examining key thinkers, movements, and doctrinal controversies that shaped the church.",
    },
    {
      code: "DIV 610", title: "Christian Ethics & Moral Theology", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 3, isElective: false,
      description: "Studies the foundations and methods of Christian ethics and moral theology, applying biblical and theological principles to contemporary ethical dilemmas and social issues.",
    },
    {
      code: "DIV 611", title: "Pneumatology & Spiritual Gifts in Ministry", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 1, isElective: false,
      description: "Advanced study of pneumatology with emphasis on the practical operation of spiritual gifts in ministry, integrating theological reflection with experiential and pastoral perspectives.",
    },
    {
      code: "DIV 612", title: "Apologetics & Worldview Analysis", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 3, isElective: false,
      description: "Equips students in Christian apologetics and worldview analysis, developing the ability to defend the faith, engage secular philosophies, and articulate a comprehensive Christian worldview.",
    },
    {
      code: "DIV 613", title: "Homiletics I: Expository Preaching", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 3, isElective: false,
      description: "Develops expository preaching skills at the graduate level, covering hermeneutical foundations, sermon structure, illustration, application, and delivery techniques for powerful biblical preaching.",
    },
    {
      code: "DIV 614", title: "Homiletics II: Advanced Preaching & Sermon Lab", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 3, isElective: false,
      description: "Advanced preaching course with an intensive sermon laboratory, developing skills in narrative preaching, topical preaching, special occasion sermons, and cross-cultural communication.",
    },
    {
      code: "DIV 615", title: "Pastoral Theology & Ministerial Practice", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 4, isElective: false,
      description: "Comprehensive study of pastoral theology and ministerial practice, covering worship leadership, sacramental ministry, pastoral visitation, hospital chaplaincy, and congregational care.",
    },
    {
      code: "DIV 616", title: "Pastoral Counselling, Mental Health & Soul Care", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 4, isElective: false,
      description: "Integrates pastoral counselling skills with mental health awareness and soul care practices, preparing M.Div. students for the counselling dimensions of pastoral ministry.",
    },
    {
      code: "DIV 617", title: "Church Admin, Digital Operations & Governance", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 4, isElective: false,
      description: "Covers church administration, digital operations management, and governance structures for M.Div. students, equipping them for the organisational leadership demands of pastoral ministry.",
    },
    {
      code: "DIV 618", title: "Marketplace Ministry & Faith-Work-Vocation", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 5, isElective: false,
      description: "Develops a theology of marketplace ministry, faith-work integration, and vocational calling, equipping M.Div. graduates to lead congregants in connecting faith with their professional lives.",
    },
    {
      code: "DIV 619", title: "Prayer, Spiritual Warfare & Character Formation", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 4, isElective: false,
      description: "Advanced study of prayer, spiritual warfare, and character formation for ministry leaders, emphasising personal spiritual discipline as the foundation for effective pastoral leadership.",
    },
    {
      code: "DIV 620", title: "Supervised Ministry Practicum I (200 hrs)", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 5, isElective: false,
      description: "A 200-hour supervised ministry practicum providing comprehensive hands-on experience in pastoral duties, preaching, counselling, teaching, and church administration under professional supervision.",
    },
    {
      code: "DIV 621", title: "Supervised Ministry Practicum II (200 hrs)", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 6, isElective: false,
      description: "A second 200-hour supervised ministry practicum building on Practicum I, providing advanced ministry experience with increased leadership responsibility and a broader range of pastoral duties.",
    },
    {
      code: "DIV 622", title: "Integrative Ministry Seminar & Portfolio", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 5, isElective: false,
      description: "An integrative seminar where students synthesise their theological education with ministry practice, developing a professional portfolio demonstrating competence across ministry domains.",
    },
    {
      code: "DIV 623", title: "Social Media, Content Creation & Digital Outreach", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 5, isElective: false,
      description: "Develops practical skills in social media management, content creation, and digital outreach for M.Div. students, equipping them to extend their ministry influence through digital platforms.",
    },
    {
      code: "DIV 624", title: "AI, Technology & the Future of Church Ministry", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 6, isElective: false,
      description: "Explores the implications of artificial intelligence and emerging technologies for the future of church ministry, including ethical frameworks, strategic adoption, and theological reflection.",
    },
    {
      code: "DIV 625", title: "Research Methods in Theology & Ministry", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 6, isElective: false,
      description: "Covers advanced research methods for theological and ministry studies, preparing students for thesis writing, including qualitative and quantitative approaches, and action research.",
    },
    {
      code: "DIV 626", title: "Thesis or Ministry Project", credits: 3, departmentCode: "DIV", programCode: "MDIV", semesterNumber: 6, isElective: false,
      description: "The culminating academic exercise where M.Div. students complete and defend either a research thesis or a comprehensive ministry project demonstrating theological integration and professional competence.",
    },
  ];

  // Batch upsert all courses
  let courseCount = 0;
  for (const course of courses) {
    const dept = deptRecords[course.departmentCode];
    if (!dept) {
      console.error(`Department ${course.departmentCode} not found for course ${course.code}`);
      continue;
    }

    const programId = course.programCode
      ? programRecords[course.programCode]?.id ?? null
      : null;

    await prisma.course.upsert({
      where: { code: course.code },
      update: {
        title: course.title,
        creditUnits: course.credits,
        departmentId: dept.id,
        programId,
        semesterNumber: course.semesterNumber,
        isElective: course.isElective,
        description: course.description,
      },
      create: {
        code: course.code,
        title: course.title,
        creditUnits: course.credits,
        departmentId: dept.id,
        programId,
        semesterNumber: course.semesterNumber,
        isElective: course.isElective,
        description: course.description,
      },
    });
    courseCount++;
  }

  console.log(`\nSeed complete!`);
  console.log(`  Faculties: 3`);
  console.log(`  Departments: ${Object.keys(departments).length}`);
  console.log(`  Programs: ${programDefs.length}`);
  console.log(`  Courses: ${courseCount}`);
  console.log(`  Old programs deactivated: ${oldProgramCodes.join(", ")}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
