# Semester Wrapped Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From chat ("how's my semester looking?"), open a modal that scans the user's primary Google Calendar with live progress, then shows where their time went, their busiest past weeks, the upcoming crunch weeks (deadlines, grade at stake, free hours), and a short AI summary that only uses computed numbers.

**Architecture:**
- **Chat:** a chat tool, `openWrapped`, tells the frontend to open `WrappedModal`. The modal calls `POST /api/insights`, which does the work.
- **Metrics:** computed by one pure function, `computeInsights`. It grows a little each milestone, but its signature never changes.
- **Scanning:** starts as one sequential fetch (Milestone 1) and becomes parallel monthly windows through a worker pool with retry and streamed progress (Milestone 2).
- **Categories** (Milestone 3), **syllabus deadlines** (Milestone 4) and the **AI summary** (Milestone 5) are each added as their own slice.

**Tech Stack:** Backend (`backend/`, repo `CalPal_Chat_BE`): Express 5, LangChain/LangGraph + Gemini (`withStructuredOutput`), zod 3, googleapis, `node --test`. Frontend (repo root): React 18 (CRA), plain CSS bars (no chart library).

**Spec:** Agreed in conversation on 2026-11-07:
- **Primary calendar only.** The range is today −120 days to today +120 days, in the user's time zone.
- **Looking back:** hours by category, scheduled hours per week, the top 3 busiest past weeks, and the heaviest weekday.
- **Looking ahead:** a weekly deadline load from syllabus-tagged events, grade at stake per course, free hours per week (Mon–Fri 9am–6pm minus busy time), and the top 3 crunch weeks.
- **Categories:** `class`, `study`, `work`, `meeting`, `social`, `exercise`, `personal`, `other`.
- **Deadline load:** exam 5, project 4, quiz 2, homework 1, lecture 0, other 0. Exams and projects add 40% of their load to the week before. Weeks start on Monday.
- **The LLM** classifies titles and writes the summary. It never computes numbers.
- **Concurrency:** at most 4 calendar fetches and 3 Gemini calls at once. Up to 3 retries on transient errors (429, 5xx, Google 403 `rateLimitExceeded`/`userRateLimitExceeded`), with exponential backoff and jitter.
- **Out of scope:** "Plan my study time", other calendars, caching classifications, decision models.

## Global Constraints

- **Local only.** Work on branch `feat/semester-wrapped` in both repos, commit locally after each milestone, and **never push**.
- **Stop after every milestone** so the user can test it locally before the next one starts.
- Run locally: the backend with `npm start` in `backend/` (port 8000), and the frontend with `npm start` and `REACT_APP_API_URL=http://localhost:8000` in `.env`. Check what `.env` holds before changing it, and tell the user what changed.
- No new dependencies. Google `extendedProperties` values are strings, and `gradeWeight: ""` means unknown.
- Commit style: `Feat: ...`, `Fix: ...`. No Claude attribution.

## The one stable interface

```
computeInsights(events, { today: "YYYY-MM-DD", timeZone, labels = new Map() }) -> {
  weeks: [{ weekStart, isPast, isCurrent, scheduledHours,            // M1
            freeHours, load, gradeAtStake: { [course]: number },     // M4
            deadlines: [{ course, type, title, date, gradeWeight }] }],
  busiestPastWeeks: weekStart[],   // M1, top 3 by scheduledHours
  heaviestWeekday: string | null,  // M1
  hoursByCategory: { [category]: number },   // M3, past events only
  crunchWeeks: weekStart[],        // M4, current+future, load > 0, top 3 by load, ties → fewer freeHours
}
```
Fields from later milestones are simply missing until their milestone. `scheduledHours` is the total length of the week's timed events with overlaps merged (two overlapping 10–12 meetings count as 2h, not 4h). All-day events add no hours. Weeks run Monday to Sunday, cover the whole range with no gaps, and are in ascending order.

## Review Focus

