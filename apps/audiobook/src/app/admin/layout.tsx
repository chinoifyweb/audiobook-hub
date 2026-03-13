import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminLayoutClient } from "./layout-client";

export const metadata = {
  title: "Admin Panel | AudioBook",
  description: "AudioBook marketplace administration",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <AdminLayoutClient
      userName={session.user.name ?? "Admin"}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image ?? null}
    >
      {children}
    </AdminLayoutClient>
  );
}
