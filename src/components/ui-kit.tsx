import { cn } from "@/lib/utils";

export function ProgressRing({
  percent,
  size = 172,
  stroke = 14,
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string | undefined;
  sublabel?: string | undefined;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tabular-nums">{percent}%</span>
        {label ? <span className="mt-1 text-xs font-semibold">{label}</span> : null}
        {sublabel ? (
          <span className="text-[11px] text-muted-foreground">{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string | undefined;
}) {
  return (
    <div className="card-surface p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function DifficultyChip({ difficulty }: { difficulty: "easy" | "medium" | "hard" }) {
  const map = {
    easy: "border-border text-muted-foreground",
    medium: "border-primary/30 bg-primary-soft text-primary",
    hard: "border-foreground bg-foreground text-background",
  } as const;
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        map[difficulty],
      )}
    >
      {difficulty}
    </span>
  );
}

export function TagChip({ name }: { name: string }) {
  return (
    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {name}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string | undefined }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
