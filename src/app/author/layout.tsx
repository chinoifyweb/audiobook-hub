import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthorSidebar } from "@/components/author/sidebar";
import { AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Author Dashboard — AudioShelf",
  description: "Manage your books, track sales, and view earnings",
};

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "author") {
    redirect("/dashboard");
  }

  const authorProfile = await prisma.authorProfile.findUnique({
    where: { userId: session.user.id },
    select: { isApproved: true, penName: true },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AuthorSidebar
        user={{
          name: authorProfile?.penName || session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Pending approval banner */}
        {authorProfile && !authorProfile.isApproved && (
          <div className="flex items-center gap-3 border-b bg-amber-50 px-6 py-3 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              Your author account is pending approval. You can prepare your books,
              but they won&apos;t be published until your account is approved by an
              admin.
            </p>
          </div>
        )}

        {/* Desktop top bar */}
        <header className="hidden h-16 items-center justify-between border-b bg-card px-6 lg:flex">
          <div>
            <h2 className="text-lg font-semibold">
              Welcome back
              {authorProfile?.penName
                ? `, ${authorProfile.penName}`
                : session.user.name
                  ? `, ${session.user.name}`
                  : ""}
            </h2>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
