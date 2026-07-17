import type { UserProfile } from "@/types";

const MAX_QUERIES = 4;

/**
 * Builds a small set of JSearch query strings from a profile. JSearch takes
 * one free-text query per call, so we combine role x location pairs (capped
 * to avoid burning through the free-tier request quota) rather than one
 * mega-query that tends to return worse results.
 */
export function buildJobQueries(profile: UserProfile): string[] {
  const roles = profile.targetRoles.length ? profile.targetRoles : ["jobs"];
  const locations = profile.locationPreferences.length
    ? profile.locationPreferences.filter((l) => l.toLowerCase() !== "remote")
    : [];

  const queries: string[] = [];

  if (locations.length === 0) {
    for (const role of roles) {
      queries.push(profile.includeRemote ? `remote ${role}` : role);
      if (queries.length >= MAX_QUERIES) return queries;
    }
    return queries;
  }

  for (const role of roles) {
    for (const location of locations) {
      queries.push(`${role} in ${location}`);
      if (queries.length >= MAX_QUERIES) return queries;
    }
  }
  return queries;
}
