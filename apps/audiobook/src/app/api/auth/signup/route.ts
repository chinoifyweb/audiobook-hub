import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@repo/db";
import { sendEmail } from "@repo/email";
import { welcomeEmail, authorApplicationReceivedEmail, newAuthorApplicationEmail } from "@/../emails/templates";

export async function POST(req: Request) {
  try {
    const { fullName, email, password, role } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const validRoles = ["customer", "author"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: role || "customer",
      },
    });

    // If author, create an empty author profile (pending approval)
    if (role === "author") {
      await prisma.authorProfile.create({
        data: {
          userId: user.id,
          penName: fullName,
          isApproved: false,
        },
      });
    }

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome to AudioBook Hub!',
      html: welcomeEmail(fullName),
    }).catch((err) => console.error('Failed to send welcome email:', err));

    // If author, send application received email and notify admins
    if (role === "author") {
      await sendEmail({
        to: email,
        subject: 'Author Application Received',
        html: authorApplicationReceivedEmail(fullName),
      }).catch((err) => console.error('Failed to send author application email:', err));

      // Notify admin users about the new author application
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { email: true },
      });
      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: 'New Author Application',
          html: newAuthorApplicationEmail(fullName, email),
        }).catch((err) => console.error('Failed to send admin notification:', err));
      }
    }

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
