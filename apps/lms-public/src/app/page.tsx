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
  Zap,
  Monitor,
  MapPin,
  Briefcase,
} from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

const stats = [
  { label: "Academic Programmes", value: "12", icon: GraduationCap },
  { label: "B.A. Specialisations", value: "4", icon: BookOpen },
  { label: "M.A. Specialisations", value: "6", icon: Award },
  { label: "Hybrid Delivery", value: "70/20/10", icon: Globe },
];

const featuredPrograms = [
  {
    name: "B.A. Pastoral Ministry",
    degreeType: "Bachelor's",
    duration: "4 Years (8 Semesters)",
    credits: "120 Credits",
    description:
      "Blending homiletics and pastoral care with pneumatological depth, social media ministry, content creation, and AI-era church leadership.",
    href: "/programs/BA-PM",
  },
  {
    name: "PGD in Theology",
    degreeType: "Postgraduate Diploma",
    duration: "1 Year (2 Semesters)",
    credits: "36 Credits",
    description:
      "A one-year bridge programme for graduates of any discipline seeking to enter theological studies. Credits transferable to M.A. programmes.",
    href: "/programs/PGD-THEO",
  },
  {
    name: "M.A. Systematic Theology",
    degreeType: "Master's",
    duration: "2 Years (4 Semesters)",
    credits: "48 Credits",
    description:
      "Advanced Christian doctrine through historical, biblical, pneumatological, and philosophical perspectives. Prepares for doctoral studies and seminary teaching.",
    href: "/programs/MA-ST",
  },
  {
    name: "Master of Divinity (M.Div.)",
    degreeType: "Master's",
    duration: "3 Years (6 Semesters)",
    credits: "78 Credits",
    description:
      "The gold-standard professional degree covering biblical languages, systematic theology, pneumatology, homiletics, pastoral care, and digital ministry.",
    href: "/programs/MDIV",
  },
];

const deliveryModel = [
  {
    percentage: "70%",
    title: "Online Learning",
    description:
      "Asynchronous video lectures, discussion forums, digital textbooks, and virtual mentoring available 24/7.",
    icon: Monitor,
  },
  {
    percentage: "20%",
    title: "On-Campus Intensives",
    description:
      "1-2 week residential sessions each semester featuring preaching labs, prayer retreats, and ministry simulations.",
    icon: MapPin,
  },
  {
    percentage: "10%",
    title: "Supervised Practicum",
    description:
      "Field placements in local churches, ministries, and approved sites with faculty mentoring.",
    icon: Briefcase,
  },
];

const benefits = [
  {
    title: "Spirit-Empowered Formation",
    description:
      "Training that produces not just knowledge but the demonstration of the Spirit and power.",
    icon: Zap,
  },
  {
    title: "Hybrid Delivery",
    description:
      "70% online, 20% on-campus intensives, and 10% supervised practicum for a comprehensive experience.",
    icon: Globe,
  },
  {
    title: "Expert Faculty",
    description:
      "Learn from experienced pastors, theologians, and scholars with doctoral qualifications and active ministry.",
    icon: Users,
  },
  {
    title: "Academic Excellence",
    description:
      "Rigorous scholarship aligned with globally recognised seminary standards (ATS framework).",
    icon: ShieldCheck,
  },
  {
    title: "Digital Theological Library",
    description:
      "Access a rich collection of digital textbooks, journals, commentaries, and multimedia study resources.",
    icon: Library,
  },
  {
    title: "Modern LMS Platform",
    description:
      "Online learning management system with video lectures, interactive quizzes, and progress tracking.",
    icon: Laptop,
  },
];

const testimonials = [
  {
    quote:
      "Berean Bible Academy transformed my understanding of Scripture. The flexible hybrid format allowed me to study while pastoring my church.",
    name: "Pastor Emmanuel Obi",
    program: "B.A. Pastoral Ministry",
  },
  {
    quote:
      "The faculty are exceptional and truly care about each student. I gained not just knowledge but a deeper relationship with God through my studies.",
    name: "Sister Grace Adeyemi",
    program: "M.A. Pastoral Counselling",
  },
  {
    quote:
      "As a missionary in a remote area, BBA made it possible for me to pursue my degree without leaving the field. The online platform is excellent.",
    name: "Rev. James Okoro",
    program: "B.A. Missions & Intercultural Studies",
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
              <span>Applications Open for 2026/2027 Session</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              It Takes Training to Triumph
            </h1>
            <p className="mb-8 text-lg text-blue-100 md:text-xl">
              Berean Bible Academy provides accessible, affordable, and rigorous
              theological education through a hybrid model that equips
              Spirit-filled Kingdom Ambassadors for the church, the marketplace,
              and every sphere of influence.
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
                <Link href="/programs">Explore Programmes</Link>
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
              Our Programmes
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              12 programmes across undergraduate and postgraduate levels,
              blending sound biblical scholarship with practical ministry skills
              and digital fluency.
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
                  <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{program.duration}</span>
                  </div>
                  <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{program.credits}</span>
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
                View All 12 Programmes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Hybrid Delivery Model */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Hybrid Delivery Model
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Our unique blend of online learning, on-campus intensives, and
              supervised practicum ensures a comprehensive educational
              experience.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {deliveryModel.map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {item.percentage}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
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
              transformative impact of theological education at BBA.
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
            equipping yourself for impactful ministry. Applications are now open
            for the 2026/2027 session.
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
