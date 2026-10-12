# Diagnostics

Two layers, so a failure can be investigated without anyone copying logs by hand.

## Layer 1 — runtime logs (live view)

`console.log` / `console.error` from the API routes land in your host's runtime logs
(on Vercel, the project's runtime logs) automatically. Every Gemini call emits one
greppable line:

```
[gemini] chat model=gemini-2.5-flash budget=512 finishReason=STOP prompt=1204 thoughts=0 candidates=87 total=1291 chars=214
```

Labels are `chat`, `hints`, and `translate`. `thoughts=0` confirms thinking is disabled;
`thoughts` climbing toward `budget` with `candidates=0` is the empty-reply failure.

**Retention is the catch.** Vercel keeps runtime logs for 1 hour on the Hobby plan and 1 day
on Pro; longer retention is a paid add-on. This layer only helps if it is looked at while the
problem is happening.

## Layer 2 — `debug_events` table (durable)

Written to **on failure only**, never on the happy path. Beyond keeping the table
readable, this matters on Neon: every write wakes the compute and bills against the
monthly CU-hour allowance, so logging all traffic would hold the database awake
continuously.

| Column | Notes |
|---|---|
| `level` | `error` \| `warn` \| `info` |
| `event` | e.g. `chat.empty_reply`, `client.chat_no_reply` |
| `source` | `server` \| `client` |
| `route`, `environment`, `user_id` | context |
| `detail` | jsonb — token counts, status codes, scenario id, flags |

### Events

| Event | Emitted by |
|---|---|
| `chat.empty_reply` | `/api/chat` when the model returns no text |
| `chat.exception` | `/api/chat` catch block |
| `hints.exception` | `/api/hints` catch block |
| `translate.exception` | `/api/translate` catch block |
| `report_card.exception` | `/api/report-card` catch block |
| `client.chat_no_reply` | `useChat` — any non-200 or empty reply |
| `client.chat_network_error` | `useChat` — fetch threw |
| `client.translate_failed` | `useChat` — translation fetch threw |
| `client.report_card_failed` | `useChat` — report card failed |

### Privacy

**No message content is ever stored.** Token counts, scenario ids, and status codes are
enough to diagnose, and learner conversations stay out of the log. The client endpoint
enforces this structurally: `sanitize()` in `src/app/api/debug-log/route.ts` keeps only
bounded scalars and drops nested objects and arrays outright.

### Security model

There is **no public database surface** — no REST API, no publishable key. The database is
reachable only through `DATABASE_URL`, which is server-side only.

The client-side reporting endpoint (`/api/debug-log`) is deliberately
**unauthenticated**: the most valuable client event to capture is an expired session,
which by definition has no user, so requiring auth would discard exactly the case worth
logging. It is bounded in application code:

- an allowlist of four permitted event names
- `sanitize()` keeps only bounded scalars and drops nested objects and arrays, which also
  prevents message content from being smuggled in
- event / route strings truncated in `logEvent()` before insert

### Querying

Query with `psql` or a short script against `DATABASE_URL`:

```sql
-- What has failed recently?
select created_at, event, source, route, detail
from debug_events
order by created_at desc
limit 50;

-- Is the thinking-token starvation happening?
select created_at,
       detail->>'finishReason'    as finish_reason,
       detail->>'thoughtTokens'   as thoughts,
       detail->>'candidateTokens' as candidates,
       detail->>'historyLength'   as history
from debug_events
where event = 'chat.empty_reply'
order by created_at desc;

-- Failure counts by type, last 7 days
select event, count(*)
from debug_events
where created_at > now() - interval '7 days'
group by event
order by count(*) desc;
```

### Retention

There is no automatic cleanup. Failure-only volume should stay small, but prune
periodically:

```sql
delete from debug_events where created_at < now() - interval '90 days';
```

### Storage

`debug_events` lives in the same Neon database as the app tables, written through Drizzle
in `src/lib/debug-log.ts`. Schema in `src/lib/db/schema.ts`.
