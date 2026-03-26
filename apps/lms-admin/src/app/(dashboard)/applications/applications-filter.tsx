"use client";

import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { cn } from "@repo/ui";

const statuses = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

interface Props {
  currentStatus: string;
}

export function ApplicationsFilter({ currentStatus }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <Button
          key={s.value}
          variant={currentStatus === s.value ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const params = new URLSearchParams();
            if (s.value !== "all") params.set("status", s.value);
            router.push(`/applications?${params.toString()}`);
          }}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
