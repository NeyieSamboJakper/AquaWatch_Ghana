# AquaWatch Ghana — Project Briefing

*A citizen-to-authority water reporting platform*

A working outline for your walkthrough: what to say, what to click, and why each part exists. Eleven sections, built to be presented in order or lifted individually into slides.

**Regions covered:** 16 / 16 · **Stack:** Next.js · Supabase · **Format:** installable PWA

---

## Running Order

1. [The problem](#01--the-problem)
2. [The solution](#02--the-solution)
3. [Live demo route](#03--live-demo-route)
4. [Member experience](#04--member-experience)
5. [Admin console](#05--admin-console)
6. [Under the hood](#06--under-the-hood)
7. [Security model](#07--security-model)
8. [Offline & installable](#08--offline--installable)
9. [Hard problems solved](#09--hard-problems-solved)
10. [What's next](#10--whats-next)
11. [Close](#11--close)

---

## 01 — The Problem

### Water issues in Ghana go unreported because there's no direct line to who can fix them

A contaminated borehole or a three-week supply outage is common knowledge in a community long before any authority hears about it — if they ever do.

- Reporting today means a phone call or a physical visit to an office — slow, undocumented, and easy to lose track of.
- Agencies have no aggregated view of where problems are concentrated across Ghana's 16 regions.
- Communities have no way to see whether anyone is actually responding to what they've raised.

> **Say:** *"Right now, a water problem is only as visible as the loudest phone call. We built a platform that makes it visible by default."*

---

## 02 — The Solution

### One platform: citizens report, everyone sees the pattern, authorities close the loop

AquaWatch Ghana is a community reporting and response platform — any resident can file a water issue in under a minute, and government or NGO staff get a dedicated console to triage and resolve it.

- **Report** — title, description, issue type, severity, region/district/community, GPS, an optional photo, and an anonymous option.
- **See** — every report plots on a live map alongside regional water-quality scores; a public feed is searchable and filterable by anyone.
- **Respond** — admins triage from one console; the reporter gets an official reply and a notification the moment one lands.

---

## 03 — Live Demo Route

### A seven-step walkthrough that touches every layer

Suggested click-path — each step below is demo-able live rather than described.

1. Home page → point out the live counters (reports submitted, resolved, critical alerts).
2. **Report an Issue** → fill the form, attach a photo, submit — show the toast confirmation.
3. **Water Map** → the new pin appears; click it to show the popup detail.
4. Sign in as a member → **Dashboard** → charts by severity and issue type, "My Reports."
5. Switch to an admin account → **Admin → Reports** → filter, then send an official reply.
6. Switch back to the member → reload → the reply toast appears with a "View" action.
7. **Profile** → edit region/name, scroll full report history.

> **Show:** Keep two browser windows open (one signed in as admin, one as the member) so step 6 lands live instead of as a screenshot.

---

## 04 — Member Experience

### Everything a resident needs, nothing they have to learn

- Submit reports with photo upload, GPS coordinates, and an anonymous toggle for sensitive reports.
- Browse and filter the full public report feed; upvote issues that matter to your community.
- A personal dashboard with platform-wide analytics plus a "My Reports" view.
- Profile page for editing name/region and reviewing full submission history.
- Toast notifications the moment an admin replies to your report — with a direct link to it.
- Installable as a phone or desktop app; still opens (with a friendly offline page) with no connection.
- Full account recovery: forgot-password email flow, no support ticket required.

---

## 05 — Admin Console

### One screen for triage, response, and access control

- **Reports tab** — search by title, filter by region/severity/status/type, paginate, resolve, delete, or open an official reply thread.
- **Users tab** — promote or demote any member between community and admin with a confirmation step; an admin can't accidentally demote themselves.
- Live stat cards (total, needs review, resolved, registered users) update the moment an action changes them.
- Reports submitted by staff carry a visible "AquaWatch Staff" marker, so the feed stays honest about who filed what.

---

## 06 — Under the Hood

### A modern, boring-on-purpose stack

Boring is a feature here — every piece is chosen for reliability at community scale, not novelty.

`Next.js 16 · App Router` `React 19` `TypeScript` `Tailwind CSS 4` `Supabase — Postgres` `Supabase Auth` `Supabase Storage` `Row-Level Security` `Leaflet maps` `Recharts` `Radix / shadcn UI` `Sonner toasts`

---

## 07 — Security Model

### Access rules live in the database, not just the app

Every table enforces its own Row-Level Security policy — so even a direct API call, bypassing the UI entirely, is still governed by the same rules.

- Two roles only: **community** and **admin** — deliberately simple, nothing to misconfigure.
- Role changes are admin-only and self-escalation-proof — a member cannot promote themselves, even by calling the API directly.
- Photo uploads are scoped to a user's own storage folder; only admins can remove someone else's.
- Password reset runs through Supabase's verified email-link flow — no secrets handled by the app itself.

---

## 08 — Offline & Installable

### Built for patchy connectivity, not just fast wifi

- Full PWA manifest and icon set — "Add to Home Screen" on Android and iOS, installable on desktop.
- A service worker caches the app shell and previously visited pages, with a friendly offline screen for anything not yet cached.
- Live data (reports, dashboards) is deliberately never cached offline — better an honest "reconnect" than a stale water-quality reading.

---

## 09 — Hard Problems Solved

### Three bugs worth knowing the story of

For a technical audience — each of these is a real defect that was found and fixed during development, not a hypothetical.

**Infinite recursion in access control**
An admin-check policy that queried its own table triggered Postgres into recursing on itself. Fixed with a `SECURITY DEFINER` function that checks admin status without re-entering the policy it's guarding.

**Silent self-promotion risk**
The original policy let any member update their own role column with no restriction. Closed with a trigger that only permits role changes from an existing admin.

**A caching bug that looked like a router bug**
The offline service worker was caching Next.js's internal navigation requests, serving stale data after sign-in and sign-out. Traced from the symptom back to the cache layer and scoped the worker to leave framework requests untouched.

---

## 10 — What's Next

### Where this goes from a working platform to a deployed one

- Real-time notifications via Supabase Realtime, replacing the current on-load check.
- Photo thumbnails surfaced directly on report cards, not just the detail page.
- Regional trend analytics for government and NGO partners.
- An SMS/USSD reporting channel for communities without reliable smartphone data.

---

## 11 — Close

### Clean water is a visibility problem first

AquaWatch Ghana exists to make sure the moment a community knows about a water issue is the same moment the people who can fix it do too. Questions welcome.

---

*AquaWatch Ghana — Project Briefing · 11 sections · demo-ready*
