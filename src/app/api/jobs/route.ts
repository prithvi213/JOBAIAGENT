import { NextRequest, NextResponse } from "next/server";
import type { JobPosting, UserProfile } from "@/types";
import { buildJobQueries } from "@/lib/buildJobQueries";
import { fetchJSearchJobs } from "@/lib/jsearch";
import { scoreJob } from "@/lib/matchJobs";

interface JobsRequestBody {
  profile: UserProfile;
  // Not yet consumed directly (query-building/scoring runs off the
  // structured profile, which is what skillsMarkdown is generated from),
  // but threaded through so LLM-based matching can use it later without
  // another payload-shape change.
  skillsMarkdown: string;
}

export async function POST(request: NextRequest) {
  const { profile } = (await request.json()) as JobsRequestBody;
  const queries = buildJobQueries(profile);

  const results = await Promise.allSettled(
    queries.map((query) => fetchJSearchJobs(query)),
  );

  const seen = new Set<string>();
  const jobs: JobPosting[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const raw of result.value) {
      if (seen.has(raw.id)) continue;
      seen.add(raw.id);
      const { score, reasons } = scoreJob(profile, raw);
      jobs.push({
        id: raw.id,
        title: raw.title,
        company: raw.company,
        location: raw.location,
        remote: raw.remote,
        postedAt: raw.postedAt,
        url: raw.url,
        matchScore: score,
        matchReasons: reasons,
      });
    }
  }

  jobs.sort((a, b) => b.matchScore - a.matchScore);

  const failures = results.filter((r) => r.status === "rejected");
  if (jobs.length === 0 && failures.length > 0) {
    const first = failures[0] as PromiseRejectedResult;
    return NextResponse.json(
      { jobs: [], error: String(first.reason) },
      { status: 502 },
    );
  }

  return NextResponse.json({ jobs: jobs.slice(0, 25) });
}
