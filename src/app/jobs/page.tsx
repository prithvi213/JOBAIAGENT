"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { JobPosting } from "@/types";
import { loadProfile, profileToMarkdown } from "@/lib/profile";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillsMarkdown, setSkillsMarkdown] = useState("");

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      setError("no-profile");
      setLoading(false);
      return;
    }

    // The skills.md generated from your last saved profile — this is what
    // job matching is actually run against.
    const markdown = profileToMarkdown(profile);
    setSkillsMarkdown(markdown);

    let cancelled = false;

    fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, skillsMarkdown: markdown }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        if (!cancelled) setJobs(data.jobs ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("fetch-failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-black/60 dark:text-white/60">Finding matches…</p>;
  }

  if (error === "no-profile") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-black/60 dark:text-white/60">
          Set up your profile first so matches can be tailored to you.
        </p>
        <Link
          href="/profile"
          className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Set up your profile
        </Link>
      </div>
    );
  }

  if (error === "fetch-failed") {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Couldn&apos;t load job matches. Check that JSEARCH_API_KEY is set and try again.
      </p>
    );
  }

  const skillsMdPreview = (
    <details className="rounded-md border border-black/10 p-4 text-sm dark:border-white/10">
      <summary className="cursor-pointer font-medium">
        Matched against this skills.md
      </summary>
      <pre className="mt-3 whitespace-pre-wrap text-black/70 dark:text-white/70">
        {skillsMarkdown}
      </pre>
    </details>
  );

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Job Matches</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          No new postings found in the past week for your current preferences.
        </p>
        {skillsMdPreview}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Job Matches</h1>
      {skillsMdPreview}
      <ul className="flex flex-col gap-3">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="flex flex-col gap-2 rounded-md border border-black/10 p-4 dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {job.title}
                </a>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {job.company} — {job.location}
                  {job.remote && job.location !== "Remote" && " · Remote"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-black/10 px-2.5 py-1 text-xs font-medium dark:bg-white/15">
                {job.matchScore}% match
              </span>
            </div>
            <ul className="flex flex-wrap gap-2 text-xs text-black/60 dark:text-white/60">
              {job.matchReasons.map((reason) => (
                <li key={reason} className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">
                  {reason}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
