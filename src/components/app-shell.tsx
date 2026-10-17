import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarClock,
  GraduationCap,
  LayoutDashboard,
  Monitor,
  Search,
  Settings,
  Smartphone,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useViewMode } from "@/lib/view-mode";

const NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/semesters", label: "Study", icon: GraduationCap },
  { to: "/search", label: "Search", icon: Search },
  { to: "/reminders", label: "Reminders", icon: CalendarClock },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function ViewToggle() {
  const [mode, setMode] = useViewMode();
  return (
    <div
      role="group"
      aria-label="Layout view"
      className="flex shrink-0 items-center rounded-full border border-border bg-muted p-0.5"
    >
      {(
        [
          { value: "desktop", label: "Desktop view", icon: Monitor },
          { value: "mobile", label: "Mobile view", icon: Smartphone },
        ] as const
      ).map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          aria-label={label}
          aria-pressed={mode === value}
          title={label}
          className={cn(
            "flex size-8 items-center justify-center rounded-full transition-colors",
            mode === value
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  action,
  back,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  action?: ReactNode | undefined;
  back?: { to: string; params?: Record<string, string> | undefined } | undefined;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mode] = useViewMode();
  const desktop = mode === "desktop";
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  const header = (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className={cn("mx-auto flex items-center gap-3 py-4", desktop ? "max-w-7xl px-8" : "px-5")}>
        {back ? (
          <Link
            to={back.to}
            params={back.params ?? {}}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className={cn("truncate font-bold", desktop ? "text-2xl" : "text-lg")}>{title}</h1>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
        <ViewToggle />
      </div>
    </header>
  );

  if (desktop) {
    return (
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="flex items-center gap-2 px-5 py-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="size-5" />
            </div>
            <span className="font-bold">Study Tracker</span>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          {header}
          <main className="mx-auto max-w-7xl px-8 py-8">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="relative mx-auto min-h-screen max-w-md bg-background pb-24 shadow-sm">
        {header}
        <main className="px-5 py-5">{children}</main>
        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border bg-background">
          <div className="flex items-stretch">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
