import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import {
  BookOpen,
  GraduationCap,
  Clock,
  Users,
  Globe,
  Award,
  CalendarDays,
  Library,
  CheckCircle,
  ArrowRight,
  Star,
  ShieldCheck,
  Laptop,
  DollarSign,
} from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

const stats = [
  { label: "Students Enrolled", value: "2,500+", icon: Users },
  { label: "Programs Offered", value: "12+", icon: GraduationCap },
  { label: "Years of Excellence", value: "15+", icon: Award },
  { label: "Countries Represented", value: "30+", icon: Globe },
];

const featuredPrograms = [
  {
    name: "Certificate in Christian Ministry",
    degreeType: "Certificate",
    duration: "2 Semesters",
    description:
      "A foundational program designed to equip believers with essential ministry skills and biblical knowledge for effective service in the local church.",
    href: "/programs",
  },
  {
    name: "Diploma in Theology",
    degreeType: "Diploma",
    duration: "4 Semesters",
    description:
      "A comprehensive study of systematic theology, church history, and pastoral ministry, preparing students for deeper service and leadership roles.",
    href: "/programs",
  },
  {
    name: "Bachelor of Biblical Studies",
    degreeType: "Bachelor's",
    duration: "8 Semesters",
    description:
      "An in-depth academic program covering Old and New Testament, hermeneutics, biblical languages, and practical ministry for aspiring scholars and leaders.",
    href: "/programs",
  },
  {
    name: "Master of Divinity",
    degreeType: "Master's",
    duration: "6 Semesters",
    description:
      "An advanced professional degree for those called to pastoral ministry, missions, or academic pursuits in biblical and theological studies.",
    href: "/programs",
  },
];

const steps = [
  {
    step: 1,
    title: "Apply Online",
    description:
      "Complete our simple online application form with your personal information and program choice.",
    icon: CalendarDays,
  },
  {
    step: 2,
    title: "Get Admitted",
    description:
      "Receive your admission letter, pay tuition fees, and get access to the student portal.",
    icon: CheckCircle,
  },
  {
    step: 3,
    title: "Start Learning",
    description:
      "Access course materials, watch video lectures, complete assignments, and earn your degree.",
    icon: BookOpen,
  },
];

const benefits = [
  {
    title: "Accredited Programs",
    description:
      "Our programs meet rigorous academic standards, ensuring your qualification is recognized and respected.",
    icon: ShieldCheck,
  },
  {
    title: "Flexible Schedule",
    description:
      "Study at your own pace with 24/7 access to course materials. Perfect for working professionals.",
    icon: Clock,
  },
  {
    title: "Expert Faculty",
    description:
      "Learn from experienced pastors, theologians, and scholars dedicated to your academic growth.",
    icon: Users,
  },
  {
    title: "Affordable Tuition",
    description:
      "Quality biblical education at competitive rates with flexible payment options available.",
    icon: DollarSign,
  },
  {
    title: "Digital Library",
    description:
      "Access a rich collection of e-books, journals, commentaries, and multimedia study resources.",
    icon: Library,
  },
  {
    title: "Online Learning",
    description:
      "Modern learning management system with video lectures, interactive quizzes, and progress tracking.",
    icon: Laptop,
  },
];

const testimonials = [
  {
    quote:
      "Berean Bible Academy transformed my understanding of Scripture. The flexible online format allowed me to study while pastoring my church.",
    name: "Pastor Emmanuel Obi",
    program: "Diploma in Theology, Class of 2024",
  },
  {
    quote:
      "The faculty are exceptional and truly care about each student. I gained not just knowledge but a deeper relationship with God through my studies.",
    name: "Sister Grace Adeyemi",
    program: "Certificate in Christian Ministry, Class of 2025",
  },
  {
    quote:
      "As a missionary in a remote area, BBA made it possible for me to earn my degree without leaving the field. The online platform is excellent.",
    name: "Rev. James Okoro",
    program: "Bachelor of Biblical Studies, Class of 2023",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-20 text-primary-foreground md:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkg4di0yaDI4em0tMTItNnYySDZ2LTJoMTh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm">
              <GraduationCap className="h-4 w-4" />
              <span>Applications Open for 2025/2026 Session</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Where Biblical Education Transforms Lives
            </h1>
            <p className="mb-8 text-lg text-blue-100 md:text-xl">
              Berean Bible Academy provides accessible, high-quality online
              Christian education to equip believers for ministry, leadership,
              and lifelong service to God and His people.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-blue-50"
                asChild
              >
                <Link href={`${PORTAL_URL}/application`}>
                  Apply Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <Link href="/programs">Explore Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="border-b bg-slate-50 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Our Programs
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Choose from a range of accredited programs designed to deepen your
              understanding of Scripture and prepare you for effective ministry.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredPrograms.map((program) => (
              <Card
                key={program.name}
                className="flex flex-col transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-2 inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {program.degreeType}
                  </div>
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{program.duration}</span>
                  </div>
                  <p className="mb-4 flex-1 text-sm text-muted-foreground">
                    {program.description}
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={program.href}>
                      Learn More
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild>
              <Link href="/programs">
                View All Programs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Getting started with Berean Bible Academy is simple. Follow these
              three steps to begin your journey.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose BBA */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Why Choose Berean Bible Academy
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We are committed to providing an excellent learning experience that
              is accessible, affordable, and academically rigorous.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <benefit.icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              What Our Students Say
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Hear from students and alumni who have experienced the
              transformative impact of biblical education at BBA.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <blockquote className="mb-4 text-sm italic text-muted-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.program}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Begin Your Journey?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-blue-100">
            Take the first step toward deepening your biblical knowledge and
            equipping yourself for impactful ministry. Applications are now open.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-blue-50"
              asChild
            >
              <Link href={`${PORTAL_URL}/application`}>
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
