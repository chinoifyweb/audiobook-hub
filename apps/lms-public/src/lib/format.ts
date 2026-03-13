/**
 * Format kobo amount to Naira display string.
 * E.g., 5000000 => "50,000"
 */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG").format(naira);
}

/**
 * Human-readable degree type label.
 */
export function degreeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    certificate: "Certificate",
    diploma: "Diploma",
    bachelors: "Bachelor's Degree",
    masters: "Master's Degree",
    phd: "Doctorate (Ph.D.)",
  };
  return labels[type] || type;
}

/**
 * Convert semester count to human-readable duration.
 */
export function semesterDuration(semesters: number): string {
  if (semesters <= 2) return `${semesters} Semester${semesters > 1 ? "s" : ""}`;
  const years = Math.floor(semesters / 2);
  const remaining = semesters % 2;
  if (remaining === 0) return `${years} Year${years > 1 ? "s" : ""}`;
  return `${years} Year${years > 1 ? "s" : ""} ${remaining} Semester`;
}