1. **An event that spans two monthly windows** is counted once. Covered by an M2 test (dedupe by `id`).
2. **Gemini leaves out or mislabels titles**: those become `other`, and the run doesn't fail. Covered by an M3 test.
3. **The modal is closed mid-scan**: the server stops starting new work. Covered by an M2 pool abort test plus a manual check.
4. **An empty calendar or no syllabus tags**: every section still renders with a short message, with no `NaN`. Covered by empty-input tests in M1 and M4.
5. **Overlapping and all-day events**: hours aren't double-counted and free hours never go negative. Covered by M1 and M4 tests.

---

## Milestone 1: Walking skeleton (chat → modal → weekly hours)

**You can try:** ask "how's my semester looking?" or tap **Semester Wrapped**. A modal shows a bar per week of scheduled hours (past weeks dimmed, current week outlined), your 3 busiest weeks so far, and your heaviest weekday. It loads in one go, with a spinner and no live progress yet.

**Files:**
- Modify: `backend/controllers/calendarController.js`. Extract the repeated token lookup into `getGoogleCalendar(userEmail) -> calendar` (it throws the same 403 `AppError`), and use it in the existing handlers.
- Create: `backend/utils/insights.js`, `backend/test/insights.test.js`
- Create: `backend/controllers/insightsController.js`, `backend/routes/insights.js`. Modify: `backend/routes/index.js` (mount `/insights`)
- Modify: `backend/src/agent.js` (the `openWrapped` tool and a system prompt line), `backend/utils/chatReply.js` (the type list in the comment)
- Create: `src/components/Home/WrappedModal.js`, `src/components/Home/WrappedModal.css`. Modify: `src/components/Home/Home.js`

- [ ] **Step 1: Set up.** Create branch `feat/semester-wrapped` in both repos. Check the frontend `.env` for `REACT_APP_API_URL`.
- [ ] **Step 2: Write the failing tests** in `test/insights.test.js` (`today = "2026-11-04"`, `timeZone = "America/Los_Angeles"`; events have `dateTime` with a `-08:00` offset):
  - `groups by Monday weeks`: an event on Sunday 2026-11-08 at 20:00 → week `2026-11-02`.
  - `overlaps count once`: two 10:00–12:00 events on the same day → that week's `scheduledHours` is 2.
  - `all-day events add no hours`.
  - `fills empty weeks`: events in weeks 11-02 and 11-23 → 4 weeks.
  - `busiest past weeks are past only, top 3`.
  - `heaviest weekday`: most hours fall on Tuesday → `"Tuesday"`.
  - `empty calendar`: `weeks: []`, `busiestPastWeeks: []`, `heaviestWeekday: null`.
- [ ] **Step 3: Run** `cd backend && npm test`. Expected: the new tests FAIL.
- [ ] **Step 4: Implement the M1 fields of `computeInsights`.** Read the local date as `dateTime.slice(0, 10)`, and do week math on `YYYY-MM-DD` strings with `Date.UTC`.
- [ ] **Step 5: Run** `npm test`. Expected: all pass.
- [ ] **Step 6: Add the endpoint.** `POST /api/insights` (auth + `aiRateLimit`), with body `{ timeZone }` validated by `isValidTimeZone` (400 otherwise). It works out `today` and the ±120 day range in the user's time zone, then calls `events.list({ calendarId: "primary", timeMin, timeMax, timeZone, singleEvents: true, maxResults: 2500 })`, following `nextPageToken` one page at a time. It drops `cancelled` events and returns `res.json({ insights: computeInsights(events, { today, timeZone }) })`.
- [ ] **Step 7: Add the chat tool.** `openWrapped` (no args, `responseFormat: "content_and_artifact"`, artifact `{ type: "wrapped" }`), plus the prompt line: "- For questions about their semester, workload, busy weeks, where their time goes, or a 'wrapped', use openWrapped, then reply in one short sentence saying their semester overview is opening."
- [ ] **Step 8: Add the modal.** `WrappedModal({ session, onClose })` posts to `/api/insights` and shows a spinner, then the results (or an error with Retry).
  - It uses the existing `.modal-overlay` / `.modal-content`, and the content scrolls (`max-height: 85vh; overflow-y: auto`).
  - **Weekly bars:** height = `scheduledHours / max`, past weeks dimmed, the current week outlined. Each bar is a `<button aria-label="Week of Nov 2: 31 hours">`.
  - **"Busiest weeks so far"** cards and a "heaviest day" line.
  - **In `Home.js`:** `else if (reply.type === "wrapped") setShowWrapped(true)`, render the modal, and add a 4th quick action, "Semester Wrapped", that sends "How's my semester looking?".
