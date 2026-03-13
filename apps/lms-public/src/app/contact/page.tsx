import type { Metadata } from "next";
import { Button, Card, CardContent, Input, Label } from "@repo/ui";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Berean Bible Academy. We are here to answer your questions about admissions, programs, and more.",
};

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "info@bba.org.ng",
    href: "mailto:info@bba.org.ng",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+234 800 000 0000",
    href: "tel:+2348000000000",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Lagos, Nigeria",
    href: null,
  },
  {
    icon: Clock,
    label: "Office Hours",
    value: "Mon - Fri, 9:00 AM - 5:00 PM (WAT)",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Contact Us
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            Have questions? We are here to help. Reach out to us via the form
            below or through any of our contact channels.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-5">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <h2 className="mb-6 text-2xl font-bold">Send Us a Message</h2>
              <form className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What is your message about?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    rows={5}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Type your message here..."
                    required
                  />
                </div>
                <Button type="submit" size="lg">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="mb-6 text-2xl font-bold">Contact Information</h2>
              <div className="space-y-4">
                {contactInfo.map((item) => (
                  <Card key={item.label}>
                    <CardContent className="flex items-start gap-3 py-4">
                      <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </div>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-sm font-medium text-foreground hover:text-primary"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <div className="text-sm font-medium">
                            {item.value}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Departments */}
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold">
                  Department Contacts
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium">Admissions Office</div>
                    <a
                      href="mailto:admissions@bba.org.ng"
                      className="text-muted-foreground hover:text-primary"
                    >
                      admissions@bba.org.ng
                    </a>
                  </div>
                  <div>
                    <div className="font-medium">Academic Affairs</div>
                    <a
                      href="mailto:academics@bba.org.ng"
                      className="text-muted-foreground hover:text-primary"
                    >
                      academics@bba.org.ng
                    </a>
                  </div>
                  <div>
                    <div className="font-medium">Finance & Tuition</div>
                    <a
                      href="mailto:finance@bba.org.ng"
                      className="text-muted-foreground hover:text-primary"
                    >
                      finance@bba.org.ng
                    </a>
                  </div>
                  <div>
                    <div className="font-medium">Technical Support</div>
                    <a
                      href="mailto:support@bba.org.ng"
                      className="text-muted-foreground hover:text-primary"
                    >
                      support@bba.org.ng
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
