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
} from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Berean Bible Academy's mission, vision, and values. Discover our commitment to quality biblical education.",
};

const values = [
  {
    title: "Biblical Authority",
    description:
      "We hold the Bible as the inspired, inerrant Word of God and the ultimate authority for all faith and practice.",
    icon: BookOpen,
  },
  {
    title: "Academic Excellence",
    description:
      "We pursue rigorous academic standards in all our programs while maintaining a Christ-centered approach to learning.",
    icon: Target,
  },
  {
    title: "Spiritual Formation",
    description:
      "Education at BBA goes beyond the classroom. We are committed to the holistic spiritual development of every student.",
    icon: Heart,
  },
  {
    title: "Servant Leadership",
    description:
      "We equip students not just with knowledge, but with the character and skills to serve their communities and churches.",
    icon: Users,
  },
  {
    title: "Global Reach",
    description:
      "Through online learning, we make quality biblical education accessible to students across Africa and beyond.",
    icon: Globe,
  },
  {
    title: "Innovation",
    description:
      "We embrace modern educational technology to deliver an engaging and effective learning experience.",
    icon: Lightbulb,
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
          <p className="mx-auto max-w-2xl text-blue-100">
            Equipping believers with sound biblical education for effective
            ministry and godly living since 2010.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Berean Bible Academy was founded in 2010 with a simple but
                powerful vision: to make quality biblical education accessible
                to every believer, regardless of location or circumstances. Named
                after the Berean Christians in Acts 17:11 who &ldquo;examined
                the Scriptures daily,&rdquo; we are committed to fostering a
                culture of diligent Bible study and theological reflection.
              </p>
              <p>
                What began as a small local Bible training program in Lagos,
                Nigeria, has grown into a fully online academy serving students
                from over 30 countries. Our growth has been driven by a deep
                conviction that the church in Africa and the developing world
                needs well-trained, theologically grounded leaders who can
                effectively minister in their contexts.
              </p>
              <p>
                Today, BBA offers a comprehensive range of programs from
                certificate to master&apos;s level, all delivered through our
                modern learning management system. Our students include pastors,
                church workers, missionaries, Sunday school teachers, and
                believers who simply desire to grow deeper in their understanding
                of God&apos;s Word.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-slate-50 py-16">
        <div className="container">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mb-3 text-xl font-bold">Our Mission</h2>
                <p className="text-muted-foreground">
                  To provide accessible, affordable, and academically excellent
                  biblical education that equips believers for faithful ministry,
                  godly leadership, and lifelong service to God and His people.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Cross className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mb-3 text-xl font-bold">Our Vision</h2>
                <p className="text-muted-foreground">
                  To be a leading institution of biblical education in Africa,
                  raising a generation of theologically sound, Spirit-filled
                  leaders who will transform their communities and advance the
                  Kingdom of God worldwide.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold">Our Core Values</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              These values guide everything we do at Berean Bible Academy.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <section className="bg-slate-50 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">Statement of Faith</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                We believe the Bible is the inspired, infallible, and
                authoritative Word of God.
              </p>
              <p>
                We believe in one God, eternally existing in three Persons:
                Father, Son, and Holy Spirit.
              </p>
              <p>
                We believe in the deity of our Lord Jesus Christ, His virgin
                birth, His sinless life, His atoning death, His bodily
                resurrection, His ascension, and His personal return in power
                and glory.
              </p>
              <p>
                We believe that salvation is by grace alone, through faith
                alone, in Christ alone, and that regeneration by the Holy Spirit
                is essential for the salvation of lost and sinful humanity.
              </p>
              <p>
                We believe in the present ministry of the Holy Spirit, who
                indwells and empowers believers for godly living and service.
              </p>
              <p>
                We believe in the spiritual unity of all believers in our Lord
                Jesus Christ, forming one body, the Church.
              </p>
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
            studying God&apos;s Word. Start your application today.
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
