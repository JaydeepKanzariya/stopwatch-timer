# Stopwatch & Timer App

[![CI](https://github.com/JaydeepKanzariya/stopwatch-timer/actions/workflows/ci.yml/badge.svg)](https://github.com/JaydeepKanzariya/stopwatch-timer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-teal.svg)](LICENSE)

An accessible, installable **Stopwatch and Countdown Timer** built with React, TypeScript (strict), Vite, and Tailwind CSS v4. It tracks time from timestamps rather than counting ticks, so it stays accurate in a background tab, and a running clock survives a page reload.

**Live:** https://stopwatch-timer-rust.vercel.app/

| Stopwatch with laps (desktop, light)                                                  | Timer running (mobile, dark)                                                                                                  |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ![Stopwatch with three laps and fastest and slowest highlighted](public/og-image.png) | <img src="docs/timer-mobile-dark.png" alt="25 minute countdown timer with progress ring on a phone in dark mode" width="260"> |

---

## Overview

**Stopwatch & Timer** combines a centisecond-precision stopwatch (split/lap tracking with fastest and slowest detection) and a customisable countdown timer (quick presets, SVG progress ring, audio, vibration and notification alerts) in a responsive, keyboard-accessible single-page app. Both clocks keep their state across tab switches, background throttling, page reloads, and even going offline.

---

## Features

- **Accessible two-mode tab control:** WAI-ARIA `tablist` / `tab` / `tabpanel` with roving `tabIndex` and `ArrowLeft` / `ArrowRight` / `Home` / `End` navigation.
- **Both clocks run independently:** switching tabs never resets a running or paused clock. Tab indicators and `document.title` show what is running, and the title shows `Time's up` when the timer finishes, so it is visible from another browser tab.
- **Stopwatch:**
  - `MM:SS.cc`, expanding to `HH:MM:SS.cc` from one hour (`tabular-nums`).
  - Start / Pause / Resume, Lap, and Reset with proper disabled states.
  - Scrollable newest-first lap table (lap number, split, total). From 3 laps the **Fastest** (`↑`) and **Slowest** (`↓`) laps get a badge, so meaning never relies on colour alone.
- **Countdown timer:**
  - Custom **Hours** (`0–99`), **Minutes** (`0–59`) and **Seconds** (`0–59`) with sanitising and clamping of typed and pasted values.
  - Inline error (`aria-describedby`) and a disabled Start when the total is `0`.
  - Presets: **1, 5, 10 and 25 min**.
  - SVG progress ring (`role="progressbar"`) and a ceiling-rounded `HH:MM:SS` display that shows `00:00:01` until the timer really reaches `0`.
  - Finish alert: `Time's up`, a polite screen-reader announcement (`Timer finished`), a synthesised Web Audio chime, and vibration on phones. Sound has a **Mute** toggle.
  - Optional **Notify me** toggle: sends a browser notification when the timer ends while you are in another tab or window.
  - After it finishes, the inputs unlock right away so you can set the next countdown.
- **Survives a reload:** a running or paused stopwatch (with its laps) and timer are restored, including the time that passed while the page was closed. See [Surviving a reload](#surviving-a-reload).
- **Installable and offline:** a web manifest and a small service worker let you install it and keep using it without a connection.
- **Resilient:** an error boundary shows a recovery screen (with a "Reset saved data" option) instead of a blank page.
- **Responsive and theme-aware:** 360 px phones to desktop, system light and dark mode (`prefers-color-scheme`), and `prefers-reduced-motion`.

---

## Tech Stack

| Area          | Tools                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| App           | React 19 (`<StrictMode>`), TypeScript (strict, no `any`), Vite, Tailwind CSS v4 |
| Unit and UI   | Vitest, React Testing Library, jsdom                                            |
| End-to-end    | Playwright (desktop and mobile Chromium), axe-core accessibility scans          |
| Code quality  | Oxlint, Prettier, EditorConfig, `noUncheckedIndexedAccess`                      |
| CI and deploy | GitHub Actions, Dependabot, Vercel (security headers in `vercel.json`)          |

There are no UI, state, or date libraries: just React state, `useReducer`, and custom hooks.

---

## Getting Started

Requires Node.js 20 or newer (`.nvmrc` pins 24).

```bash
npm i                  # install
npm run dev            # dev server
npm run build          # type-check + production build
npm run preview        # serve the production build (with the production security headers)
```

| Script                 | What it does                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `npm run lint`         | Oxlint                                                                                       |
| `npm run format`       | Format everything with Prettier                                                              |
| `npm run format:check` | Fail if anything is not formatted (used in CI)                                               |
| `npm test`             | Unit and component tests (Vitest)                                                            |
| `npm run test:e2e`     | End-to-end tests against the production build (first run: `npx playwright install chromium`) |
| `npm run check`        | Lint, format check, type-check and unit tests in one go                                      |

---

## Testing

- **Pure logic:** time formatting, rounding and clamping (including `99:59:59`), lap extremes, snapshot conversion and validation, and storage fallbacks (blocked or corrupt `localStorage`).
- **Reducers:** stopwatch and timer state machines, including pause at the exact end time and a fresh `runId` per run.
- **Components and the whole app** (fake timers, `<StrictMode>`): start/pause/resume, laps, tab switching, the timer finishing exactly once even on the other tab, mute, notifications only when the page is hidden, keyboard shortcuts, restoring after a reload, and the error boundary.
- **End-to-end** (real Chromium, desktop and Pixel 7): a clean console with no CSP violations, security headers, the manifest and icons, axe accessibility scans in light and dark mode, real reload persistence, offline mode, keyboard-only use, and the 360 px layout with 44 px tap targets.

CI runs everything on every push and pull request.

---

## Project Structure

```text
src/
  main.tsx                  # Root: StrictMode, error boundary, service worker registration
  App.tsx                   # Header, tabs, owns both clocks, live region, footer
  index.css                 # @import "tailwindcss"; plus base styles
  types.ts                  # Shared types, including the stopwatch and timer state
  lib/
    time.ts                 # Pure time formatting, conversion and input clamping
    laps.ts                 # Pure fastest/slowest lap calculation
    persist.ts              # Pure reload snapshots: perf-clock <-> wall-clock conversion and validation
    storage.ts              # Safe localStorage access with runtime validation
    beep.ts                 # Web Audio chime and gesture unlock
    notify.ts               # Notification permission, display and vibration helpers
  hooks/
    useNow.ts               # Ticking timestamp while a clock is active
    useStopwatch.ts         # Reducer + derived stopwatch state, saved on change
    useTimer.ts             # Reducer + derived countdown state, saved on change, finish handler
    useDocumentTitle.ts     # Throttled (~1 Hz) document.title
    useShortcuts.ts         # Global Space / R / L shortcuts
  components/
    Tabs, TimeDisplay, Controls, Stopwatch, LapList, Timer,
    TimerInputs, TimerAlerts, Presets, ProgressRing, ErrorBoundary
  test/setup.ts             # Vitest setup (jest-dom, cleanup)
  *.test.ts(x)              # Unit and component tests next to the code they cover
e2e/app.spec.ts             # Playwright end-to-end and accessibility tests
public/
  sw.js                     # Offline support (precaches the shell and hashed assets)
  manifest.webmanifest      # Install metadata
  icons/, apple-touch-icon.png, og-image.png
vercel.json                 # Security headers (also used by `npm run preview`)
.github/                    # CI workflow and Dependabot
```

---

## How Timekeeping Works

Neither clock counts ticks. The stopwatch stores `accumulatedMs` and a `startedAt` timestamp from `performance.now()`, and derives elapsed time on every render as `accumulatedMs + (running ? now - startedAt : 0)`. The timer stores an absolute `endAt = now + remainingMs` while running and derives remaining time as `Math.max(0, endAt - now)`, storing `remainingMs` on pause and recomputing `endAt` on resume.

A shared `useNow` hook only triggers re-renders. It uses `requestAnimationFrame` while the page is visible and a 40 ms interval while it is hidden (when browsers pause animation frames), switching on `visibilitychange`. Because the values come from timestamps, there is no drift even when the tab is throttled.

---

## Surviving a reload

`performance.now()` restarts from zero on every page load, so it cannot be saved directly. When a clock changes state (start, pause, lap, finish, reset), a snapshot is written to `localStorage` using **wall-clock** anchors: a stopwatch stores when the current run started, a timer stores when it ends. On load, `lib/persist.ts` converts those back into `performance.now()` values, so the time spent away is counted.

- A timer that ran out while the page was closed shows `Time's up` and does **not** beep on load.
- A system clock that moved backwards counts as zero time away.
- Corrupt, missing, or tampered data is validated and ignored, and the app starts fresh. `localStorage` being blocked is fine too.
- Snapshots are written on user actions only, never once per frame.

---

## Alerts when you are not looking

Browsers may block or delay audio in background tabs, so the timer does not rely on sound alone:

- the page title changes to `Time's up · Timer`,
- phones vibrate (unless muted),
- with **Notify me** on, a notification is shown, but only if the page is hidden (an on-screen page already shows the alert). The permission prompt appears only when you click the toggle.

---

## Installable and offline

`public/sw.js` precaches the app shell and every hashed asset on install, serves static files cache-first, and serves pages network-first so a new deploy shows up immediately (falling back to the cached shell when offline). It is registered in production builds only, so the dev server never serves stale files. To drop old caches after changing it, bump `VERSION` in `sw.js`.

---

## Security

`vercel.json` sets a strict Content-Security-Policy (`default-src 'self'`, no inline scripts or styles, no third-party origins), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`. `npm run preview` serves the same headers, and the end-to-end tests fail on any CSP violation.

---

## Keyboard Shortcuts

Shortcuts are ignored while typing in a text field. `Space` is also ignored when a button, tab, or link has focus, because the browser already activates the focused control. `R` and `L` keep working after you click a button. Key repeats and modifier combinations are ignored.

| Key            | Action                                                                |
| -------------- | --------------------------------------------------------------------- |
| `Space`        | Start, Pause, or Resume the active tab's clock (prevents page scroll) |
| `R`            | Reset the active tab's clock                                          |
| `L`            | Record a lap (Stopwatch tab, while running)                           |
| `←` / `→`      | Switch between Stopwatch and Timer when focus is on the tab bar       |
| `Home` / `End` | Jump to the first or last tab when focus is on the tab bar            |

---

## Decisions

- **Default timer duration:** with nothing saved (or storage unavailable or corrupt), the timer defaults to **5 minutes** with sound on.
- **Input sanitising:** `-5` becomes `0`, `1.5` becomes `1`, `abc` becomes `0`, and `999` clamps to `99` (hours) or `59` (minutes, seconds).
- **Fastest / slowest laps:** shown from 3 laps, and only when the splits are not all identical.
- **Document title throttling:** the title updates at most once per second and prefers the timer when both clocks run.
- **Editing after finish:** inputs and presets unlock as soon as the timer finishes, and any edit returns it to idle. Each fresh run has its own `runId`, so the chime plays exactly once per run, even under `<StrictMode>`.
- **Mute also silences vibration.** Notifications are a separate opt-in.
- **Two tabs of the app share saved state** but are not synchronised live: the last change wins.
- **Service worker cache grows slowly:** old hashed files stay cached until `VERSION` is bumped. They are a few KB per deploy.

---

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:

1. **verify:** lint, format check, type-check, unit and component tests, production build.
2. **e2e:** Playwright against the production build (the report is uploaded if it fails).

Dependabot proposes weekly updates for npm packages and GitHub Actions.

---

## Deployment (Vercel)

| Setting          | Value            |
| ---------------- | ---------------- |
| Framework Preset | **Vite**         |
| Root Directory   | `./` (repo root) |
| Build Command    | `npm run build`  |
| Output Directory | `dist`           |
| Install Command  | `npm install`    |
| Node.js version  | latest LTS       |

No environment variables are needed. Headers come from `vercel.json`.

---

## License

[MIT](LICENSE) © 2026 Jaydeep Kanzariya
