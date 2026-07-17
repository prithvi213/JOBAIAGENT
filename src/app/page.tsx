import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Job AI Agent</h1>
      <p className="max-w-prose text-black/70 dark:text-white/70">
        Set up your profile once — skills, experience, and role preferences —
        and get a tailored feed of job postings from the past week.
      </p>
      <div className="flex gap-4">
        <Link
          href="/profile"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Set up your profile
        </Link>
        <Link
          href="/jobs"
          className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          View job matches
        </Link>
      </div>
    </div>
  );
}
