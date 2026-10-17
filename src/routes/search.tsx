import { createFileRoute, Link } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DifficultyChip, EmptyState, TagChip } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · Study Progress Tracker" },
      {
        name: "description",
        content: "Instantly search across courses, lectures, labs, tags, difficulty, notes and semesters.",
      },
      { property: "og:title", content: "Search · Study Progress Tracker" },
      {
        property: "og:description",
        content: "One search box across every course, lecture, lab, tag and note.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { db } = useStore();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return { courses: [], items: [] };
    const semesterName = (id: string) => db.semesters.find((s) => s.id === id)?.name ?? "";
    const courses = db.courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        semesterName(c.semesterId).toLowerCase().includes(q),
    );
    const items = db.items.filter((i) => {
      const course = db.courses.find((c) => c.id === i.courseId);
      const tags = i.tagIds
        .map((id) => db.tags.find((t) => t.id === id)?.name ?? "")
        .join(" ")
        .toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        i.difficulty.includes(q) ||
        tags.includes(q) ||
        i.notes.some((n) => n.text.toLowerCase().includes(q)) ||
        (course ? course.name.toLowerCase().includes(q) : false) ||
        (course ? semesterName(course.semesterId).toLowerCase().includes(q) : false)
      );
    });
    return { courses, items: items.slice(0, 60) };
  }, [db, q]);

  return (
    <AppShell title="Search" subtitle="Courses, lectures, labs, tags and notes">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “exam”, “hard”, “database”"
          className="h-12 pl-9"
          autoFocus
        />
      </div>

      {!q ? (
        <div className="mt-4">
          <EmptyState title="Start typing" hint="Results appear instantly as you type." />
        </div>
      ) : (
        <>
          {results.courses.length ? (
            <>
              <h2 className="mt-6 mb-2.5 text-sm font-bold">Courses ({results.courses.length})</h2>
              <div className="space-y-2">
                {results.courses.map((c) => (
                  <Link
                    key={c.id}
                    to="/courses/$courseId"
                    params={{ courseId: c.id }}
                    className="card-surface block p-3.5"
                  >
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {db.semesters.find((s) => s.id === c.semesterId)?.name}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          {results.items.length ? (
            <>
              <h2 className="mt-6 mb-2.5 text-sm font-bold">Lectures & labs ({results.items.length})</h2>
              <div className="space-y-2">
                {results.items.map((i) => {
                  const course = db.courses.find((c) => c.id === i.courseId);
                  return (
                    <Link
                      key={i.id}
                      to="/items/$itemId"
                      params={{ itemId: i.id }}
                      className="card-surface block p-3.5"
                    >
                      <p className="truncate text-sm font-semibold">{i.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {course?.name} · {i.kind === "lecture" ? "Lecture" : "Lab"} {i.number}
                      </p>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        <DifficultyChip difficulty={i.difficulty} />
                        {i.tagIds.map((id) => {
                          const tag = db.tags.find((t) => t.id === id);
                          return tag ? <TagChip key={id} name={tag.name} /> : null;
                        })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : null}

          {!results.courses.length && !results.items.length ? (
            <div className="mt-4">
              <EmptyState title="No results" hint="Try a different keyword." />
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
