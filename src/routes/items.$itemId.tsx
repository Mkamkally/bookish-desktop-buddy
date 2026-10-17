import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Difficulty } from "@/lib/types";

export const Route = createFileRoute("/items/$itemId")({
  head: () => ({
    meta: [
      { title: "Lecture details · Study Progress Tracker" },
      {
        name: "description",
        content:
          "Edit a lecture or lab: completion, difficulty, tags, linked folder, estimated duration and unlimited notes.",
      },
      { property: "og:title", content: "Lecture details · Study Progress Tracker" },
      {
        property: "og:description",
        content: "Completion status, difficulty, tags, folder link and notes for one lecture or lab.",
      },
    ],
  }),
  component: ItemDetail,
});

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function ItemDetail() {
  const { itemId } = Route.useParams();
  const { db, updateItem, toggleItem, addNote, updateNote, deleteNote, addTag, toggleItemTag } = useStore();
  const [newTag, setNewTag] = useState("");
  const [draft, setDraft] = useState("");

  const item = db.items.find((i) => i.id === itemId);
  if (!item) {
    return (
      <AppShell title="Item" back={{ to: "/semesters" }}>
        <EmptyState title="Item not found" />
      </AppShell>
    );
  }
  const course = db.courses.find((c) => c.id === item.courseId);

  const pickFolder = async () => {
    const picker = (window as unknown as {
      showDirectoryPicker?: () => Promise<{ name: string }>;
    }).showDirectoryPicker;
    if (!picker) {
      toast.info("Folder picking needs a Chromium browser — type the path instead.");
      return;
    }
    try {
      const handle = await picker();
      updateItem(item.id, { folderPath: handle.name });
      toast.success("Folder linked");
    } catch {
      /* cancelled */
    }
  };

  return (
    <AppShell
      title={item.title}
      subtitle={`${course?.name ?? ""} · ${item.kind === "lecture" ? "Lecture" : "Lab"} ${item.number}`}
      back={{ to: "/courses/$courseId", params: { courseId: item.courseId } }}
    >
      <div className="card-surface space-y-4 p-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={item.title}
            onChange={(e) => updateItem(item.id, { title: e.target.value })}
            className="mt-1.5 h-11"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="number">Number</Label>
            <Input
              id="number"
              type="number"
              min={1}
              value={item.number}
              onChange={(e) => updateItem(item.id, { number: Math.max(1, Number(e.target.value) || 1) })}
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              min={0}
              value={item.estimatedDuration}
              onChange={(e) =>
                updateItem(item.id, { estimatedDuration: Math.max(0, Number(e.target.value) || 0) })
              }
              className="mt-1.5 h-11"
            />
          </div>
        </div>

        <label className="flex tap-target items-center gap-3 rounded-xl border border-border px-3.5">
          <Checkbox checked={item.completed} onCheckedChange={() => toggleItem(item.id)} className="size-5" />
          <span className="flex-1 text-sm font-semibold">Completed</span>
          <span className="text-xs text-muted-foreground">
            {item.completionDate ? format(item.completionDate, "d MMM yyyy") : "—"}
          </span>
        </label>

        <div>
          <Label>Difficulty</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => updateItem(item.id, { difficulty: d })}
                className={cn(
                  "tap-target rounded-xl border text-sm font-semibold capitalize",
                  item.difficulty === d
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="folder">Attachments folder</Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="folder"
              value={item.folderPath}
              onChange={(e) => updateItem(item.id, { folderPath: e.target.value })}
              placeholder="Semester 4/Algorithm Analysis/Lecture 03"
              className="h-11"
            />
            <Button variant="outline" className="h-11 shrink-0" onClick={pickFolder}>
              <FolderOpen className="size-4" /> Pick
            </Button>
          </div>
          <Button
            variant="secondary"
            className="mt-2 h-11 w-full"
            onClick={() => {
              if (!item.folderPath.trim()) {
                toast.error("Add a folder path first");
                return;
              }
              navigator.clipboard?.writeText(item.folderPath);
              toast.success("Folder path copied — paste it in your file manager");
            }}
          >
            Open folder
          </Button>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {db.tags.map((tag) => {
              const active = item.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleItemTag(item.id, tag.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold",
                    active ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="New tag"
              className="h-11"
            />
            <Button
              variant="outline"
              className="h-11 shrink-0"
              onClick={() => {
                if (!newTag.trim()) return;
                const id = addTag(newTag);
                toggleItemTag(item.id, id);
                setNewTag("");
              }}
            >
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-7 mb-2.5 text-sm font-bold">Notes ({item.notes.length})</h2>
      <div className="card-surface p-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder={"Write a note…\n- bullet points work\n- multiple paragraphs too"}
        />
        <Button
          className="mt-2 h-11 w-full"
          onClick={() => {
            if (!draft.trim()) return;
            addNote(item.id, draft);
            setDraft("");
            toast.success("Note saved");
          }}
        >
          Add note
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {item.notes.map((note) => (
          <div key={note.id} className="card-surface p-4">
            <Textarea
              defaultValue={note.text}
              rows={Math.min(10, note.text.split("\n").length + 1)}
              onBlur={(e) => updateNote(item.id, note.id, e.target.value)}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Updated {format(note.updatedAt, "d MMM yyyy, HH:mm")} · auto-saves on blur
              </span>
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => deleteNote(item.id, note.id)}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {!item.notes.length ? <EmptyState title="No notes yet" /> : null}
      </div>
    </AppShell>
  );
}
