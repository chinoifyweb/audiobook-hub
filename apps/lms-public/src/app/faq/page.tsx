import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent } from "@repo/ui";
import { ArrowRight, HelpCircle, MessageSquare } from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about Berean Bible Academy, including admissions, programs, tuition, and online learning.",
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
        a: "Berean Bible Academy (BBA) is an online institution dedicated to providing quality biblical education. We offer certificate, diploma, bachelor's, and master's programs in theology, biblical studies, ministry, and related fields.",
      },
      {
        q: "Is BBA accredited?",
        a: "BBA is working toward full accreditation with relevant educational bodies. Our curriculum meets high academic standards and our degrees are recognized by partner churches and organizations.",
      },
      {
        q: "Is BBA a denominational institution?",
        a: "No, BBA is interdenominational. We welcome students from all Christian denominations and backgrounds. Our teaching is grounded in the historic Christian faith as expressed in the Bible.",
      },
    ],
  },
  {
    category: "Admissions",
    questions: [
      {
        q: "What are the admission requirements?",
        a: "Requirements vary by program. Certificate and diploma programs require at least an SSCE or equivalent. Bachelor's programs require a diploma or equivalent. Master's programs require a bachelor's degree. All applicants need a pastoral recommendation letter.",
      },
      {
        q: "How do I apply?",
        a: "You can apply online through our student portal. Create an account, fill out the application form, upload required documents, and pay the application fee. You will receive an admission decision via email.",
      },
      {
        q: "When is the application deadline?",
        a: "We accept applications throughout the year, but the main intake is in September. The regular deadline is June 30, with late applications accepted until August 15. Early applications (before March 31) receive priority consideration.",
      },
      {
        q: "Can international students apply?",
        a: "Yes! BBA is a fully online institution, so students from any country can apply and study with us. All instruction is in English.",
      },
    ],
  },
  {
    category: "Programs & Courses",
    questions: [
      {
        q: "What programs do you offer?",
        a: "We offer Certificate in Christian Ministry, Certificate in Christian Education, Diploma in Theology, Diploma in Pastoral Studies, Bachelor of Biblical Studies, Bachelor of Christian Leadership, Master of Divinity, and Master of Arts in Biblical Counseling.",
      },
      {
        q: "How long does each program take?",
        a: "Certificate programs take 1 year (2 semesters), diploma programs take 2 years (4 semesters), bachelor's programs take 4 years (8 semesters), and master's programs take 2-3 years (4-6 semesters).",
      },
      {
        q: "Are courses self-paced?",
        a: "Courses follow a semester schedule with defined start and end dates. Within each semester, students have flexibility in when they access materials and complete assignments, subject to assignment deadlines.",
      },
      {
        q: "Can I transfer credits from another institution?",
        a: "Yes, we evaluate transfer credits on a case-by-case basis. Please submit your transcripts along with your application, and our academic office will assess which credits can be transferred.",
      },
    ],
  },
  {
    category: "Tuition & Payments",
    questions: [
      {
        q: "How much is tuition?",
        a: "Tuition varies by program. Certificate programs start at \u20A625,000/semester, diploma programs at \u20A635,000/semester, bachelor's programs at \u20A650,000/semester, and master's programs at \u20A675,000/semester. Visit our Tuition page for full details.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept payments via Paystack (debit/credit card, bank transfer, USSD), direct bank transfer, and mobile money. International students can pay using any Visa or Mastercard.",
      },
      {
        q: "Are there scholarships available?",
        a: "Yes, we offer merit-based scholarships, ministry worker discounts (20-30%), and need-based financial aid. Visit the Tuition page or contact our finance office for more information.",
      },
      {
        q: "Can I pay in installments?",
        a: "Yes, we offer installment payment plans. You can split your semester tuition into two or three payments. Contact the finance office to arrange a payment plan before the semester begins.",
      },
    ],
  },
  {
    category: "Online Learning",
    questions: [
      {
        q: "What technology do I need?",
        a: "You need a computer or tablet with a reliable internet connection and a modern web browser (Chrome, Firefox, Safari, or Edge). A smartphone can be used for some activities but a larger screen is recommended for the best experience.",
      },
      {
        q: "How are courses delivered?",
        a: "Courses are delivered through our online learning management system (LMS). Each course includes video lectures, reading materials, discussion forums, assignments, and assessments. Some courses may include live sessions.",
      },
      {
        q: "How do I take exams?",
        a: "Exams are conducted online through our LMS. They are typically timed and may include multiple choice questions, short answers, and essay questions. Some exams may be proctored using our online proctoring system.",
      },
      {
        q: "Will I receive a physical certificate?",
        a: "Yes, upon completion of your program, you will receive both a digital certificate and a physical certificate mailed to your address. Transcripts are also available upon request.",
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
