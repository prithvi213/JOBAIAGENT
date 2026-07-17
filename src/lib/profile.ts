import type { Degree, UserProfile } from "@/types";

const STORAGE_KEY = "job-ai-agent:profile";

export const emptyDegree: Degree = {
  degreeType: "",
  fieldOfStudy: "",
  institution: "",
  startDate: "",
  endDate: "",
};

export const emptyProfile: UserProfile = {
  name: "",
  targetRoles: [],
  skills: [],
  yearsExperience: 0,
  degrees: [],
  locationPreferences: [],
  includeRemote: false,
  notes: "",
};

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    const degrees = (parsed.degrees ?? []).map((d) => ({ ...emptyDegree, ...d }));
    return { ...emptyProfile, ...parsed, degrees };
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function formatMonthYear(value: string): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function degreeToLine(degree: UserProfile["degrees"][number]): string {
  const parts = [degree.degreeType, degree.fieldOfStudy]
    .filter(Boolean)
    .join(" in ");
  const start = formatMonthYear(degree.startDate);
  const end = formatMonthYear(degree.endDate);
  const duration = start || end ? `${start || "?"} – ${end || "Present"}` : "";
  const institutionAndDuration = [degree.institution, duration]
    .filter(Boolean)
    .join(", ");
  return `- ${[parts, institutionAndDuration].filter(Boolean).join(" — ")}`;
}

// This markdown is what gets handed to the AI agent as matching context —
// the "skills.md" for this user.
export function profileToMarkdown(profile: UserProfile): string {
  const lines = [
    `# ${profile.name || "Untitled Profile"}`,
    "",
    "## Target Roles",
    ...(profile.targetRoles.length
      ? profile.targetRoles.map((r) => `- ${r}`)
      : ["- Open to any role"]),
    "",
    "## Skills",
    ...(profile.skills.length
      ? profile.skills.map((s) => `- ${s}`)
      : ["- No specific skills listed — do not filter out roles by skill requirements"]),
    "",
    "## Experience",
    `- ${profile.yearsExperience} years`,
    "",
    "## Education",
    ...(profile.degrees.length
      ? profile.degrees.map(degreeToLine)
      : ["- (none specified)"]),
    "",
    "## Location Preferences",
    ...(profile.locationPreferences.length
      ? profile.locationPreferences.map((l) => `- ${l}`)
      : ["- Open to working anywhere"]),
    `- Include remote opportunities: ${profile.includeRemote ? "yes" : "no"}`,
    "",
    "## Notes",
    profile.notes || "(none)",
  ];
  return lines.join("\n");
}