- [ ] **Step 9: Verify locally.** `npm test` passes and eslint adds no new warnings for the touched frontend files. Check in the browser that the modal opens from chat and from the quick action, that one week's hours roughly match Google Calendar, and that "hi" opens no modal.
- [ ] **Step 10: Commit locally** in both repos: `Feat: Semester Wrapped skeleton with weekly hours from chat`. **Stop for the user to test.**

## Milestone 2: Parallel scan with live progress

**You can try:** the modal shows "Scanning your calendar… 5/9 months" with a progress bar, and the scan is faster. Closing the modal mid-scan stops the backend (visible in the backend log).

**Files:**
- Create: `backend/utils/pool.js`, `backend/test/pool.test.js`, `backend/utils/calendarScan.js`, `backend/test/calendarScan.test.js`
- Modify: `backend/controllers/insightsController.js`, `src/components/Home/WrappedModal.js`

**Interfaces:**
- `runPool(items, limit, worker, { signal } = {}) -> Promise<Array<{ ok: true, value } | { ok: false, error }>>`: results in input order, at most `limit` `worker(item, index)` calls running at once, and items not yet started when `signal.aborted` are skipped (`ok: false`).
- `withRetry(fn, { retries = 3, baseMs = 500, isRetryable = isTransient, sleep } = {})`: before retry n it waits `baseMs * 2 ** n * (0.5 + Math.random() / 2)`.
- `isTransient(err)`: status (`err.code ?? err.status ?? err.response?.status`) is 429 or 5xx, or it's a 403 with `err.errors?.[0]?.reason` of `rateLimitExceeded`/`userRateLimitExceeded`.
- `monthWindows(timeMin, timeMax) -> [{ timeMin, timeMax }]`: cut at UTC month boundaries, covering the range exactly.
- `scanCalendar(calendar, { timeMin, timeMax, timeZone, signal, onWindowDone, sleep }) -> Promise<Event[]>`: windows through `runPool` with a limit of 4, each page call wrapped in `withRetry`, following pages, dedupe by `id`, drop `cancelled`. It calls `onWindowDone({ done, total })` after each window and throws if a window fails after its retries.
- **NDJSON response** (`Content-Type: application/x-ndjson`), one object per line: `{ type: "progress", stage, done, total, message }` | `{ type: "insights", insights }` | `{ type: "error", error }`.

- [ ] **Step 1: Write the failing pool tests:**
  - `never runs more than limit at once` (max in flight is 3 with `limit = 3` over 10 workers)
  - `keeps input order` (workers finish in reverse order)
  - `collects errors per item`
  - `abort skips items not yet started`
  - `retries transient errors with growing delays` (429 twice then ok; 2 recorded delays, the second larger, both within jitter bounds)
  - `does not retry 400` (called once)
  - `gives up after retries` (503 always: called 4 times, then rethrows)
- [ ] **Step 2: Write the failing scan tests** (with a fake `calendar.events.list`):
  - `monthWindows covers the range with no gaps` (`2026-01-15` → `2026-03-10` gives 3 windows that chain end to start)
  - `follows pages`
  - `dedupes events returned by two windows`
  - `drops cancelled events`
  - `retries a 429 page`
  - `reports progress once per window`
- [ ] **Step 3: Run** `npm test`. Expected: the new tests FAIL.
- [ ] **Step 4: Implement `pool.js` and `calendarScan.js`.** Run `npm test`. Expected: all pass.
- [ ] **Step 5: Switch the controller to streaming.**
  - Validate first (a 400 is still sent as JSON).
  - Then set the NDJSON header, create an `AbortController` aborted on `res.on("close")` before the response finishes, and run `scanCalendar`, writing a `progress` line (`stage: "scan"`) per window.
  - Write the `insights` line and end.
  - An error after streaming has started → write an `error` line with a safe message and end.
