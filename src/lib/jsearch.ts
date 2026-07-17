const JSEARCH_HOST = "jsearch.p.rapidapi.com";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface RawJob {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  postedAt: string;
  url: string;
  description: string;
}

// Verified against a live response from jsearch.p.rapidapi.com/search-v2.
interface JSearchJob {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  job_location?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  work_arrangement?: string;
  job_apply_link?: string;
  job_posted_at_datetime_utc?: string;
  job_posted_at_timestamp?: number;
  job_description?: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IN: "India",
};

function formatCountry(code?: string): string | undefined {
  if (!code) return undefined;
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

function normalizeJob(job: JSearchJob): RawJob | null {
  if (!job.job_id || !job.job_title || !job.job_apply_link) return null;

  const isRemote =
    job.job_is_remote === true || job.work_arrangement?.toLowerCase() === "remote";

  // Built from the structured city/state/country fields rather than the
  // pre-formatted job_location string, which is inconsistent (sometimes
  // drops the country, sometimes appends "(+1 other)").
  const location =
    [job.job_city, job.job_state, formatCountry(job.job_country)]
      .filter(Boolean)
      .join(", ") || (isRemote ? "Remote" : "Location not specified");

  const postedAt =
    job.job_posted_at_datetime_utc ??
    (job.job_posted_at_timestamp
      ? new Date(job.job_posted_at_timestamp * 1000).toISOString()
      : new Date().toISOString());

  return {
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name ?? "Unknown company",
    location,
    remote: isRemote,
    postedAt,
    url: job.job_apply_link,
    description: job.job_description ?? "",
  };
}

function isWithinPastWeek(postedAt: string): boolean {
  const posted = new Date(postedAt).getTime();
  if (Number.isNaN(posted)) return true; // don't drop jobs with unparseable dates
  return Date.now() - posted <= ONE_WEEK_MS;
}

export async function fetchJSearchJobs(query: string): Promise<RawJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("JSEARCH_API_KEY is not set");
  }

  const url = new URL(`https://${JSEARCH_HOST}/search-v2`);
  url.searchParams.set("query", query);
  url.searchParams.set("date_posted", "week");
  url.searchParams.set("num_pages", "1");

  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": JSEARCH_HOST,
    },
  });

  if (!response.ok) {
    throw new Error(`JSearch request failed: ${response.status}`);
  }

  const data = (await response.json()) as { data?: { jobs?: JSearchJob[] } };
  return (data.data?.jobs ?? [])
    .map(normalizeJob)
    .filter((job): job is RawJob => job !== null)
    // Belt-and-suspenders: the API's own date_posted filter may not exactly
    // match "past 7 days," so re-filter on our side too.
    .filter((job) => isWithinPastWeek(job.postedAt));
}
