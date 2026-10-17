import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { semesterPercent } from "@/lib/db";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/semesters/")({
  head: () => ({
    meta: [
      { title: "Semesters · Study Progress Tracker" },
      {
        name: "description",
        content: "Add, rename, reorder and delete semesters, and open each one to manage its courses.",
      },
      { property: "og:title", content: "Semesters · Study Progress Tracker" },
      {
        property: "og:description",
        content: "Manage every semester and jump straight into its courses.",
      },
    ],
  }),
  component: SemestersPage,
});

function SemestersPage() {
  const { db, addSemester, renameSemester, deleteSemester, moveSemester } = useStore();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const semesters = [...db.semesters].sort((a, b) => a.order - b.order);

  return (
    <AppShell title="Semesters" subtitle={`${semesters.length} total`}>
      <div className="card-surface flex gap-2 p-3">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`Semester ${semesters.length + 1}`}
          className="h-11"
        />
        <Button
          className="h-11 shrink-0"
          onClick={() => {
            addSemester(newName);
            setNewName("");
          }}
        >
          <Plus className="size-4" /> Add
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {semesters.map((s, index) => {
          const percent = semesterPercent(db, s.id);
          const courseCount = db.courses.filter((c) => c.semesterId === s.id).length;
          return (
            <div key={s.id} className="card-surface p-4">
              {editing === s.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-11"
                    autoFocus
                  />
                  <Button
                    className="h-11"
                    onClick={() => {
                      renameSemester(s.id, editName);
                      setEditing(null);
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <Link
                    to="/semesters/$semesterId"
                    params={{ semesterId: s.id }}
                    className="block"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-base font-bold">{s.name}</span>
                      <span className="text-sm font-bold tabular-nums">{percent}%</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {courseCount} {courseCount === 1 ? "course" : "courses"}
                    </p>
                    <ProgressBar percent={percent} className="mt-3" />
                  </Link>
                  <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
                    <IconAction
                      label="Move up"
                      disabled={index === 0}
                      onClick={() => moveSemester(s.id, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </IconAction>
                    <IconAction
                      label="Move down"
                      disabled={index === semesters.length - 1}
                      onClick={() => moveSemester(s.id, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </IconAction>
                    <IconAction
                      label="Rename"
                      onClick={() => {
                        setEditing(s.id);
                        setEditName(s.name);
                      }}
                    >
                      <Pencil className="size-4" />
                    </IconAction>
                    <div className="flex-1" />
                    <IconAction label="Delete" onClick={() => deleteSemester(s.id)}>
                      <Trash2 className="size-4" />
                    </IconAction>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {!semesters.length ? (
          <EmptyState title="No semesters yet" hint="Add your first semester above." />
        ) : null}
      </div>
    </AppShell>
  );
}

function IconAction({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-10 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}