- [ ] **Step 6: Switch the modal to the stream.** `fetch` with an `AbortController` (aborted on close/unmount). Read `response.body.getReader()` + `TextDecoder`, buffer incomplete lines, and parse each complete line. Show the progress bar and stage message until `insights` arrives.
- [ ] **Step 7: Verify locally.**
  - `npm test` passes.
  - `curl -N -X POST localhost:8000/api/insights -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"timeZone":"America/Los_Angeles"}'` prints progress lines one at a time.
  - In the browser, progress updates live. Closing the modal mid-scan makes the log show the scan was aborted, with no further page fetches.
- [ ] **Step 8: Commit locally:** `Feat: scan the calendar in parallel and stream progress`. **Stop for the user to test.**

## Milestone 3: Where your time went (parallel classification)

**You can try:** a "Where your time went" section with hours per category (class, study, work, ...), and a "Sorting 412 events…" progress stage.

**Files:**
- Create: `backend/utils/classify.js`, `backend/test/classify.test.js`
- Modify: `backend/utils/insights.js` + tests, `backend/controllers/insightsController.js`, `src/components/Home/WrappedModal.js`

**Interfaces:**
- `CATEGORIES = ["class", "study", "work", "meeting", "social", "exercise", "personal", "other"]`
- `classifyTitles(titles, classifyChunk, { chunkSize = 100, limit = 3, signal, onChunkDone, sleep }) -> Promise<Map<string, Category>>`: dedupe, split into chunks, run through `runPool` with each chunk call in `withRetry`. Invalid labels, titles left out, and chunks that fail all become `other`.
- `geminiClassifyChunk(chunk) -> Promise<Array<{ title, category }>>`: `withStructuredOutput(z.object({ labels: z.array(z.object({ title: z.string(), category: z.enum(CATEGORIES) })) }))`, prompted to label how each event's time is spent and to return every title exactly once.

- [ ] **Step 1: Write the failing tests:**
  - `dedupes before classifying`
  - `chunks by size` (250 titles → 3 calls)
  - `missing or invalid labels become other`
  - `a failed chunk becomes other`
  - In `insights.test.js`: `hours by category are past only` (uses `labels`; unlabelled titles count as `other`)
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement `classify.js` and `hoursByCategory`.** Run `npm test`. Expected: all pass.
- [ ] **Step 4: Wire it in.** In the controller, classify the titles of timed events after scanning (`stage: "classify"` progress per chunk) and pass `labels` to `computeInsights`. In the modal, add the "Where your time went" horizontal bars and the classify progress message.
- [ ] **Step 5: Verify locally.** `npm test` passes. In the browser, the categories look sensible for 10 events you spot-check.
- [ ] **Step 6: Commit locally:** `Feat: show where your time went with parallel Gemini classification`. **Stop for the user to test.**

## Milestone 4: Syllabus deadlines and crunch weeks

**You can try:** re-upload a syllabus and add its events, then open Wrapped. Upcoming weeks are colored by deadline load, and "Coming up" cards show the crunch weeks with their deadlines, grade at stake ("20% of CS 101") and free hours. Clicking a week's bar lists its deadlines.

**Files:**
- Modify: `backend/utils/eventSchema.js` + `test/eventSchema.test.js`, `backend/src/parseSyllabus.js`
- Modify: `src/components/FileUpload/FileUpload.js` (`handleExtractEvents`)
- Modify: `backend/utils/insights.js` + tests, `backend/controllers/insightsController.js` (skip classifying tagged events), `src/components/Home/WrappedModal.js`

