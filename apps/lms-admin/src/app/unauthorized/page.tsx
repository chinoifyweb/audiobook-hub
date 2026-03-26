import { Button } from "@repo/ui";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <ShieldX className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You do not have permission to access the admin dashboard.
          Only users with the Rector or Admin role can access this portal.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}
