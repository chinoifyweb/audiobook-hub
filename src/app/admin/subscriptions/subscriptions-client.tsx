"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  planId: string;
  isActive: boolean;
}

export function SubscriptionsClient({ planId, isActive }: Props) {
  const router = useRouter();

  async function togglePlanStatus() {
    // We reuse the settings API pattern; in a real app you'd have a dedicated plans API.
    // For now we call a simple inline fetch.
    await fetch("/api/admin/subscriptions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, isActive: !isActive }),
    });
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant={isActive ? "destructive" : "default"}
      onClick={togglePlanStatus}
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