**Interfaces:**
- Parsed syllabus events carry `extendedProperties.private = { calpal: "syllabus", course, type, gradeWeight }`, with `type` one of `exam | quiz | project | homework | lecture | other`.
- In `computeInsights`:
  - **Deadlines** are tagged `exam/quiz/project/homework`. They fill `deadlines`, `load` and `gradeAtStake`, and add no hours.
  - **Tagged `lecture`** counts as `class` hours.
  - **`freeHours`** comes from `findFreeSlots` (`utils/freeTime.js`) over Mon–Fri 9:00–18:00 windows built with `localToEpochMs`, with timed non-deadline events as busy and a minimum gap of 30 minutes.

- [ ] **Step 1: Write the failing tests:**
  - `eventSchema.test.js`: `keeps private extended properties` (a `shared` key is dropped)
  - `insights.test.js`:
    - `exam spills prep into the week before` (exam 2026-11-18 → load 5 in week 11-16, 2 in week 11-09)
    - `Sunday deadline stays in its week`
    - `grade at stake sums per course and skips empty weights` (`{ "CS 101": 20, "Chem 1A": 25 }`, no `NaN`)
    - `duplicate deadlines count once`
    - `deadlines add no hours; lectures count as class`
    - `overlapping meetings don't make free hours negative` (two overlapping 10–12 meetings on a Monday → 7h free that day)
    - `crunch weeks are current or future only, at most 3`
    - `no tagged events` → `crunchWeeks: []`, and every week has `load: 0`
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Update the schema.** Add `extendedProperties: z.object({ private: z.record(z.string().max(1024)) }).optional()` to `CreateEventSchema`.
- [ ] **Step 4: Update the parser.** Add `type` and `gradeWeight` (nullable number; "split a shared bucket like 'Homework 20%' evenly; null if not stated") to the parser schema, plus the prompt line: "List every exam, quiz, project and homework as its own event; use RRULE only for lectures, labs and office hours." Map them into `extendedProperties.private` with `calpal` and `course = courseInfo.courseName || "Unknown course"`.
- [ ] **Step 5: Course name fallback.** The frontend sends `courseName || selectedFile.name.replace(/\.pdf$/i, "")`.
- [ ] **Step 6: Implement the M4 fields of `computeInsights`.** Run `npm test`. Expected: all pass.
- [ ] **Step 7: Update the modal.** Current and future bars show `load` colored green < 4, orange 4–8, red > 8. Add the "Coming up" crunch cards and click-a-week deadline details, plus an empty message: "Upload a syllabus to see upcoming deadlines".
- [ ] **Step 8: Verify locally.** Upload a syllabus that has a grading section and add all its events. In Wrapped, one crunch week's deadlines and grade at stake match the syllabus.
- [ ] **Step 9: Commit locally** in both repos: `Feat: show upcoming crunch weeks from syllabus deadlines`. **Stop for the user to test.**

## Milestone 5: AI summary

**You can try:** 2–3 sentences at the top of the modal, like "You've spent 38% of your time in class… Nov 16 is your toughest week ahead: CS 101 midterm and Chem project, 45% of CS riding on it, with only 6 free hours."

**Files:**
- Modify: `backend/controllers/insightsController.js`, `src/components/Home/WrappedModal.js`

- [ ] **Step 1: Add the summary step.** After the `insights` line, write a `progress` line (`stage: "summary"`). Call `withStructuredOutput(z.object({ summary: z.string() }))` with a compact view of the insights (hours by category, busiest weeks, crunch weeks with their deadlines and free hours) and the instruction: "2-3 sentences to a student about their semester so far and what's coming. Use only these numbers, dates and courses." Write a `{ type: "summary", summary }` line. If it fails, log it and skip the line.
- [ ] **Step 2: Show it in the modal.** The summary appears at the top when it arrives. The rest of the results show before it.
- [ ] **Step 3: Verify locally.** Across 3 runs, every number, date and course in the summary appears in the insights.
- [ ] **Step 4: Commit locally:** `Feat: summarize the semester with Gemini from computed insights`. **Stop for the user to test.**

---

**After local testing:** the user decides when to push. Before pushing, rebase both branches on their remote default branch and rerun `npm test` in both repos.
