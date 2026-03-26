import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md mx-4 text-center">
        <CardHeader className="space-y-2">
          <div className="flex justify-center">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You do not have permission to access the Lecturer Portal.
            This portal is restricted to accounts with the lecturer role.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
