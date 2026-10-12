# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chattr — a Next.js app that simulates text message conversations for language learners. Users pick a scenario (e.g., making plans with a friend, messaging a rental host), choose a language (English, Italian, Spanish, French, German, Chinese, Japanese, Korean), and chat with an AI character powered by the Gemini API (model set by `GEMINI_MODEL`; see Environment). See `README.md` for setup.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm test         # Vitest, single run (npm run test:watch to watch)
```

Tests live next to the code as `src/**/*.test.ts(x)` (see `vitest.config.ts`).

## Environment

Requires these env vars in `.env.local`:

- `GEMINI_API_KEY` — Google Gemini API key (used by all AI routes)
- `DATABASE_URL` — Neon Postgres **pooled** connection string
- `BETTER_AUTH_SECRET` — signing secret for sessions
- `BETTER_AUTH_URL` — base URL for auth callbacks

Optional:

- `TRUSTED_ORIGINS` — comma-separated extra auth origins (e.g. custom domains). `lib/auth.ts`
  always trusts `BETTER_AUTH_URL`, `https://$VERCEL_URL` and localhost:3000/3001.
- `ALLOW_SIGNUP` — set to exactly `true` to open self-registration at `/auth/signup`. Anything
  else (unset, `false`, typos) keeps the app invite-only, which is the default because every
  chat turn bills the Gemini key. Server-side only, checked by `lib/signup.ts`; never a
  `NEXT_PUBLIC_` variable.

Optional model overrides, read in `lib/gemini.ts`. With none set, every route runs
`gemini-2.5-flash` with thinking off.

- `GEMINI_MODEL` — chat, hints, translate. Default `gemini-2.5-flash`. Use
  `scripts/compare-corrections.ts` to compare correction quality before switching models.
- `GEMINI_FEEDBACK_MODEL` — report card. Default `gemini-2.5-flash`.
- `GEMINI_FEEDBACK_THINKING` — `minimal|low|medium|high` for the report card. Unset means thinking off.
  Non-2.5 models, or any thinking, raise the output caps (chat 1024, report card 8192),
  because thinking tokens count against `maxOutputTokens`.

Database commands:

```bash
npm run db:push     # Push schema changes (drizzle.config.ts loads .env.local unless DATABASE_URL is already set)
npm run db:studio   # Drizzle Studio
```

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, `@google/genai` SDK, Neon Postgres + Drizzle ORM, Better Auth.

**The app lives entirely in `src/`.** Path alias `@/*` maps to `src/*`.

### State Management

React Context providers wrap the app (in `layout.tsx`):

- **AuthContext** (`lib/auth-context.tsx`) — Better Auth session state (`AppUser`) and signOut method.
- **SettingsContext** (`lib/settings-context.tsx`) — All app settings (difficulty, darkMode, fontSize, correctionMode, hintMode, language, soundEnabled, uiInTargetLanguage, slangReference). Persisted to `localStorage` under key `appSettings`.
- **WordBankContext** (`lib/word-bank-context.tsx`) — the signed-in user's saved words, backed by `/api/word-bank`.

### Multi-Language System

- `lib/languages.ts` — Defines 8 languages (English, Italian, Spanish, French, German, Chinese (Mandarin), Japanese, Korean), each with id, native name, placeholder text, and translation prompt.
- `lib/scenarios.ts` — 8 scenario templates × 8 languages = 64 generated scenarios (ids like `making-plans-italian`). Each has a localized title, character name, starter message, and system prompt.
- `lib/translations.ts` + `hooks/useTranslation.ts` — Custom i18n system (no external library). The `useTranslation()` hook returns a `t(key)` function. When `uiInTargetLanguage` is enabled in settings, UI strings render in the learner's selected language.
- `lib/slang-reference.ts` — per-language texting slang shown in the slang panel.

### API Routes

All Gemini-backed routes call `requireAuth()` first.

- `POST /api/chat` — Main conversation endpoint. Dynamically builds system prompt from scenario + difficulty + correction/hint instructions. Returns `{ reply, correction?, hints?, conversationEnded? }`.
- `POST /api/translate` — Translates a message to English via Gemini.
- `POST /api/hints` — Generates 3 suggested response hints for beginner mode.
- `POST /api/report-card` — End-of-conversation feedback (uses `GEMINI_FEEDBACK_MODEL`).
- `GET|POST|DELETE /api/word-bank` — List, save and delete the user's saved words.
- `POST /api/debug-log` — Unauthenticated client failure reporting (allowlisted events only; see `docs/diagnostics.md`).

