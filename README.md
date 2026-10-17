# Study Progress Tracker

A minimal, offline study tracker for university students. Plan semesters and courses, tick off
lectures and labs as you go, keep notes and tags against each one, set reminders, and watch your
progress add up.

Everything runs in the browser and stores data locally on your device — no account, no server, no
API keys, and nothing is uploaded anywhere. It is also a Progressive Web App, so you can install it
on your desktop and open it in its own window like a normal application.

- **Live app:** https://mkam-study-tracker.lovable.app
- **Built with:** [Lovable](https://lovable.dev)
- **Original product spec:** [docs/SPEC.md](docs/SPEC.md)

---

## Contents

- [What it does](#what-it-does)
- [Requirements](#requirements)
- [Install and run](#install-and-run)
- [Configuration](#configuration)
- [Installing it as a desktop app](#installing-it-as-a-desktop-app)
- [Project layout](#project-layout)
- [Available commands](#available-commands)
- [Backing up your data](#backing-up-your-data)
- [Deploying it yourself](#deploying-it-yourself)
- [Troubleshooting](#troubleshooting)

---

## What it does

| Area | Details |
| --- | --- |
| **Dashboard** | Overall progress, lecture and lab totals, today's tasks, upcoming reminder, recent activity |
| **Semesters** | Add, rename, delete and reorder semesters |
| **Courses** | Add courses with lecture and lab counts, see progress bars, search and sort |
| **Lectures & labs** | Mark complete, set difficulty (easy / medium / hard), add tags, folder path, estimated duration and completion date |
| **Notes** | Unlimited notes per lecture or lab, with search |
| **Tags** | Exam, Important, Need Revision, Assignment, Quiz, Project, plus any custom tags you add |
| **Reminders** | Title, description, date, time, repeat (never / daily / weekly / monthly / yearly), optional browser notification |
| **Search** | One global search across courses, lectures, labs, tags, notes and semesters |
| **Statistics** | Most and least completed course, hardest course, note and item totals, study percentage |
| **Settings** | Accent colour, JSON export and import, reset all data |
| **Views** | A Desktop / Mobile layout toggle in the top-right of every page |

### How progress is calculated

- **Course:** completed items ÷ total items (lectures and labs together), as a percentage.
- **Semester:** the average of the course percentages inside it.
- **Dashboard:** the average of the semester percentages, counting only semesters that have courses.

Everything recalculates the moment you tick something off.

### Pages

| URL | Page |
| --- | --- |
| `/` | Dashboard |
| `/semesters` | Semester list |
| `/semesters/:semesterId` | Courses in one semester |
| `/courses/:courseId` | Course details |
| `/items/:itemId` | One lecture or lab |
| `/search` | Global search |
| `/reminders` | Reminders |
| `/statistics` | Statistics |
| `/settings` | Settings |

---

## Requirements

- **Node.js 20.19 or newer** — 22 LTS is what this project is developed against.
  (Check with `node -v`. If you need it, [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).)
- **A package manager** — `bun`, `npm`, `pnpm` or `yarn`. A `bun.lock` file is committed, so `bun`
  gives you the exact dependency versions this project was last verified with.
- **A modern browser** — Chrome, Edge, Firefox or Safari. Chrome or Edge is needed if you want the
  desktop install.

There is no database, no backend service, and nothing to configure before the first run.

---

## Install and run

```sh
git clone <this-repository-url>
cd <repository-name>

bun install        # or: npm install
bun run dev        # or: npm run dev
```

Open **http://localhost:8080** — that is the address the dev server listens on.

The first time you open it, the app fills itself with sample semesters, courses and reminders so
you are not staring at an empty screen. To start from nothing, go to **Settings → Reset all data**.

To check a production build locally:

```sh
bun run build      # writes the deployable app to .output/
bun run preview    # serves the built app at http://localhost:4173
```

---

## Configuration

**There are no environment variables and no API keys.** The app does not talk to any server, so
there is no `.env` file to create and nothing to sign up for.

Configuration happens in the running app:

| Setting | Where | Stored as |
| --- | --- | --- |
| Accent colour (blue or green) | Settings → Accent colour | `localStorage` key `study-progress-tracker:accent` |
| Desktop or Mobile layout | The toggle in the top-right of every page | `localStorage` key `view-mode` |
| Your study data | Everywhere else | `localStorage` key `study-progress-tracker:v1` |

On a first visit the layout picks Desktop on wide screens and Mobile on narrow ones. The toggle
overrides that and the choice is remembered.

### Changing things in code

| I want to change… | Edit |
| --- | --- |
| Colours, spacing, radius, fonts | `src/styles.css` — the accent is switched with `data-accent` on `<html>` |
| The sample data a fresh install shows | `seedDatabase()` in `src/lib/db.ts` |
| The app name, icon or theme colour | `public/manifest.webmanifest`, plus `icon-192.png`, `icon-512.png`, `favicon.png` and `apple-touch-icon.png` in `public/` |
| Progress maths | `src/lib/db.ts` (`courseProgress`, `semesterPercent`, `overallPercent`) |
| Which pages exist | Files in `src/routes/` — file names define URLs |

The browser font is Plus Jakarta Sans, loaded from Google Fonts in `src/routes/__root.tsx`. If you
need the app to work fully offline on a machine with no internet, self-host that font and drop the
`<link>` tags.

---

## Installing it as a desktop app

The app declares itself installable in `public/manifest.webmanifest` (`"display": "standalone"`),
with a 192px and a 512px book icon.

1. Open the app over **HTTPS** — either the live URL above or a copy you deployed yourself.
   Installation will not work from the `localhost` dev server or from an editor preview.
2. In **Chrome or Edge**, click the **Install** icon at the right end of the address bar
   (or the browser menu → *Install app*).
3. The tracker opens in its own window with its own taskbar or dock entry, separate from your
   browser tabs.

Your study data does **not** carry over between the browser tab and the installed window — they
each keep their own local copy. Export a backup from one and import it in the other if you want
both to match.

---

## Project layout

```text
src/
  routes/            one file per page; the file name is the URL
    __root.tsx       shared layout, page <head>, fonts, manifest link
    index.tsx        dashboard
    semesters.*      semester list and a single semester's courses
    courses.$courseId.tsx
    items.$itemId.tsx
    search.tsx  reminders.tsx  statistics.tsx  settings.tsx
  components/
    app-shell.tsx    sidebar / bottom nav, header, Desktop-Mobile toggle
    ui-kit.tsx       shared buttons, cards, chips
  lib/
    db.ts            storage, sample data, normalising, progress maths
    store.tsx        the one place that writes to the database
    types.ts         Semester, Course, StudyItem, Reminder, Tag, Activity
    view-mode.ts     Desktop / Mobile layout preference
  test/              vitest tests
public/
  manifest.webmanifest, icons, favicon, robots.txt
docs/SPEC.md         the original product specification
vite.config.ts       build setup (TanStack Start + Nitro)
```

Stack: **React 19**, **TanStack Start** (file-based routing and server functions), **Tailwind CSS v4**,
**Radix UI** primitives, **Recharts** for charts, **Vitest** for tests.

---

## Available commands

| Command | Does |
| --- | --- |
| `bun run dev` | Start the dev server with hot reload at http://localhost:8080 |
| `bun run build` | Production build into `.output/` |
| `bun run build:dev` | Production build in development mode (unminified, for debugging) |
| `bun run preview` | Serve the built app at http://localhost:4173 |
| `bun run lint` | ESLint over the whole project |
| `bun run format` | Prettier write-over of the project |
| `bunx vitest run` | Run the test suite (there is no `test` script in package.json yet) |

Swap `bun run` for `npm run` if you installed with npm.

---

## Backing up your data

Data lives in your browser's `localStorage`, so it survives restarts but is tied to one browser on
one device — and clearing your browser data will delete it.

- **Export:** Settings → Backup → **Export**. Downloads a single JSON file with everything in it.
- **Import:** Settings → Backup → **Import**. Replaces the current data with the file's contents.
- **Reset:** Settings → Backup → **Reset**. Deletes everything on this device.

Export a backup before clearing browser data, switching browser, or moving to a new machine.

---

## Deploying it yourself

`bun run build` produces a Nitro bundle in `.output/`, defaulting to the Cloudflare Workers target.
Serve or deploy that folder with any host that runs the output — Cloudflare Workers is the default,
and a plain Node server works for the Node build. Configuration and environment variables then live
in your hosting dashboard; this app needs none of them.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Dev server won't start, port busy | Something else is using port 8080. Stop it, or start with `bun run dev -- --port 3000`. |
| The app looks empty | It only seeds sample data when there is no saved data yet. Settings → Reset all data, then reload. |
| Your data disappeared | It is stored per browser and per origin. Check you are on the same browser and URL, or re-import a JSON backup. |
| Reminders don't notify | Notifications only fire while the app is open, and need permission. Allow notifications for the site, and check the reminder has notifications on. |
| Install button missing | Use Chrome or Edge over HTTPS, on the deployed site — not `localhost` or an editor preview. |
| Blank page after a code change | Hard-refresh (Ctrl+Shift+R, or Cmd+Shift+R on a Mac) to drop the cached copy. |
| TypeScript complains about `routeTree.gen.ts` | It is generated. Restart `bun run dev` so it regenerates after you add or rename a route file. |

---

## About this repository

This project is kept in two-way sync with Lovable. Commits pushed to the synced branch show up back
in the Lovable editor, and work done there is committed here. Please avoid rewriting published git
history — force-pushing, or rebasing, amending or squashing commits that are already pushed — as
that can cost you project history.
