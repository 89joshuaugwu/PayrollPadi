# PayrollPadi — ARCHITECTURE.md

This explains **how the pieces fit together** — what talks to what, and why it's built this way. Read `HANDOVER.md` first if you haven't; this file goes one level deeper.

---

## 1. The One-Paragraph Version

PayrollPadi is a **Next.js website** (both the pages you see and the server logic live in the same codebase) that talks to **Firebase** for login and data storage, **Gmail** for sending emails, and optionally **Cloudinary** for storing PDF copies of payslips. There is no separate backend server — Next.js's own "API routes" (small server-only functions) act as the backend whenever something sensitive needs to happen, like creating a new staff login or sending a payslip.

---

## 2. Tech Stack — What Each Piece Is For

| Piece | What it does here |
|---|---|
| **Next.js 16 (App Router)** | The framework. Renders every page, and also hosts the server-only "API routes" under `app/api/`. |
| **TypeScript** | JavaScript with type-checking — catches a whole category of bugs (wrong data shapes) before the code ever runs. |
| **Tailwind CSS v4** | Styling, written directly in the markup as utility classes rather than separate CSS files. |
| **Firebase Authentication** | Handles login/logout and issues secure login tokens. Email + password only, no public signup. |
| **Cloud Firestore** | The database. A NoSQL "document" database — data lives in collections of JSON-like documents rather than SQL tables with rows. |
| **Firebase Admin SDK** | A privileged, server-only version of the Firebase toolkit, used inside API routes to do things a normal logged-in user isn't allowed to do directly (like creating a brand-new staff login). |
| **Nodemailer + Gmail SMTP** | Sends payslip and welcome emails. |
| **jsPDF** | Generates the payslip PDF, entirely on the server, from scratch — no external PDF service. |
| **Cloudinary** | Optional. If configured, a copy of each payslip PDF is stored there for later re-download. If not configured, everything still works — email delivery is the primary channel. |
| **Recharts** | Draws the charts on the Reports page. |
| **Framer Motion** | Small animations (page transitions, progress bars, the landing page). |
| **Vercel** | Where the website is actually hosted/deployed. |

---

## 3. Two Different Ways The App Talks To The Database

This is the single most important architectural decision to understand.

### Pattern A — Direct client reads (fast, real-time, most of the app)

Most pages read data **directly from Firestore in the browser**, using Firebase's client-side SDK (`lib/firebase.ts`). No server round-trip needed — the browser talks straight to Firebase. This is what makes things like the notification bell update instantly without refreshing the page (`onSnapshot` — a live subscription, not a one-time fetch).

**Security for this pattern is entirely enforced by `firestore.rules`.** The website's own code doesn't decide who can read what — Firebase itself checks every single request against the rules file before deciding whether to hand back data. Even if someone bypassed the website entirely and talked to Firestore directly with browser dev tools, the rules would still apply.

### Pattern B — Server API routes (privileged actions, sensitive writes)

Anything that needs elevated privilege or should never run in an untrusted browser goes through a **server API route** (`app/api/.../route.ts`) instead:

- Creating a new employee's login (needs the Admin SDK's power to create Auth accounts — a normal logged-in user can never do this, by design)
- Running or locking payroll (needs to write many documents atomically and trigger emails)
- Sending any email (SMTP credentials must never reach the browser)
- Generating a PDF for download (keeps the PDF-building code server-side)

Every one of these routes **re-verifies who's calling** before doing anything: it takes the caller's Firebase login token from the request, verifies it's genuine, looks up their role, and only proceeds if they're allowed. See `lib/firebase-admin.ts`'s `requireAdmin()` function — this is called at the top of every admin-only route.

**Why two patterns instead of one?** Pattern A is fast and simple for anything a security rule can express cleanly (e.g. "you can only read your own payslip"). Pattern B is used only where Pattern A genuinely can't do the job — either because it needs the Admin SDK's extra power, or because the action has side effects (sending an email) that don't belong in a client-side read.

---

## 4. Request Flow, Step By Step

