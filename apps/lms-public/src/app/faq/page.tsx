import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent } from "@repo/ui";
import { ArrowRight, HelpCircle, MessageSquare } from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about Berean Bible Academy, including the hybrid delivery model, admissions, programmes, accreditation, grading, and academic policies.",
};

interface FaqCategory {
  category: string;
  questions: { q: string; a: string }[];
}

const faqs: FaqCategory[] = [
  {
    category: "General",
    questions: [
      {
        q: "What is Berean Bible Academy?",
        a: "Berean Bible Academy (BBA) is an institution dedicated to providing accessible, affordable, and rigorous theological education. We offer 12 programmes: 4 Bachelor of Arts degrees, a Postgraduate Diploma in Theology, 6 Master of Arts specialisations, and the Master of Divinity (M.Div.).",
      },
      {
        q: "What is BBA's motto?",
        a: "Our motto is \"It takes training to triumph.\" We believe that thorough, Spirit-empowered theological training is essential for effective Kingdom service.",
      },
      {
        q: "Is BBA a denominational institution?",
        a: "No, BBA is interdenominational. We welcome students from all Christian denominations and backgrounds. Our teaching is grounded in the historic Christian faith with a Spirit-filled emphasis, drawing from the traditions of leading schools of ministry.",
      },
    ],
  },
  {
    category: "Hybrid Delivery Model",
    questions: [
      {
        q: "What is the hybrid delivery model?",
        a: "BBA uses a hybrid model: 70% online learning (asynchronous video lectures, discussion forums, digital resources available 24/7), 20% on-campus intensives (1-2 week residential sessions per semester in January and July), and 10% supervised practicum (field ministry placements at local churches, organisations, or approved sites).",
      },
      {
        q: "What happens during on-campus intensives?",
        a: "On-campus intensives include preaching labs, counselling practicums, prayer retreats, ministry simulations, impartation services, chapel, oral exams, thesis defences, and portfolio presentations. These sessions provide hands-on experiences that complement online learning.",
      },
      {
        q: "What technology is used for online learning?",
        a: "We use a Learning Management System (LMS) for course delivery, Zoom and Google Meet for live sessions and virtual office hours, WhatsApp and Telegram for communications, and the Digital Theological Library (DTL/ATLA) for research resources.",
      },
      {
        q: "Can I study entirely online?",
        a: "Most coursework (70%) is completed online, but all students are required to attend on-campus intensives (20%) and complete supervised practicum hours (10%). This ensures practical ministry skills alongside academic knowledge.",
      },
    ],
  },
  {
    category: "Admissions",
    questions: [
      {
        q: "What are the admission requirements for the B.A. programmes?",
        a: "You need five (5) O'Level credit passes (WAEC/NECO/GCE) including English Language in a maximum of two sittings. Direct Entry at 200 Level is available with NCE, ND, or Diploma in Theology. Mature Entry (age 25+) requires 3 years of ministry experience plus an entrance assessment. A pastoral recommendation and statement of purpose are required for all applicants.",
      },
      {
        q: "What are the requirements for postgraduate programmes?",
        a: "PGD requires a Bachelor's degree (any discipline) with a minimum of 2.2 (CGPA 2.50) and two references. M.A. programmes require a B.A. in theology or related field (non-theology graduates complete the PGD first), minimum 2.2, two references, and a writing sample. M.Div. requires a Bachelor's degree (any discipline), minimum 2.2, evidence of calling, and three references.",
      },
      {
        q: "How do I apply?",
        a: "Apply online through our student portal. Create an account, fill out the application form, upload required documents (certificates, transcripts, passport photographs, recommendation letter, statement of purpose, and valid ID), and pay the application fee. You will receive an admission decision via email.",
      },
      {
        q: "Can international students apply?",
        a: "Yes. BBA's hybrid model makes our programmes accessible to students across Africa and the world. All instruction is in English. On-campus intensives are held at our campus location.",
      },
    ],
  },
  {
    category: "Programmes & Courses",
    questions: [
      {
        q: "What programmes does BBA offer?",
        a: "We offer 12 programmes: B.A. Pastoral Ministry, B.A. Missions & Intercultural Studies, B.A. Children & Youth Ministry, B.A. Christian Education (all 120 credits, 4 years), PGD in Theology (36 credits, 1 year), M.A. Systematic Theology, M.A. Pastoral Counselling, M.A. Church Administration, M.A. Christian Counselling, M.A. Ministry Leadership, M.A. Marriage & Family Ministry (42-54 credits, 18 months to 2 years), and M.Div. (78 credits, 3 years).",
      },
      {
        q: "How many credits per semester can I take?",
        a: "The standard load is 5 courses (15 credits) per semester. With the Dean's approval, students may take a maximum of 6 courses (18 credits) per semester.",
      },
      {
        q: "Can I transfer credits from another institution?",
        a: "Yes, a maximum of 40% of total programme credits may be transferred. Undergraduate transfers require a minimum grade of C, and postgraduate transfers require a minimum grade of B. Official transcripts are required, and all transfer credits are reviewed by the Academic Standards Committee.",
      },
      {
        q: "What is the PGD in Theology for?",
        a: "The PGD is a one-year bridge programme for graduates of any discipline who wish to enter theological studies at the master's level. It provides foundational theology, biblical studies, and ministry preparation. Credits are transferable to M.A. programmes.",
      },
    ],
  },
  {
    category: "Academic Policies & Grading",
    questions: [
      {
        q: "What grading system does BBA use?",
        a: "BBA uses the Nigerian 5-point grading scale: A (70-100%, 5.0 points, Distinction), B (60-69%, 4.0 points, Upper Credit), C (50-59%, 3.0 points, Lower Credit), D (45-49%, 2.0 points, Pass), E (40-44%, 1.0 point, Conditional Pass for UG only), and F (0-39%, 0.0 points, Fail).",
      },
      {
        q: "What CGPA do I need to remain in good standing?",
        a: "Undergraduate students need a CGPA of 2.50 or above, and postgraduate students need 3.50 or above. Students who fall below the minimum for one semester are placed on academic probation. Two consecutive semesters below minimum leads to dismissal.",
      },
      {
        q: "What are the graduation requirements?",
        a: "B.A.: Minimum CGPA 2.00, all 120 credits completed, 300 practicum hours, and thesis. PGD: Minimum CGPA 3.00, all 36 credits and research project. M.A.: Minimum CGPA 3.50, all credits, practicum, and thesis/capstone. M.Div.: Minimum CGPA 3.50, all 78 credits, 400 practicum hours, and thesis.",
      },
    ],
  },
  {
    category: "Accreditation",
    questions: [
      {
        q: "Is BBA accredited?",
        a: "BBA is pursuing accreditation through a phased pathway. Phase 1 (Year 1) involves registration as a religious educational institution and building our LMS infrastructure. Phase 2 (Years 1-2) targets theological accreditation through bodies such as TAI, IATA, ACI, or ITAA. Phase 3 (Years 3-5) pursues ATS candidacy. Phase 4 (Years 5-10) aims for full regional or national accreditation.",
      },
      {
        q: "Will my degree be recognised?",
        a: "Students are always clearly informed of BBA's current accreditation status and its implications. Our curriculum meets high academic standards aligned with globally recognised seminary frameworks (ATS). As we progress through our accreditation pathway, recognition will continue to expand.",
      },
    ],
  },
  {
    category: "Tuition & Payments",
    questions: [
      {
        q: "How much is tuition?",
        a: "Tuition amounts for the 2026/2027 session will be published before the start of the academic year. Contact the admissions office for the latest fee schedule.",
      },
      {
        q: "What scholarships are available?",
        a: "BBA offers several scholarships: Merit (CGPA 4.50+: 25-50% off), Ministry (5+ years of service: 30-50% off), Women in Ministry (25-40% off), Need-Based (case by case), Early Bird (10-15% for early full payment), and Group Enrolment (5+ from one church: 15-20% off). Visit the Tuition page for full details.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept payments via Paystack (debit/credit card, bank transfer, USSD), direct bank transfer, and mobile money. International students can pay using any Visa or Mastercard.",
      },
      {
        q: "Can I pay in installments?",
        a: "Yes, we offer installment payment plans. You can split your semester tuition into two or three payments. Contact the finance office to arrange a payment plan before the semester begins.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            Find answers to the most common questions about Berean Bible Academy.
            Can&apos;t find what you need? Contact us directly.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl space-y-12">
            {faqs.map((category) => (
              <div key={category.category}>
                <div className="mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">{category.category}</h2>
                </div>
                <div className="space-y-3">
                  {category.questions.map((faq, i) => (
                    <Card key={i}>
                      <CardContent className="py-4">
                        <h3 className="mb-2 font-semibold">{faq.q}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {faq.a}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="bg-slate-50 py-16">
        <div className="container text-center">
          <MessageSquare className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="mb-4 text-2xl font-bold">Still Have Questions?</h2>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
            Our team is happy to help. Reach out to us and we will get back to
            you as soon as possible.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/contact">
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${PORTAL_URL}/application`}>Apply Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
