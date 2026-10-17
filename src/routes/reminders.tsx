import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reminderDateTime, upcomingReminders } from "@/lib/db";
import { useStore } from "@/lib/store";
import type { RepeatMode } from "@/lib/types";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders · Study Progress Tracker" },
      {
        name: "description",
        content: "Create study reminders with repeat options and optional browser notifications, stored on device.",
      },
      { property: "og:title", content: "Reminders · Study Progress Tracker" },
      {
        property: "og:description",
        content: "Study reminders with daily, weekly, monthly or yearly repeats.",
      },
    ],
  }),
  component: RemindersPage,
});

const REPEATS: RepeatMode[] = ["never", "daily", "weekly", "monthly", "yearly"];

function RemindersPage() {
  const { db, deleteReminder } = useStore();
  const reminders = upcomingReminders(db);

  return (
    <AppShell
      title="Reminders"
      subtitle={`${db.reminders.length} saved`}
      action={<ReminderDialog />}
    >
      <div className="space-y-3">
        {reminders.map((r) => (
          <div key={r.id} className="card-surface p-4">
            <div className="flex items-start gap-3">
              {r.notificationEnabled ? (
                <Bell className="mt-0.5 size-4 text-primary" />
              ) : (
                <BellOff className="mt-0.5 size-4 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(reminderDateTime(r.date, r.time), "EEE d MMM yyyy · HH:mm")}
                  {r.repeat !== "never" ? ` · ${r.repeat}` : ""}
                </p>
                {r.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Delete reminder"
                onClick={() => deleteReminder(r.id)}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {!reminders.length ? (
          <EmptyState title="No reminders" hint="Add one with the + button." />
        ) : null}
      </div>
    </AppShell>
  );
}

function ReminderDialog() {
  const { saveReminder } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("19:00");
  const [repeat, setRepeat] = useState<RepeatMode>("never");
  const [notify, setNotify] = useState(true);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Reminder needs a title");
      return;
    }
    const when = reminderDateTime(date, time);
    if (!Number.isFinite(when)) {
      toast.error("Enter a valid date and time");
      return;
    }
    if (repeat === "never" && when < Date.now()) {
      toast.error("Pick a date and time in the future");
      return;
    }
    if (notify && typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    saveReminder({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      repeat,
      notificationEnabled: notify,
    });
    toast.success("Reminder created");
    setTitle("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="size-10 shrink-0 rounded-full" aria-label="Add reminder">
          <Plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>New reminder</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="r-title">Title</Label>
            <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label htmlFor="r-desc">Description</Label>
            <Textarea
              id="r-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="r-date">Date</Label>
              <Input
                id="r-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="r-time">Time</Label>
              <Input
                id="r-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
          </div>
          <div>
            <Label>Repeat</Label>
            <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatMode)}>
              <SelectTrigger className="mt-1.5 h-11 w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPEATS.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex tap-target items-center justify-between rounded-xl border border-border px-3.5">
            <span className="text-sm font-semibold">Notification</span>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </label>
        </div>
        <DialogFooter>
          <Button className="h-11 w-full" onClick={submit}>
            Create reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
