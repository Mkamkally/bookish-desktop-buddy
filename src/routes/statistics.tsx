import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, StatTile } from "@/components/ui-kit";
import { courseProgress, totals, overallPercent } from "@/lib/db";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics · Study Progress Tracker" },
      {
        name: "description",
        content: "Study statistics: most and least completed courses, hardest course, notes, lecture and lab totals.",
      },
      { property: "og:title", content: "Statistics · Study Progress Tracker" },
      {
        property: "og:description",
        content: "Most completed, least completed and hardest courses plus lecture and lab totals.",
      },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const { db } = useStore();
  const t = totals(db);

  const ranked = db.courses
    .map((c) => ({ course: c, percent: courseProgress(db, c).overall.percent }))
    .sort((a, b) => b.percent - a.percent);
  const most = ranked[0];
  const least = ranked[ranked.length - 1];
  const hardest = db.courses
    .map((c) => ({
      course: c,
      hard: db.items.filter((i) => i.courseId === c.id && i.difficulty === "hard").length,
    }))
    .sort((a, b) => b.hard - a.hard)[0];

  return (
    <AppShell title="Statistics" subtitle={`${overallPercent(db)}% study percentage`} back={{ to: "/" }}>
      {!db.courses.length ? (
        <EmptyState title="No data yet" hint="Add courses to see statistics." />
      ) : (
        <>
          <div className="space-y-3">
            <Highlight label="Most completed" course={most?.course.name} value={`${most?.percent ?? 0}%`} id={most?.course.id} percent={most?.percent ?? 0} />
            <Highlight label="Least completed" course={least?.course.name} value={`${least?.percent ?? 0}%`} id={least?.course.id} percent={least?.percent ?? 0} />
            <Highlight
              label="Hardest course"
              course={hardest?.course.name}
              value={`${hardest?.hard ?? 0} hard items`}
              id={hardest?.course.id}
              percent={hardest ? courseProgress(db, hardest.course).overall.percent : 0}
            />
          </div>

          <h2 className="mt-7 mb-2.5 text-sm font-bold">Totals</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Total lectures" value={t.lectures.total} />
            <StatTile label="Completed lectures" value={t.lectures.completed} />
            <StatTile label="Remaining lectures" value={t.lectures.total - t.lectures.completed} />
            <StatTile label="Completed labs" value={t.labs.completed} />
            <StatTile label="Remaining labs" value={t.labs.total - t.labs.completed} />
            <StatTile label="Total notes" value={t.notes} />
            <StatTile label="Courses" value={t.courses} />
            <StatTile label="Study percentage" value={`${overallPercent(db)}%`} />
          </div>
        </>
      )}
    </AppShell>
  );
}

function Highlight({
  label,
  course,
  value,
  id,
  percent,
}: {
  label: string;
  course?: string | undefined;
  value: string;
  id?: string | undefined;
  percent: number;
}) {
  if (!course || !id) return null;
  return (
    <Link to="/courses/$courseId" params={{ courseId: id }} className="card-surface block p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="truncate text-base font-bold">{course}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <ProgressBar percent={percent} className="mt-3" />
    </Link>
  );
}