### AI Response Parsing

Gemini responses embed structured markers that get parsed server-side:
- `📝` prefix — Grammar correction (attached to the user's message)
- `💡` prefix — Hint suggestions
- `[CONV_END]` — Signals natural conversation conclusion (e.g., transaction complete)

### Core Client Logic

- `hooks/useChat.ts` — Central chat hook managing message state, API calls, translation toggling, hint chips, report card, and conversation-end detection.
- `hooks/useDemoChat.ts` + `lib/demo-scripts.ts` — Guest mode: one scripted "Making Plans" conversation per language, no Gemini calls.
- `app/chat/[scenarioId]/page.tsx` — Chat page with PhoneFrame, ChatArea, hints, conversation-end card (report card, transcript export), word bank and slang panels, and InputBar.
- `app/page.tsx` — Home page with scenario grid. Guests see only the demo scenario as playable.
- `app/word-bank/page.tsx` — Searchable list of saved words.

### Auth Flow

Better Auth with email + password, configured in `lib/auth.ts` and served from
`/api/auth/[...all]`. Sign-in page at `/auth/login`: a server `page.tsx` wrapping the client
`LoginForm`, which shows a "Sign up" link when sign-up is allowed and an invitation-only note
otherwise.

Sign-up is controlled by `ALLOW_SIGNUP` via `isSignupAllowed()` in `lib/signup.ts` (only the
exact value `true` enables it):

- `app/auth/signup/page.tsx` is a server component that calls `await connection()` so it
  reads the variable per request, then renders `SignupForm` (name, email, password via
  `authClient.signUp.email`; Better Auth signs the user in, then it goes to `/`) or the
  `InviteOnlyNotice`.
- `lib/auth.ts` sets `emailAndPassword.disableSignUp` from the same check, so the API matches
  the page. That value is read once at server start; changing the variable needs a restart
  or redeploy, not a rebuild.

- `lib/auth-client.ts` — browser client (`authClient.useSession()`, `signIn.email`,
  `signUp.email`, `signOut`).
- `lib/auth-context.tsx` — wraps the session as `AppUser` (`id`, `email`, `name`, `image`).
- `lib/auth-guard.ts` — `requireAuth()` for API routes, returning `{ user } | NextResponse`.

Sessions use a 5-minute signed cookie cache, so a page load does not hit the database every
time — this matters on Neon, where each query wakes the compute and bills CU-hours. The
tradeoff is that a revoked session can stay live for up to that window.

**Provisioning accounts** (the only way in when sign-up is off; no admin UI, no email
provider — send passwords out of band):

```bash
npx tsx --env-file=.env.local scripts/create-user.ts <email> "<name>" [password]
npx tsx --env-file=.env.local scripts/reset-password.ts <email> [password]
```

Both hash with Better Auth's own hasher and print a generated password once.

There is **no Next.js middleware**; Better Auth validates sessions server-side on read.

### Database

Neon Postgres via Drizzle ORM. Schema in `lib/db/schema.ts`, client in `lib/db/index.ts`
(connects lazily so builds work without a reachable database).

Tables: Better Auth's `user` / `session` / `account` / `verification`, plus `word_bank` and
`debug_events`. There is no RLS — access is server-side only, and every `word_bank` query is
scoped by the session's user id. **That scoping is the only thing preventing cross-user
reads.**

## Key Behaviors

- **Hint mode** only activates when `difficulty === "beginner"` AND `hintMode` is enabled.
- **Correction mode** appends grammar correction instructions to the system prompt; corrections are parsed from `📝` markers and attached to the user's message.
- **`[CONV_END]`** marker signals conversation conclusion; shows the report card and transcript export.
- **Translation toggle** — Tapping an assistant message fetches and toggles its English translation (cached after first fetch).
- **Word bank** — Long-pressing a message opens a popup to look up and save words.
- **Device modes** — Phone (390px) and Tablet (820px) frame sizes, toggled in header and persisted to localStorage.
- **Sound effects** — Optional send/receive sounds from `/public/sounds/`.
- **English language** is a special case: translation, word bank and slang features are disabled, scenarios use English prompts.
