import {
  DEFAULT_TAGS,
  type Course,
  type Database,
  type Difficulty,
  type ItemKind,
  type StudyItem,
} from "./types";

export const STORAGE_KEY = "study-progress-tracker:v1";

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function emptyDatabase(): Database {
  return {
    version: 1,
    semesters: [],
    courses: [],
    items: [],
    tags: DEFAULT_TAGS.map((name) => ({ id: uid("tag"), name })),
    reminders: [],
    activity: [],
  };
}

export function buildItems(
  courseId: string,
  kind: ItemKind,
  count: number,
  startAt = 1,
): StudyItem[] {
  const label = kind === "lecture" ? "Lecture" : "Lab";
  return Array.from({ length: Math.max(0, count) }, (_, i) => ({
    id: uid(kind),
    courseId,
    kind,
    number: startAt + i,
    title: `${label} ${startAt + i}`,
    completed: false,
    difficulty: "medium" as Difficulty,
    folderPath: "",
    notes: [],
    tagIds: [],
    completionDate: null,
    estimatedDuration: kind === "lecture" ? 90 : 120,
  }));
}

/** Demo content so a fresh install is not an empty shell. */
export function seedDatabase(): Database {
  const db = emptyDatabase();
  const tagId = (name: string) => db.tags.find((t) => t.name === name)?.id;

  const semesterNames = ["Semester 3", "Semester 4"];
  const plan: Record<string, Array<[string, number, number, string]>> = {
    "Semester 3": [
      ["Data Structures", 14, 8, "Trees, graphs, hashing"],
      ["Discrete Mathematics", 12, 0, "Logic, sets, combinatorics"],
      ["Computer Organization", 10, 6, ""],
    ],
    "Semester 4": [
      ["Algorithm Analysis", 16, 8, "Complexity and design paradigms"],
      ["Database Systems", 12, 10, "Relational modelling and SQL"],
      ["Operating Systems", 14, 6, ""],
    ],
  };

  semesterNames.forEach((name, index) => {
    const semesterId = uid("sem");
    db.semesters.push({ id: semesterId, name, order: index });
    (plan[name] ?? []).forEach(([courseName, lectures, labs, description]) => {
      const courseId = uid("course");
      db.courses.push({
        id: courseId,
        semesterId,
        name: courseName,
        description,
        totalLectures: lectures,
        totalLabs: labs,
      });
      db.items.push(
        ...buildItems(courseId, "lecture", lectures),
        ...buildItems(courseId, "lab", labs),
      );
    });
  });

  // Mark a realistic slice as completed.
  const now = Date.now();
  db.courses.forEach((course, ci) => {
    const ratio = 0.3 + (ci % 4) * 0.15;
    (["lecture", "lab"] as const).forEach((kind, ki) => {
      const items = db.items.filter((i) => i.courseId === course.id && i.kind === kind);
      const done = Math.floor(items.length * Math.max(0.15, ratio - ki * 0.12));
      items.slice(0, done).forEach((item, ii) => {
        item.completed = true;
        item.completionDate = now - (ii + ci + ki * 3) * 86400000;
      });
    });
  });

  const algo = db.courses.find((c) => c.name === "Algorithm Analysis")!;
  const algoLectures = db.items.filter(
    (i) => i.courseId === algo.id && i.kind === "lecture",
  );
  if (algoLectures[2]) {
    algoLectures[2].title = "Divide and Conquer";
    algoLectures[2].difficulty = "hard";
    algoLectures[2].folderPath = "Semester 4/Algorithm Analysis/Lecture 03";
    algoLectures[2].tagIds = [tagId("Exam")!, tagId("Need Revision")!];
    algoLectures[2].notes = [
      {
        id: uid("note"),
        text: "Master theorem cases\n- Case 1: work dominated by leaves\n- Case 2: balanced\n- Case 3: root dominates\n\nRevisit the closest-pair proof before the midterm.",
        createdAt: now - 172800000,
        updatedAt: now - 172800000,
      },
    ];
  }

  db.reminders.push({
    id: uid("rem"),
    title: "Algorithms midterm revision",
    description: "Master theorem + greedy proofs",
    date: new Date(now + 2 * 86400000).toISOString().slice(0, 10),
    time: "19:30",
    repeat: "never",
    notificationEnabled: true,
  });

  db.activity.push(
    {
      id: uid("act"),
      type: "note_added",
      title: "Note added to Divide and Conquer",
      timestamp: now - 172800000,
    },
    {
      id: uid("act"),
      type: "reminder_created",
      title: "Algorithms midterm revision",
      timestamp: now - 86400000,
    },
    {
      id: uid("act"),
      type: "lecture_completed",
      title: "Data Structures · Lecture 4",
      timestamp: now - 43200000,
    },
  );

  return db;
}

