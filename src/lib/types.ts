export interface Entry {
  id: number;
  date: string; // YYYY-MM-DD
  description: string;
  details: string | null;
  durationMinutes: number;
  project: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntryInput {
  date: string;
  description: string;
  details: string | null;
  durationMinutes: number;
  project: string | null;
}

export interface ProjectSummary {
  project: string;
  minutes: number;
  count: number;
}

export interface Summary {
  totalMinutes: number;
  taskCount: number;
  byProject: ProjectSummary[];
}
