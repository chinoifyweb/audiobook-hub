"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@repo/ui";
import { CheckCircle, Clock, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";

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
    value: "+234 902 767 7276",
    href: "tel:+2349027677276",
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    if (!data.firstName || !data.lastName || !data.email || !data.subject || !data.message) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to send message. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
          <div className="container text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Contact Us
            </h1>
          </div>
        </section>
        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-md text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-green-700">
                Message Sent!
              </h2>
              <p className="mb-6 text-muted-foreground">
                Thank you for reaching out. We will get back to you within 24-48
                hours.
              </p>
              <Button onClick={() => setSuccess(false)}>Send Another Message</Button>
            </div>
          </div>
        </section>
      </>
    );
  }

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

              {error && (
                <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="What is your message about?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Type your message here..."
                    required
                  />
                </div>
                <Button type="submit" size="lg" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {loading ? "Sending..." : "Send Message"}
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
