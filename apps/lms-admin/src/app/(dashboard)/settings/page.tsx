import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.platformSetting.findMany({
    orderBy: { key: "asc" },
  });

  // Get faculty and department counts for context
  const [facultyCount, departmentCount] = await Promise.all([
    prisma.faculty.count(),
    prisma.department.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Platform configuration and settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Faculties</span>
              <span className="text-sm font-medium">{facultyCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Departments</span>
              <span className="text-sm font-medium">{departmentCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {settings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No platform settings configured.</p>
            ) : (
              <div className="space-y-3">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{setting.key}</p>
                      {setting.description && (
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                      {setting.value.length > 50 ? setting.value.slice(0, 50) + "..." : setting.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SettingsClient />
    </div>
  );
}
