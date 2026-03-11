import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  const settingsRows = await prisma.platformSetting.findMany({
    orderBy: { key: "asc" },
  });

  const settings: Record<string, string> = {};
  for (const s of settingsRows) {
    settings[s.key] = s.value;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure global platform settings and defaults.
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
