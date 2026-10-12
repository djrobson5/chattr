import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof create>;

function create() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy the pooled Neon connection string into .env.local."
    );
  }

  // Neon's pooled endpoint is PgBouncer in transaction mode, which cannot use
  // prepared statements — `prepare: false` is required, not optional. Without
  // it, queries fail intermittently once connections start being reused.
  const client = postgres(connectionString, { prepare: false });

  return drizzle(client, { schema });
}

let cached: Db | undefined;

/**
 * Connects lazily on first use rather than at import time, so `next build` and
 * CI can compile without a reachable database. The error above still fires the
 * moment a query is actually attempted without configuration.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    cached ??= create();
    return Reflect.get(cached, prop, receiver);
  },
});
