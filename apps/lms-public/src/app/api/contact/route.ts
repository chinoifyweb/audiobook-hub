import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, subject, message, phone } = body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Log the contact submission (in production, send email via Resend/SendGrid)
    console.log("Contact form submission:", {
      name: `${firstName} ${lastName}`,
      email,
      phone: phone || "N/A",
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Try to store in database if available
    try {
      const { prisma } = await import("@repo/db");
      await (prisma as any).$executeRaw`
        INSERT INTO platform_settings (id, key, value, description, "updatedAt")
        VALUES (gen_random_uuid(), ${"contact_" + Date.now()}, ${JSON.stringify({ firstName, lastName, email, phone, subject, message, timestamp: new Date().toISOString() })}, 'Contact form submission', NOW())
        ON CONFLICT DO NOTHING
      `;
    } catch {
      // DB not available — that's OK, form submission still succeeds
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
