export type Difficulty = "easy" | "medium" | "hard";
export type ItemKind = "lecture" | "lab";
export type RepeatMode = "never" | "daily" | "weekly" | "monthly" | "yearly";

export interface Semester {
  id: string;
  name: string;
  order: number;
}

export interface Course {
  id: string;
  semesterId: string;
  name: string;
  description: string;
  totalLectures: number;
  totalLabs: number;
}

export interface Note {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface StudyItem {
  id: string;
  courseId: string;
  kind: ItemKind;
  number: number;
  title: string;
  completed: boolean;
  difficulty: Difficulty;
  folderPath: string;
  notes: Note[];
  tagIds: string[];
  completionDate: number | null;
  estimatedDuration: number; // minutes
}

export interface Tag {
  id: string;
  name: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  repeat: RepeatMode;
  notificationEnabled: boolean;
}

export type ActivityType =
  | "lecture_completed"
  | "lab_completed"
  | "note_added"
  | "reminder_created";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  timestamp: number;
}

export interface Database {
  version: number;
  semesters: Semester[];
  courses: Course[];
  items: StudyItem[];
  tags: Tag[];
  reminders: Reminder[];
  activity: Activity[];
}

export const DEFAULT_TAGS = [
  "Exam",
  "Important",
  "Need Revision",
  "Assignment",
  "Quiz",
  "Project",
];
