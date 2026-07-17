"use client";

import { useEffect, useState, type SubmitEvent, type ReactNode } from "react";
import type { UserProfile } from "@/types";
import { emptyProfile, loadProfile, profileToMarkdown, saveProfile } from "@/lib/profile";
import { ROLE_SUGGESTIONS } from "@/lib/roleSuggestions";
import { SKILL_SUGGESTIONS } from "@/lib/skillSuggestions";
import { searchCities } from "@/lib/geocode";
import TagAutosuggestInput from "@/components/TagAutosuggestInput";
import DegreesInput from "@/components/DegreesInput";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = loadProfile();
    if (existing) setProfile(existing);
  }, []);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    saveProfile(profile);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          This is what the agent uses to tailor job matches — think of it as
          your skills.md.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Name">
          <input
            className="input"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </Field>

        <Field label="Target roles (up to 4)">
          <TagAutosuggestInput
            value={profile.targetRoles}
            onChange={(next) => setProfile({ ...profile, targetRoles: next })}
            suggestions={ROLE_SUGGESTIONS}
            showSuggestionsOnFocus
            maxSuggestions={ROLE_SUGGESTIONS.length}
            maxTags={4}
            placeholder="e.g. Frontend Engineer, Product Designer"
          />
          <span className="text-xs text-black/60 dark:text-white/60">
            Choose up to 4 roles, or type a job title that is not listed.
          </span>
        </Field>

        <Field label="Skills">
          <TagAutosuggestInput
            value={profile.skills}
            onChange={(next) => setProfile({ ...profile, skills: next })}
            suggestions={SKILL_SUGGESTIONS}
            showSuggestionsOnFocus
            maxSuggestions={100}
            placeholder="e.g. React, TypeScript, SQL"
          />
        </Field>

        <Field label="Years of experience">
          <input
            type="number"
            min={0}
            className="input"
            value={profile.yearsExperience}
            onChange={(e) =>
              setProfile({ ...profile, yearsExperience: Number(e.target.value) })
            }
          />
        </Field>

        <Field label="Education">
          <DegreesInput
            value={profile.degrees}
            onChange={(next) => setProfile({ ...profile, degrees: next })}
          />
        </Field>

        <Field label="Location preferences">
          <TagAutosuggestInput
            value={profile.locationPreferences}
            onChange={(next) =>
              setProfile({ ...profile, locationPreferences: next })
            }
            fetchSuggestions={searchCities}
            placeholder="e.g. Austin, TX or Remote"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profile.includeRemote}
            onChange={(e) =>
              setProfile({ ...profile, includeRemote: e.target.checked })
            }
          />
          Include remote opportunities
        </label>

        <Field label="Additional notes">
          <textarea
            className="input"
            rows={4}
            placeholder="Anything else the agent should know — industries to avoid, must-have benefits, etc."
            value={profile.notes}
            onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Save profile
          </button>
          {saved && (
            <span className="text-sm text-black/60 dark:text-white/60">
              Saved locally.
            </span>
          )}
        </div>
      </form>

      {saved && (
        <details className="rounded-md border border-black/10 p-4 text-sm dark:border-white/10">
          <summary className="cursor-pointer font-medium">
            Preview generated skills.md
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-black/70 dark:text-white/70">
            {profileToMarkdown(profile)}
          </pre>
        </details>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
