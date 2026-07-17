"use client";

import type { Degree } from "@/types";
import SingleAutosuggestInput from "@/components/SingleAutosuggestInput";
import { searchInstitutions } from "@/lib/educationSearch";
import { FIELD_OF_STUDY_SUGGESTIONS } from "@/lib/fieldOfStudySuggestions";
import { emptyDegree } from "@/lib/profile";

const DEGREE_TYPES = [
  "High School Diploma",
  "Associate's",
  "Bachelor's",
  "Master's",
  "MBA",
  "PhD",
  "Other",
];

interface DegreesInputProps {
  value: Degree[];
  onChange: (next: Degree[]) => void;
}

export default function DegreesInput({ value, onChange }: DegreesInputProps) {
  function updateDegree(index: number, patch: Partial<Degree>) {
    onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function removeDegree(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addDegree() {
    onChange([...value, { ...emptyDegree }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((degree, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-md border border-black/10 p-3 dark:border-white/10"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              className="input sm:w-40"
              value={degree.degreeType}
              onChange={(e) =>
                updateDegree(index, { degreeType: e.target.value })
              }
            >
              <option value="" disabled>
                Degree type
              </option>
              {DEGREE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="flex-1">
              <SingleAutosuggestInput
                value={degree.fieldOfStudy}
                onChange={(next) => updateDegree(index, { fieldOfStudy: next })}
                suggestions={FIELD_OF_STUDY_SUGGESTIONS}
                placeholder="Field of study (e.g. Computer Science)"
              />
            </div>
          </div>

          <SingleAutosuggestInput
            value={degree.institution}
            onChange={(next) => updateDegree(index, { institution: next })}
            fetchSuggestions={searchInstitutions}
            placeholder="Institution"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-xs text-black/60 dark:text-white/60">
              Start
              <input
                type="month"
                className="input"
                value={degree.startDate}
                onChange={(e) =>
                  updateDegree(index, { startDate: e.target.value })
                }
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-black/60 dark:text-white/60">
              End
              <input
                type="month"
                className="input"
                value={degree.endDate}
                onChange={(e) =>
                  updateDegree(index, { endDate: e.target.value })
                }
              />
            </label>
            <button
              type="button"
              onClick={() => removeDegree(index)}
              aria-label="Remove degree"
              className="self-start text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white sm:self-center"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addDegree}
        className="self-start rounded-md border border-black/20 px-3 py-1.5 text-sm dark:border-white/20"
      >
        + Add degree
      </button>
    </div>
  );
}
