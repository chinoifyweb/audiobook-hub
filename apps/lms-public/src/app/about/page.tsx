import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent } from "@repo/ui";
import {
  ArrowRight,
  BookOpen,
  Cross,
  Globe,
  Heart,
  Lightbulb,
  Target,
  Users,
  Zap,
  Shield,
  Building,
} from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Berean Bible Academy's mission, vision, core values, and statement of faith. Discover our commitment to Spirit-filled, academically rigorous theological education.",
};

const values = [
  {
    title: "Scriptural Authority",
    description:
      "The Bible as the inspired, inerrant, and sufficient Word of God.",
    icon: BookOpen,
  },
  {
    title: "Spirit-Empowered Formation",
    description:
      "Training that produces not just knowledge but the demonstration of the Spirit and power (1 Cor. 2:4).",
    icon: Zap,
  },
  {
    title: "Academic Excellence",
    description:
      "Rigorous scholarship that honours God.",
    icon: Target,
  },
  {
    title: "Character & Integrity",
    description:
      "Christlike character as the non-negotiable foundation.",
    icon: Shield,
  },
  {
    title: "Practical & Digital Ministry",
    description:
      "Equipping for both physical and online ministry.",
    icon: Lightbulb,
  },
  {
    title: "Kingdom Advancement",
    description:
      "Impact across church, marketplace, government, and society.",
    icon: Heart,
  },
  {
    title: "Global Accessibility",
    description:
      "Hybrid delivery reaching students across Africa and the world.",
    icon: Globe,
  },
  {
    title: "Marketplace Relevance",
    description:
      "Kingdom impact in every sphere of life.",
    icon: Users,
  },
];

const statementOfFaith = [
  "We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit.",
  "We believe in the divine inspiration, infallibility, and authority of the Old and New Testaments.",
  "We believe in the deity, virgin birth, sinless life, atoning death, bodily resurrection, ascension, and personal return of our Lord Jesus Christ in power and glory.",
  "We believe in the person and present-day ministry of the Holy Spirit, including the gifts of the Spirit, by whose indwelling and empowerment the Christian is enabled to live a victorious life and serve with supernatural effectiveness.",
  "We believe in the spiritual unity of all believers in our Lord Jesus Christ.",
  "We believe in the resurrection of both the saved and the lost.",
];

const governanceStructure = [
  {
    title: "Board of Governors",
    description: "Strategic oversight and fiduciary responsibility.",
  },
  {
    title: "President / Rector",
    description: "Chief Executive of the Academy.",
  },
  {
    title: "Academic Dean",
    description: "Curriculum, faculty, standards, and accreditation.",
  },
  {
    title: "Dean of Students",
    description: "Welfare, admissions, and spiritual formation.",
  },
  {
    title: "Registrar",
    description: "Records, transcripts, and academic calendar.",
  },
  {
    title: "Spiritual Life Director",
    description: "Chapel, prayer, impartation, and retreats.",
  },
  {
    title: "Academic Standards Committee",
    description: "Quality assurance, transfer credits, and appeals.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            About Berean Bible Academy
          </h1>
          <p className="mx-auto max-w-2xl text-lg italic text-blue-100">
            &ldquo;It takes training to triumph&rdquo;
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Cross className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mb-3 text-xl font-bold">Our Vision</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  To raise a generation of Spirit-filled, academically grounded,
                  and ministry-ready Kingdom Ambassadors who will transform
                  churches, the marketplace, communities, and nations through
                  the power of the Gospel, the demonstration of the Holy Spirit,
                  and the authority of Scripture.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mb-3 text-xl font-bold">Our Mission</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Berean Bible Academy exists to provide accessible, affordable,
                  and rigorous theological education through a hybrid model that
                  integrates sound biblical scholarship, deep spiritual
                  formation, practical ministry skills, and contemporary digital
                  fluency. We equip pastors, missionaries, counsellors,
                  educators, entrepreneurs, and marketplace leaders to advance
                  the Kingdom of God with excellence, power, and integrity — in
                  the church, the workplace, and across every sphere of
                  influence.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold">Our Core Values</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              These values guide everything we do at Berean Bible Academy.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <value.icon className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statement of Faith */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">Statement of Faith</h2>
            <div className="space-y-3">
              {statementOfFaith.map((belief, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Cross className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {belief}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Governance Structure */}
      <section className="bg-slate-50 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center gap-3">
              <Building className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Governance Structure</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {governanceStructure.map((role) => (
                <Card key={role.title}>
                  <CardContent className="py-4">
                    <h3 className="mb-1 font-semibold">{role.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container text-center">
          <h2 className="mb-4 text-2xl font-bold">
            Join the BBA Community
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
            Become part of a growing community of believers committed to
            Spirit-filled, academically rigorous theological education. Start
            your application today.
          </p>
          <Button size="lg" asChild>
            <Link href={`${PORTAL_URL}/application`}>
              Apply Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
