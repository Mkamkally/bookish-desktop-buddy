import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildItems,
  emptyDatabase,
  loadDatabase,
  normalize,
  saveDatabase,
  uid,
} from "./db";
import type {
  Activity,
  ActivityType,
  Course,
  Database,
  Reminder,
  StudyItem,
} from "./types";

const ACCENT_KEY = "study-progress-tracker:accent";
export type Accent = "blue" | "green";

interface StoreValue {
  db: Database;
  ready: boolean;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  addSemester: (name: string) => void;
  renameSemester: (id: string, name: string) => void;
  deleteSemester: (id: string) => void;
  moveSemester: (id: string, direction: -1 | 1) => void;
  saveCourse: (
    course: Omit<Course, "id"> & { id?: string },
  ) => void;
  deleteCourse: (id: string) => void;
  updateItem: (id: string, patch: Partial<StudyItem>) => void;
  toggleItem: (id: string) => void;
  addNote: (itemId: string, text: string) => void;
  updateNote: (itemId: string, noteId: string, text: string) => void;
  deleteNote: (itemId: string, noteId: string) => void;
  addTag: (name: string) => string;
  toggleItemTag: (itemId: string, tagId: string) => void;
  saveReminder: (reminder: Omit<Reminder, "id"> & { id?: string }) => void;
  deleteReminder: (id: string) => void;
  replaceDatabase: (db: Database) => void;
  resetDatabase: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => emptyDatabase());
  const [ready, setReady] = useState(false);
  const [accent, setAccentState] = useState<Accent>("blue");

  useEffect(() => {
    setDb(loadDatabase());
    const stored = window.localStorage.getItem(ACCENT_KEY) as Accent | null;
    if (stored === "green" || stored === "blue") setAccentState(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset["accent"] = accent;
    window.localStorage.setItem(ACCENT_KEY, accent);
  }, [accent, ready]);

  // Fire local notifications for due reminders while the app is open.
  useEffect(() => {
    if (!ready) return;
    const fired = new Set<string>();
    const tick = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = Date.now();
      db.reminders.forEach((r) => {
        if (!r.notificationEnabled) return;
        const due = new Date(`${r.date}T${r.time || "00:00"}`).getTime();
        const key = `${r.id}:${r.date}:${r.time}`;
        if (!Number.isFinite(due) || fired.has(key)) return;
        if (due <= now && now - due < 5 * 60000) {
          fired.add(key);
          new Notification(r.title, { body: r.description || "Study reminder" });
        }
      });
    };
    tick();
    const interval = window.setInterval(tick, 30000);
    return () => window.clearInterval(interval);
  }, [db.reminders, ready]);

  const commit = useCallback(
    (updater: (draft: Database) => void) => {
      setDb((prev) => {
        const next: Database = JSON.parse(JSON.stringify(prev));
        updater(next);
        saveDatabase(next);
        return next;
      });
    },
    [],
  );

  const log = (draft: Database, type: ActivityType, title: string) => {
    const entry: Activity = { id: uid("act"), type, title, timestamp: Date.now() };
    draft.activity = [entry, ...draft.activity].slice(0, 60);
  };

  const value = useMemo<StoreValue>(() => {
    return {
      db,
      ready,
      accent,
      setAccent: setAccentState,

      addSemester: (name) =>
        commit((d) => {
          d.semesters.push({
            id: uid("sem"),
            name: name.trim() || `Semester ${d.semesters.length + 1}`,
            order: d.semesters.length,
          });
        }),

      renameSemester: (id, name) =>
        commit((d) => {
          const s = d.semesters.find((x) => x.id === id);
          if (s && name.trim()) s.name = name.trim();
        }),

      deleteSemester: (id) =>
        commit((d) => {
          const courseIds = d.courses.filter((c) => c.semesterId === id).map((c) => c.id);
          d.courses = d.courses.filter((c) => c.semesterId !== id);
          d.items = d.items.filter((i) => !courseIds.includes(i.courseId));
          d.semesters = d.semesters
            .filter((s) => s.id !== id)
            .map((s, index) => ({ ...s, order: index }));
        }),

      moveSemester: (id, direction) =>
        commit((d) => {
          const sorted = [...d.semesters].sort((a, b) => a.order - b.order);
          const index = sorted.findIndex((s) => s.id === id);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= sorted.length) return;
          const a = sorted[index]!;
          const b = sorted[target]!;
          sorted[index] = b;
          sorted[target] = a;
          d.semesters = sorted.map((s, i) => ({ ...s, order: i }));
        }),

      saveCourse: (input) =>
        commit((d) => {
          if (input.id) {
            const course = d.courses.find((c) => c.id === input.id);
            if (!course) return;
            const prevLectures = course.totalLectures;
            const prevLabs = course.totalLabs;
            Object.assign(course, {
              name: input.name,
              description: input.description,
              totalLectures: input.totalLectures,
              totalLabs: input.totalLabs,
            });
            syncCount(d, course.id, "lecture", prevLectures, input.totalLectures);
            syncCount(d, course.id, "lab", prevLabs, input.totalLabs);
            return;
          }
          const id = uid("course");
          d.courses.push({
            id,
            semesterId: input.semesterId,
            name: input.name,
            description: input.description,
            totalLectures: input.totalLectures,
            totalLabs: input.totalLabs,
          });
          d.items.push(
            ...buildItems(id, "lecture", input.totalLectures),
            ...buildItems(id, "lab", input.totalLabs),
          );
        }),

      deleteCourse: (id) =>
        commit((d) => {
          d.courses = d.courses.filter((c) => c.id !== id);
          d.items = d.items.filter((i) => i.courseId !== id);
        }),

      updateItem: (id, patch) =>
        commit((d) => {
          const item = d.items.find((i) => i.id === id);
          if (item) Object.assign(item, patch);
        }),

      toggleItem: (id) =>
        commit((d) => {
          const item = d.items.find((i) => i.id === id);
          if (!item) return;
          item.completed = !item.completed;
          item.completionDate = item.completed ? Date.now() : null;
          if (item.completed) {
            const course = d.courses.find((c) => c.id === item.courseId);
            log(
              d,
              item.kind === "lecture" ? "lecture_completed" : "lab_completed",
              `${course?.name ?? "Course"} · ${item.title}`,
            );
          }
        }),

      addNote: (itemId, text) =>
        commit((d) => {
          const item = d.items.find((i) => i.id === itemId);
          if (!item || !text.trim()) return;
          const now = Date.now();
          item.notes.unshift({ id: uid("note"), text, createdAt: now, updatedAt: now });
          log(d, "note_added", `Note added to ${item.title}`);
        }),

      updateNote: (itemId, noteId, text) =>
        commit((d) => {
          const note = d.items.find((i) => i.id === itemId)?.notes.find((n) => n.id === noteId);
          if (note) {
            note.text = text;
            note.updatedAt = Date.now();
          }
        }),

      deleteNote: (itemId, noteId) =>
        commit((d) => {
          const item = d.items.find((i) => i.id === itemId);
          if (item) item.notes = item.notes.filter((n) => n.id !== noteId);
        }),

      addTag: (name) => {
        const trimmed = name.trim();
        const existing = db.tags.find(
          (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (existing) return existing.id;
        const id = uid("tag");
        commit((d) => {
          d.tags.push({ id, name: trimmed });
        });
        return id;
      },

      toggleItemTag: (itemId, tagId) =>
        commit((d) => {
          const item = d.items.find((i) => i.id === itemId);
          if (!item) return;
          item.tagIds = item.tagIds.includes(tagId)
            ? item.tagIds.filter((t) => t !== tagId)
            : [...item.tagIds, tagId];
        }),

      saveReminder: (input) =>
        commit((d) => {
          if (input.id) {
            const reminder = d.reminders.find((r) => r.id === input.id);
            if (reminder) Object.assign(reminder, input);
            return;
          }
          const reminder: Reminder = { ...input, id: uid("rem") };
          d.reminders.push(reminder);
          log(d, "reminder_created", reminder.title);
        }),

      deleteReminder: (id) =>
        commit((d) => {
          d.reminders = d.reminders.filter((r) => r.id !== id);
        }),

      replaceDatabase: (next) => {
        const clean = normalize(next);
        saveDatabase(clean);
        setDb(clean);
      },

      resetDatabase: () => {
        const clean = emptyDatabase();
        saveDatabase(clean);
        setDb(clean);
      },
    };
  }, [db, ready, accent, commit]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function syncCount(
  d: Database,
  courseId: string,
  kind: "lecture" | "lab",
  prev: number,
  next: number,
) {
  if (next === prev) return;
  const items = d.items
    .filter((i) => i.courseId === courseId && i.kind === kind)
    .sort((a, b) => a.number - b.number);
  if (next > items.length) {
    d.items.push(...buildItems(courseId, kind, next - items.length, items.length + 1));
  } else if (next < items.length) {
    const removed = items.slice(next).map((i) => i.id);
    d.items = d.items.filter((i) => !removed.includes(i.id));
  }
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
