import { createFileRoute } from "@tanstack/react-router";
import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { normalize } from "@/lib/db";
import { useStore, type Accent } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Study Progress Tracker" },
      {
        name: "description",
        content: "Choose an accent colour, export or import your study database as JSON, and reset local data.",
      },
      { property: "og:title", content: "Settings · Study Progress Tracker" },
      {
        property: "og:description",
        content: "Accent colour, JSON backup and restore, and app information.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { db, accent, setAccent, replaceDatabase, resetDatabase } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported");
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      replaceDatabase(normalize(parsed));
      toast.success("Backup restored");
    } catch {
      toast.error("That file isn't a valid backup");
    }
  };

  return (
    <AppShell title="Settings" subtitle="Everything stays on this device">
      <h2 className="mb-2.5 text-sm font-bold">Accent colour</h2>
      <div className="grid grid-cols-2 gap-3">
        {(["blue", "green"] as Accent[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setAccent(option)}
            className={cn(
              "card-surface flex items-center gap-3 p-4 text-left",
              accent === option && "border-primary",
            )}
          >
            <span
              className="size-6 rounded-full"
              style={{
                backgroundColor: option === "blue" ? "oklch(0.556 0.203 260.5)" : "oklch(0.6 0.145 163)",
              }}
            />
            <span className="text-sm font-semibold capitalize">{option}</span>
          </button>
        ))}
      </div>

      <h2 className="mt-7 mb-2.5 text-sm font-bold">Backup</h2>
      <div className="card-surface divide-y divide-border">
        <Row
          title="Export database"
          hint="Save all semesters, courses, notes and reminders as JSON."
          action={
            <Button variant="outline" className="h-10" onClick={exportJson}>
              <Download className="size-4" /> Export
            </Button>
          }
        />
        <Row
          title="Import database"
          hint="Replaces current data with a JSON backup."
          action={
            <>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importJson(file);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" className="h-10" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> Import
              </Button>
            </>
          }
        />
        <Row
          title="Reset all data"
          hint="Clears everything stored on this device."
          action={
            <Button
              variant="outline"
              className="h-10"
              onClick={() => {
                resetDatabase();
                toast.success("All data cleared");
              }}
            >
              <RotateCcw className="size-4" /> Reset
            </Button>
          }
        />
      </div>

      <h2 className="mt-7 mb-2.5 text-sm font-bold">About</h2>
      <div className="card-surface p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Study Progress Tracker</p>
        <p className="mt-1">
          A minimal offline tracker for semesters, courses, lectures, labs, notes and reminders. Data is stored
          locally in this browser — nothing is uploaded.
        </p>
        <p className="mt-2 text-xs">
          {db.semesters.length} semesters · {db.courses.length} courses · {db.items.length} lectures & labs ·{" "}
          {db.reminders.length} reminders
        </p>
      </div>
    </AppShell>
  );
}

function Row({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {action}
    </div>
  );
}
