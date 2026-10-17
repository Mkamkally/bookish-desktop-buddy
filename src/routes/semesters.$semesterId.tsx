import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search as SearchIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { courseProgress, semesterPercent } from "@/lib/db";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/semesters/$semesterId")({
  head: () => ({
    meta: [
      { title: "Courses · Study Progress Tracker" },
      {
        name: "description",
        content: "Browse, search and sort the courses inside a semester with live lecture and lab progress.",
      },
      { property: "og:title", content: "Courses · Study Progress Tracker" },
      {
        property: "og:description",
        content: "Every course in the semester with lecture and lab completion.",
      },
    ],
  }),
  component: CoursesPage,
});

type SortKey = "name" | "progress-desc" | "progress-asc";

function CoursesPage() {
  const { semesterId } = Route.useParams();
  const { db, deleteCourse } = useStore();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");

  const semester = db.semesters.find((s) => s.id === semesterId);
  const courses = useMemo(() => {
    const list = db.courses
      .filter((c) => c.semesterId === semesterId)
      .filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));
    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const pa = courseProgress(db, a).overall.percent;
      const pb = courseProgress(db, b).overall.percent;
      return sort === "progress-desc" ? pb - pa : pa - pb;
    });
  }, [db, semesterId, query, sort]);

  if (!semester) {
    return (
      <AppShell title="Semester" back={{ to: "/semesters" }}>
        <EmptyState title="Semester not found" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={semester.name}
      subtitle={`${semesterPercent(db, semester.id)}% complete`}
      back={{ to: "/semesters" }}
      action={<CourseDialog semesterId={semester.id} />}
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses"
            className="h-11 pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-11 w-[132px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="progress-desc">Most done</SelectItem>
            <SelectItem value="progress-asc">Least done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-3">
        {courses.map((course) => {
          const p = courseProgress(db, course);
          return (
            <div key={course.id} className="card-surface p-4">
              <Link to="/courses/$courseId" params={{ courseId: course.id }} className="block">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-base font-bold">{course.name}</span>
                  <span className="text-sm font-bold tabular-nums">{p.overall.percent}%</span>
                </div>
                <ProgressBar percent={p.overall.percent} className="mt-3" />
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span>
                    Lectures{" "}
                    <strong className="font-semibold text-foreground tabular-nums">
                      {p.lectures.completed}/{p.lectures.total}
                    </strong>
                  </span>
                  <span>
                    Labs{" "}
                    <strong className="font-semibold text-foreground tabular-nums">
                      {p.labs.completed}/{p.labs.total}
                    </strong>
                  </span>
                </div>
              </Link>
              <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
                <CourseDialog semesterId={semester.id} course={course} variant="inline" />
                <div className="flex-1" />
                <button
                  type="button"
                  aria-label="Delete course"
                  onClick={() => {
                    deleteCourse(course.id);
                    toast.success("Course deleted");
                  }}
                  className="flex size-10 items-center justify-center rounded-lg text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
        {!courses.length ? (
          <EmptyState
            title={query ? "No matching courses" : "No courses yet"}
            {...(query ? {} : { hint: "Add your first course with the + button." })}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function CourseDialog({
  semesterId,
  course,
  variant = "header",
}: {
  semesterId: string;
  course?: { id: string; name: string; description: string; totalLectures: number; totalLabs: number };
  variant?: "header" | "inline";
}) {
  const { saveCourse } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(course?.name ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [lectures, setLectures] = useState(String(course?.totalLectures ?? 12));
  const [labs, setLabs] = useState(String(course?.totalLabs ?? 0));

  const submit = () => {
    const totalLectures = Number(lectures);
    const totalLabs = Number(labs);
    if (!name.trim()) {
      toast.error("Course name cannot be empty");
      return;
    }
    if (!Number.isFinite(totalLectures) || totalLectures < 0) {
      toast.error("Lecture count cannot be negative");
      return;
    }
    if (!Number.isFinite(totalLabs) || totalLabs < 0) {
      toast.error("Lab count cannot be negative");
      return;
    }
    saveCourse({
      ...(course?.id ? { id: course.id } : {}),
      semesterId,
      name: name.trim(),
      description: description.trim(),
      totalLectures: Math.floor(totalLectures),
      totalLabs: Math.floor(totalLabs),
    });
    toast.success(course ? "Course updated" : "Course created");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "header" ? (
          <Button size="icon" className="size-10 shrink-0 rounded-full" aria-label="Add course">
            <Plus className="size-4" />
          </Button>
        ) : (
          <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-primary">
            Edit course
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{course ? "Edit course" : "New course"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="c-name">Course name</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-lectures">Total lectures</Label>
              <Input
                id="c-lectures"
                type="number"
                min={0}
                value={lectures}
                onChange={(e) => setLectures(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="c-labs">Total labs</Label>
              <Input
                id="c-labs"
                type="number"
                min={0}
                value={labs}
                onChange={(e) => setLabs(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="c-desc">Description (optional)</Label>
            <Textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} className="h-11 w-full">
            {course ? "Save changes" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
