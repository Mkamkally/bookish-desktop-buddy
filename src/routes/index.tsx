import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { BarChart3, BookOpen, CheckCircle2, FlaskConical, ListTodo } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, ProgressRing, StatTile } from "@/components/ui-kit";
import { overallPercent, reminderDateTime, semesterPercent, totals, upcomingReminders } from "@/lib/db";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Study Progress Tracker" },
      {
        name: "description",
        content:
          "See overall study progress, lecture and lab completion, today's tasks and recent activity at a glance.",
      },
      { property: "og:title", content: "Dashboard · Study Progress Tracker" },
      {
        property: "og:description",
        content: "See overall study progress, lecture and lab completion, today's tasks and recent activity at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

const ACTIVITY_LABEL: Record<string, string> = {
  lecture_completed: "Lecture completed",
  lab_completed: "Lab completed",
  note_added: "Note added",
  reminder_created: "Reminder created",
};

function Dashboard() {
  const { db, ready } = useStore();
  const t = totals(db);
  const percent = overallPercent(db);
  const reminders = upcomingReminders(db);
  const next = reminders[0];
  const today = format(new Date(), "yyyy-MM-dd");
  const todayReminders = db.reminders.filter((r) => r.date === today);
  // One next-up item per course, so the list is varied rather than repetitive.
  const upNext = db.courses
    .map((course) =>
      db.items
        .filter((i) => i.courseId === course.id && !i.completed)
        .sort((a, b) => (a.kind === b.kind ? a.number - b.number : a.kind === "lecture" ? -1 : 1))[0],
    )
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .slice(0, 4);
  const semesters = [...db.semesters].sort((a, b) => a.order - b.order);

  return (
    <AppShell
      title="Study Progress"
      subtitle={ready ? format(new Date(), "EEEE, d MMM") : ""}
      action={
        <Link
          to="/statistics"
          aria-label="Statistics"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
        >
          <BarChart3 className="size-4" />
        </Link>
      }
    >
      <section className="card-surface flex flex-col items-center px-5 py-7">
        <ProgressRing percent={percent} label="Overall progress" sublabel={`${t.courses} courses`} />
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <MiniStat
            icon={<BookOpen className="size-4" />}
            label="Lectures"
            value={`${t.lectures.completed}/${t.lectures.total}`}
            percent={t.lectures.percent}
          />
          <MiniStat
            icon={<FlaskConical className="size-4" />}
            label="Labs"
            value={`${t.labs.completed}/${t.labs.total}`}
            percent={t.labs.percent}
          />
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile label="Lectures left" value={t.lectures.total - t.lectures.completed} />
        <StatTile label="Labs left" value={t.labs.total - t.labs.completed} />
      </div>

      <SectionTitle>Upcoming reminder</SectionTitle>
      {next ? (
        <Link to="/reminders" className="card-surface block p-4">
          <p className="text-sm font-semibold">{next.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {format(reminderDateTime(next.date, next.time), "EEE d MMM · HH:mm")}
            {next.repeat !== "never" ? ` · repeats ${next.repeat}` : ""}
          </p>
        </Link>
      ) : (
        <EmptyState title="No reminders yet" hint="Create one from the Reminders tab." />
      )}

      <SectionTitle>Today's tasks</SectionTitle>
      <div className="space-y-2">
        {todayReminders.map((r) => (
          <div key={r.id} className="card-surface flex items-center gap-3 p-3.5">
            <ListTodo className="size-4 text-primary" />
            <span className="flex-1 truncate text-sm font-medium">{r.title}</span>
            <span className="text-xs text-muted-foreground">{r.time}</span>
          </div>
        ))}
        {upNext.map((item) => {
          const course = db.courses.find((c) => c.id === item.courseId);
          return (
            <Link
              key={item.id}
              to="/items/$itemId"
              params={{ itemId: item.id }}
              className="card-surface flex items-center gap-3 p-3.5"
            >
              <CheckCircle2 className="size-4 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{course?.name}</span>
              </span>
            </Link>
          );
        })}
        {!todayReminders.length && !upNext.length ? (
          <EmptyState title="Nothing pending" hint="Everything is completed." />
        ) : null}
      </div>

      <SectionTitle>Progress by semester</SectionTitle>
      <div className="space-y-2">
        {semesters.map((s) => {
          const p = semesterPercent(db, s.id);
          return (
            <Link
              key={s.id}
              to="/semesters/$semesterId"
              params={{ semesterId: s.id }}
              className="card-surface block p-4"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="text-sm font-bold tabular-nums">{p}%</span>
              </div>
              <ProgressBar percent={p} className="mt-2.5" />
            </Link>
          );
        })}
        {!semesters.length ? (
          <EmptyState title="No semesters yet" hint="Add your first semester in the Study tab." />
        ) : null}
      </div>

      <SectionTitle>Recent activity</SectionTitle>
      <div className="card-surface divide-y divide-border">
        {db.activity.slice(0, 8).map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{a.title}</span>
              <span className="block text-xs text-muted-foreground">
                {ACTIVITY_LABEL[a.type]} · {format(a.timestamp, "d MMM, HH:mm")}
              </span>
            </span>
          </div>
        ))}
        {!db.activity.length ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : null}
      </div>
    </AppShell>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-7 mb-2.5 text-sm font-bold">{children}</h2>;
}

function MiniStat({
  icon,
  label,
  value,
  percent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
      <ProgressBar percent={percent} className="mt-2 h-1.5" />
    </div>
  );
}
