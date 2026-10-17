import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DifficultyChip, EmptyState, ProgressBar, ProgressRing, StatTile, TagChip } from "@/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { courseProgress } from "@/lib/db";
import { useStore } from "@/lib/store";
import type { ItemKind, StudyItem } from "@/lib/types";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({
    meta: [
      { title: "Course details · Study Progress Tracker" },
      {
        name: "description",
        content: "Course overview with lecture progress, lab progress, per-item difficulty, tags and statistics.",
      },
      { property: "og:title", content: "Course details · Study Progress Tracker" },
      {
        property: "og:description",
        content: "Lectures, labs and statistics for a single course.",
      },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { courseId } = Route.useParams();
  const { db, toggleItem } = useStore();
  const [tab, setTab] = useState("lectures");

  const course = db.courses.find((c) => c.id === courseId);
  if (!course) {
    return (
      <AppShell title="Course" back={{ to: "/semesters" }}>
        <EmptyState title="Course not found" />
      </AppShell>
    );
  }
  const semester = db.semesters.find((s) => s.id === course.semesterId);
  const p = courseProgress(db, course);
  const items = (kind: ItemKind) =>
    db.items.filter((i) => i.courseId === course.id && i.kind === kind).sort((a, b) => a.number - b.number);

  return (
    <AppShell
      title={course.name}
      subtitle={semester?.name}
      back={{ to: "/semesters/$semesterId", params: { semesterId: course.semesterId } }}
    >
      <section className="card-surface flex flex-col items-center px-5 py-6">
        <ProgressRing percent={p.overall.percent} size={150} label="Course progress" />
        {course.description ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">{course.description}</p>
        ) : null}
        <div className="mt-5 w-full space-y-3">
          <LabeledBar label="Lectures" stat={p.lectures} />
          <LabeledBar label="Labs" stat={p.labs} />
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="grid h-11 w-full grid-cols-3">
          <TabsTrigger value="lectures">Lectures</TabsTrigger>
          <TabsTrigger value="labs">Labs</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="lectures" className="mt-4 space-y-2">
          <ItemList items={items("lecture")} onToggle={toggleItem} />
        </TabsContent>
        <TabsContent value="labs" className="mt-4 space-y-2">
          <ItemList items={items("lab")} onToggle={toggleItem} />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <CourseStats courseId={course.id} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function LabeledBar({ label, stat }: { label: string; stat: { completed: number; total: number; percent: number } }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {stat.completed}/{stat.total} · {stat.percent}%
        </span>
      </div>
      <ProgressBar percent={stat.percent} className="mt-1.5" />
    </div>
  );
}

function ItemList({ items, onToggle }: { items: StudyItem[]; onToggle: (id: string) => void }) {
  const { db } = useStore();
  if (!items.length) return <EmptyState title="Nothing here yet" hint="Edit the course to set a count." />;
  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="card-surface flex items-center gap-3 p-3.5">
          <Checkbox
            checked={item.completed}
            onCheckedChange={() => onToggle(item.id)}
            aria-label={`Mark ${item.title} complete`}
            className="size-5"
          />
          <Link to="/items/$itemId" params={{ itemId: item.id }} className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                {String(item.number).padStart(2, "0")}
              </span>
              <span className="truncate text-sm font-semibold">{item.title}</span>
            </span>
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <DifficultyChip difficulty={item.difficulty} />
              {item.tagIds.slice(0, 2).map((id) => {
                const tag = db.tags.find((t) => t.id === id);
                return tag ? <TagChip key={id} name={tag.name} /> : null;
              })}
              {item.notes.length ? (
                <span className="text-[11px] text-muted-foreground">{item.notes.length} notes</span>
              ) : null}
            </span>
          </Link>
        </div>
      ))}
    </>
  );
}

function CourseStats({ courseId }: { courseId: string }) {
  const { db } = useStore();
  const items = db.items.filter((i) => i.courseId === courseId);
  const lectures = items.filter((i) => i.kind === "lecture");
  const labs = items.filter((i) => i.kind === "lab");
  const notes = items.reduce((a, i) => a + i.notes.length, 0);
  const hard = items.filter((i) => i.difficulty === "hard").length;
  const minutes = items.filter((i) => i.completed).reduce((a, i) => a + i.estimatedDuration, 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label="Lectures done" value={`${lectures.filter((i) => i.completed).length}/${lectures.length}`} />
      <StatTile label="Labs done" value={`${labs.filter((i) => i.completed).length}/${labs.length}`} />
      <StatTile label="Lectures left" value={lectures.filter((i) => !i.completed).length} />
      <StatTile label="Labs left" value={labs.filter((i) => !i.completed).length} />
      <StatTile label="Notes" value={notes} />
      <StatTile label="Hard items" value={hard} />
      <StatTile label="Study time logged" value={`${Math.round(minutes / 60)}h`} hint="From completed items" />
      <StatTile
        label="Completion"
        value={`${items.length ? Math.round((items.filter((i) => i.completed).length / items.length) * 100) : 0}%`}
      />
    </div>
  );
}
