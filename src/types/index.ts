export interface Degree {
  degreeType: string;
  fieldOfStudy: string;
  institution: string;
  /** Month the student started, in "YYYY-MM" format (native <input type="month"> value). */
  startDate: string;
  /** Month the student finished/left, in "YYYY-MM" format. */
  endDate: string;
}

export interface UserProfile {
  name: string;
  targetRoles: string[];
  skills: string[];
  yearsExperience: number;
  degrees: Degree[];
  locationPreferences: string[];
  /** Whether remote opportunities should be included alongside location preferences. */
  includeRemote: boolean;
  notes: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  postedAt: string;
  url: string;
  matchScore: number;
  matchReasons: string[];
}
