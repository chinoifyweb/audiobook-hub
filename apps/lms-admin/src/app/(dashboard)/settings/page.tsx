import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { SettingsClient } from "./settings-client";
import { School, Phone, Mail, Calendar, CreditCard, FileText, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

// Human-readable labels and grouping for settings
const SETTING_LABELS: Record<string, { label: string; group: string }> = {
  institution_name: { label: "Institution Name", group: "Institution" },
  institution_motto: { label: "Institution Motto", group: "Institution" },
  admin_email: { label: "Admin Email", group: "Contact" },
  support_phone: { label: "Support Phone", group: "Contact" },
  support_whatsapp: { label: "WhatsApp Number", group: "Contact" },
  default_semester_fee_ba: { label: "BA Semester Fee", group: "Tuition Fees" },
  default_semester_fee_pgd: { label: "PGD Semester Fee", group: "Tuition Fees" },
  default_semester_fee_ma: { label: "MA Semester Fee", group: "Tuition Fees" },
  default_semester_fee_mdiv: { label: "M.Div Semester Fee", group: "Tuition Fees" },
  max_upload_size_mb: { label: "Max Upload Size (MB)", group: "System" },
  supported_document_formats: { label: "Supported Document Formats", group: "System" },
  academic_session: { label: "Current Academic Session", group: "Academic" },
  payment_methods: { label: "Payment Methods", group: "Payments" },
};

function formatSettingValue(key: string, value: string): string {
  // Format Naira amounts
  if (key.startsWith("default_semester_fee_")) {
    const amount = parseInt(value, 10);
    return isNaN(amount) ? value : `\u20A6${amount.toLocaleString()}`;
  }
  // Format JSON arrays
  if (value.startsWith("[")) {
    try {
      const arr = JSON.parse(value);
      return arr.join(", ");
    } catch {
      return value;
    }
  }
  return value;
}

export default async function SettingsPage() {
  const settings = await prisma.platformSetting.findMany({
    orderBy: { key: "asc" },
  });

  // Get faculty and department counts for context
  const [facultyCount, departmentCount, programCount] = await Promise.all([
    prisma.faculty.count(),
    prisma.department.count(),
    prisma.program.count({ where: { isActive: true } }),
  ]);

  // Group settings
  const groups: Record<string, typeof settings> = {};
  for (const setting of settings) {
    const meta = SETTING_LABELS[setting.key];
    const group = meta?.group || "Other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(setting);
  }

  // Desired group order
  const groupOrder = ["Institution", "Contact", "Academic", "Tuition Fees", "Payments", "System", "Other"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Academy configuration and platform settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <School className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Faculties</span>
            </div>
            <p className="text-2xl font-bold">{facultyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Departments</span>
            </div>
            <p className="text-2xl font-bold">{departmentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Active Programs</span>
            </div>
            <p className="text-2xl font-bold">{programCount}</p>
          </CardContent>
        </Card>
      </div>

      {settings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No platform settings configured.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groupOrder
            .filter((g) => groups[g] && groups[g].length > 0)
            .map((groupName) => (
              <Card key={groupName}>
                <CardHeader>
                  <CardTitle className="text-lg">{groupName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groups[groupName]!.map((setting) => {
                    const meta = SETTING_LABELS[setting.key];
                    return (
                      <div key={setting.id} className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {meta?.label || setting.key}
                          </p>
                          {setting.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded whitespace-nowrap">
                          {formatSettingValue(setting.key, setting.value)}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <SettingsClient />
    </div>
  );
}
