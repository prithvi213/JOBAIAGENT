import type { UserProfile } from "@/types";
import type { RawJob } from "@/lib/jsearch";

export function scoreJob(
  profile: UserProfile,
  job: Pick<RawJob, "title" | "description">,
): { score: number; reasons: string[] } {
  const text = `${job.title} ${job.description}`.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  if (profile.skills.length > 0) {
    const matchedSkills = profile.skills.filter((s) =>
      text.includes(s.toLowerCase()),
    );
    score += (matchedSkills.length / profile.skills.length) * 60;
    if (matchedSkills.length > 0) {
      reasons.push(`Matches skills: ${matchedSkills.join(", ")}`);
    }
  } else {
    // No skills specified means open to anything — don't penalize for it.
    score += 30;
  }

  if (profile.targetRoles.length > 0) {
    const roleMatch = profile.targetRoles.some((r) =>
      job.title.toLowerCase().includes(r.toLowerCase()),
    );
    if (roleMatch) {
      score += 40;
      reasons.push("Title matches a target role");
    }
  } else {
    // Open to any role — don't penalize for it.
    score += 20;
  }

  if (reasons.length === 0) {
    reasons.push("General match based on your profile");
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}