export function loadDatabase(): Database {
  if (typeof window === "undefined") return emptyDatabase();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedDatabase();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return normalize(JSON.parse(raw));
  } catch {
    return seedDatabase();
  }
}

export function saveDatabase(db: Database) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function normalize(input: unknown): Database {
  const base = emptyDatabase();
  const raw = (input ?? {}) as Partial<Database>;
  return {
    version: 1,
    semesters: Array.isArray(raw.semesters) ? raw.semesters : base.semesters,
    courses: Array.isArray(raw.courses) ? raw.courses : base.courses,
    items: Array.isArray(raw.items)
      ? raw.items.map((i) => ({ ...i, notes: i.notes ?? [], tagIds: i.tagIds ?? [] }))
      : base.items,
    tags: Array.isArray(raw.tags) && raw.tags.length ? raw.tags : base.tags,
    reminders: Array.isArray(raw.reminders) ? raw.reminders : base.reminders,
    activity: Array.isArray(raw.activity) ? raw.activity : base.activity,
  };
}

/* ---------- progress helpers ---------- */

export function courseItems(db: Database, courseId: string) {
  return db.items.filter((i) => i.courseId === courseId);
}

export interface ProgressStat {
  completed: number;
  total: number;
  percent: number;
}

export function stat(completed: number, total: number): ProgressStat {
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function courseProgress(db: Database, course: Course) {
  const items = courseItems(db, course.id);
  const lectures = items.filter((i) => i.kind === "lecture");
  const labs = items.filter((i) => i.kind === "lab");
  const lectureStat = stat(lectures.filter((i) => i.completed).length, lectures.length);
  const labStat = stat(labs.filter((i) => i.completed).length, labs.length);
  const overall = stat(
    items.filter((i) => i.completed).length,
    items.length,
  );
  return { lectures: lectureStat, labs: labStat, overall };
}

export function semesterPercent(db: Database, semesterId: string) {
  const courses = db.courses.filter((c) => c.semesterId === semesterId);
  if (!courses.length) return 0;
  const sum = courses.reduce((acc, c) => acc + courseProgress(db, c).overall.percent, 0);
  return Math.round(sum / courses.length);
}

export function overallPercent(db: Database) {
  const semesters = db.semesters.filter((s) =>
    db.courses.some((c) => c.semesterId === s.id),
  );
  if (!semesters.length) return 0;
  const sum = semesters.reduce((acc, s) => acc + semesterPercent(db, s.id), 0);
  return Math.round(sum / semesters.length);
}

export function totals(db: Database) {
  const lectures = db.items.filter((i) => i.kind === "lecture");
  const labs = db.items.filter((i) => i.kind === "lab");
  return {
    courses: db.courses.length,
    lectures: stat(lectures.filter((i) => i.completed).length, lectures.length),
    labs: stat(labs.filter((i) => i.completed).length, labs.length),
    notes: db.items.reduce((acc, i) => acc + i.notes.length, 0),
  };
}

export function reminderDateTime(date: string, time: string) {
  return new Date(`${date}T${time || "00:00"}`).getTime();
}

export function upcomingReminders(db: Database) {
  const now = Date.now();
  return [...db.reminders]
    .filter((r) => r.repeat !== "never" || reminderDateTime(r.date, r.time) >= now - 60000)
    .sort((a, b) => reminderDateTime(a.date, a.time) - reminderDateTime(b.date, b.time));
}