**A normal page load (e.g. viewing My Payslips):**
```
Browser → Firebase Auth (already logged in, has a token)
Browser → Firestore, directly, using that token
Firestore → checks firestore.rules → returns data or denies it
Browser → renders the page with whatever came back
```

**A privileged action (e.g. running payroll):**
```
Browser → collects the current Firebase ID token
Browser → POST /api/payroll/run (Next.js API route), token attached as a header
API route → verifies the token is real (Firebase Admin SDK)
API route → looks up the caller's role in Firestore
API route → if admin: proceeds, using the Admin SDK's elevated Firestore access
API route → returns a JSON response
Browser → shows a success/error toast based on the response
```

---

## 5. Rendering Strategy

Almost every page under `/dashboard/*` is a **Client Component** (marked `"use client"` at the top of the file) rather than a Server Component. This is deliberate: these pages depend on the browser's live Firebase Auth state and live Firestore subscriptions, neither of which make sense to compute once on a server and ship as static HTML.

Because of this, `app/(dashboard)/layout.tsx` sets `export const dynamic = "force-dynamic"`, telling Next.js not to try to pre-build these pages at deploy time — they're always rendered fresh, per visitor, in the browser.

The **public pages** (`/`, `/auth/login`) are lighter-weight and don't need this — the landing page in particular is intentionally simple enough to render fine either way.

---

## 6. Component Layering

The `components/` folder follows a small-to-large structure, borrowed from a common UI pattern called "atomic design":

```
ui/         → Smallest reusable pieces. A Button doesn't know or care what page it's on.
             Examples: Button, Input, Modal, ConfirmDialog, StatusBadge, DataTable, LogoIcon.

molecules/  → A few ui/ pieces combined into one meaningful unit.
             Example: SalaryStructureForm is four Input fields plus a live-computed total.

organisms/  → A full feature, built from molecules/ and ui/, usually mapped to a big chunk of one page.
             Example: PayrollRunWizard is the entire multi-step "run payroll" flow.

shells/     → The page frame itself — sidebar, top bar, mobile bottom tabs (AppShell),
             or the simpler public-page wrapper (PublicShell).
```

A page file under `app/` is usually thin — it fetches data (or subscribes to it) and hands it to one big `organisms/` component to actually render.

---

## 7. Deployment Topology

```
                    ┌─────────────────────┐
                    │       Vercel         │
                    │  (hosts everything   │
                    │   under app/)        │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                  │
             ▼                 ▼                  ▼
      Firebase Auth      Cloud Firestore     Firebase Admin SDK
      (login/logout)     (the database)      (used only inside
                                               server API routes)
             │                 │
             └────────┬────────┘
                       │
              firestore.rules
              (the real gatekeeper —
               lives in Firebase Console,
               not deployed with the code)

      Gmail SMTP  ←── used by API routes to send payslip/welcome emails
      Cloudinary  ←── optional, used by API routes to store payslip PDFs
```

**Important:** `firestore.rules` is **not** part of the Next.js deployment. It has to be manually pasted into Firebase Console → Firestore → Rules → Publish every time it changes. Vercel redeploying the website does **not** update Firestore's rules — this is the single most common "I pushed a fix but it's still broken" trap on this project (see `HANDOVER.md` Section 6 for a real example of exactly this happening).

---

## 8. Environment Variables — Two Trust Levels

| Prefix | Visibility | Examples |
|---|---|---|
| `NEXT_PUBLIC_*` | Bundled into the browser JavaScript — anyone can see these in dev tools. Only ever put non-secret config here (Firebase's public client config is designed to be public; it's meaningless without the security rules behind it). | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_APP_URL` |
| everything else | Server-only. Never sent to the browser. | `FIREBASE_ADMIN_PRIVATE_KEY`, `GMAIL_SMTP_APP_PASSWORD`, `CLOUDINARY_API_SECRET` |

If you're ever unsure whether something is safe to prefix `NEXT_PUBLIC_`, the rule of thumb is: **if leaking it to a competitor or a malicious visitor would be bad, it must never have that prefix.**
