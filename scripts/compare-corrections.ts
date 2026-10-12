/**
 * Compare how Gemini models handle correction mode. Dev tool, not app code.
 *
 *   npx tsx --env-file=.env.local scripts/compare-corrections.ts [--runs 2] [--models a,b,c]
 *
 * Sends each case in scripts/correction-cases.json to each model, using the
 * same system prompt /api/chat builds with correctionMode on and hintMode off,
 * and writes the raw results to scripts/output/corrections-<timestamp>.json
 * for a human to grade. The `expect` field is never sent to the model.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ApiError, GoogleGenAI, ThinkingLevel, type ThinkingConfig } from "@google/genai";
import { getLanguageName, getScenario, getSystemPromptWithDifficulty } from "../src/lib/scenarios";
import { thinkingConfigFor } from "../src/lib/gemini";
import { buildCorrectionInstruction } from "../src/lib/chat-prompts";
import type { Difficulty, Scenario } from "../src/lib/types";

const DEFAULT_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"];
const CONCURRENCY = 6;
const RETRY_DELAY_MS = 3000;

/** USD per 1M tokens. Thinking tokens are billed as output. */
const PRICES: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
  "gemini-3.8-flash": { input: 1.5, output: 7.5 },
};

interface Case {
  id: string;
  scenario: string;
  difficulty: Difficulty;
  message: string;
  expect: string;
}

interface CallRecord {
  caseId: string;
  model: string;
  run: number;
  thinkingConfig: ThinkingConfig | null;
  /** Set when the first config was rejected; latencyMs then times only the retry. */
  thinkingFallback: { from: ThinkingConfig; error: string; rejectedAfterMs: number } | null;
  latencyMs: number | null;
  usage: { prompt: number | null; thoughts: number | null; candidates: number | null };
  finishReason: string | null;
  rawText: string | null;
  reply: string | null;
  correction: string | null;
  conversationEnded: boolean;
  error: string | null;
}

// ---------- args ----------

function parseArgs(argv: string[]): { runs: number; models: string[] } {
  let runs = 2;
  let models = DEFAULT_MODELS;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--runs") {
      runs = Number(argv[++i]);
    } else if (arg.startsWith("--runs=")) {
      runs = Number(arg.slice("--runs=".length));
    } else if (arg === "--models") {
      models = (argv[++i] ?? "").split(",");
    } else if (arg.startsWith("--models=")) {
      models = arg.slice("--models=".length).split(",");
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  models = models.map((m) => m.trim()).filter(Boolean);
  if (!Number.isInteger(runs) || runs < 1) throw new Error("--runs must be a positive integer");
  if (models.length === 0) throw new Error("--models must name at least one model");
  return { runs, models };
}

// ---------- prompt + parsing (mirrors src/app/api/chat/route.ts) ----------

function buildSystemPrompt(scenario: Scenario, difficulty: Difficulty): string {
  const lang = getLanguageName(scenario.language);
  return getSystemPromptWithDifficulty(scenario, difficulty) + buildCorrectionInstruction(lang);
}

/** Same steps as the route with correctionMode on, hintMode off. */
function parseReply(text: string): { reply: string; correction: string | null; conversationEnded: boolean } {
  let mainReply = text;
  let conversationEnded = false;
  if (mainReply.includes("[CONV_END]")) {
    mainReply = mainReply.replace(/\[CONV_END\]/g, "").trim();
    conversationEnded = true;
  }
  let correction: string | null = null;
  if (mainReply.includes("📝")) {
    const parts = mainReply.split("📝");
    mainReply = parts[0].trim();
    correction = parts[1]?.trim() ?? null;
  }
  return { reply: mainReply, correction, conversationEnded };
}

// ---------- API calls ----------

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function isGemini25(model: string): boolean {
  return model.startsWith("gemini-2.5");
}

/** Same caps the app uses for chat: 512 on 2.5, 1024 otherwise. */
function outputCap(model: string): number {
  return isGemini25(model) ? 512 : 1024;
}

function errorStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : undefined;
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isRetryable(err: unknown): boolean {
  const status = errorStatus(err);
  return status === 429 || (status !== undefined && status >= 500);
}

function isThinkingRejection(err: unknown): boolean {
  return errorStatus(err) === 400 && /thinking|level/i.test(errorText(err));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Contents = { role: string; parts: { text: string }[] }[];

async function generate(model: string, systemPrompt: string, contents: Contents, thinkingConfig: ThinkingConfig) {
  const request = () =>
    ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction: systemPrompt, maxOutputTokens: outputCap(model), thinkingConfig },
    });
  try {
    return await request();
  } catch (err) {
    if (!isRetryable(err)) throw err;
    await sleep(RETRY_DELAY_MS);
    return await request();
  }
}

async function runCall(c: Case, scenario: Scenario, model: string, run: number): Promise<CallRecord> {
  const systemPrompt = buildSystemPrompt(scenario, c.difficulty);
  const contents: Contents = [
    { role: "model", parts: [{ text: scenario.starterMessage }] },
    { role: "user", parts: [{ text: c.message }] },
  ];
  const record: CallRecord = {
    caseId: c.id,
    model,
    run,
    thinkingConfig: null,
    thinkingFallback: null,
    latencyMs: null,
    usage: { prompt: null, thoughts: null, candidates: null },
    finishReason: null,
    rawText: null,
    reply: null,
    correction: null,
    conversationEnded: false,
    error: null,
  };

  let thinkingConfig = thinkingConfigFor(model, "off");
  let start = Date.now();
  let response;
  try {
    try {
      response = await generate(model, systemPrompt, contents, thinkingConfig);
    } catch (err) {
      if (isGemini25(model) || !isThinkingRejection(err)) throw err;
      record.thinkingFallback = { from: thinkingConfig, error: errorText(err), rejectedAfterMs: Date.now() - start };
      thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      start = Date.now();
      response = await generate(model, systemPrompt, contents, thinkingConfig);
    }
  } catch (err) {
    record.latencyMs = Date.now() - start;
    const status = errorStatus(err);
    record.error = status ? `[${status}] ${errorText(err)}` : errorText(err);
    return record;
  }
  record.latencyMs = Date.now() - start;
  record.thinkingConfig = thinkingConfig;

  const meta = response.usageMetadata;
  record.usage = {
    prompt: meta?.promptTokenCount ?? null,
    thoughts: meta?.thoughtsTokenCount ?? null,
    candidates: meta?.candidatesTokenCount ?? null,
  };
  record.finishReason = response.candidates?.[0]?.finishReason ?? null;
  const text = response.text ?? "";
  record.rawText = text;
  const parsed = parseReply(text);
  record.reply = parsed.reply;
  record.correction = parsed.correction;
  record.conversationEnded = parsed.conversationEnded;
  return record;
}

async function pool<T>(tasks: (() => Promise<T>)[], limit: number, onDone: () => void): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
      onDone();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// ---------- summary ----------

function costFor(model: string, records: CallRecord[]): number | null {
  const price = PRICES[model];
  if (!price) return null;
  let usd = 0;
  for (const r of records) {
    const input = r.usage.prompt ?? 0;
    const output = (r.usage.candidates ?? 0) + (r.usage.thoughts ?? 0);
    usd += (input * price.input + output * price.output) / 1_000_000;
  }
  return usd;
}

function summarize(models: string[], records: CallRecord[]) {
  return models.map((model) => {
    const rs = records.filter((r) => r.model === model);
    const ok = rs.filter((r) => r.error === null);
    const withCorrection = ok.filter((r) => r.correction !== null);
    const perfect = withCorrection.filter((r) => /^Perfect\b/i.test(r.correction ?? ""));
    const latencies = ok.map((r) => r.latencyMs ?? 0);
    const configs = [...new Set(ok.map((r) => JSON.stringify(r.thinkingConfig)))];
    const thinkingErrors = [...new Set(rs.flatMap((r) => (r.thinkingFallback ? [r.thinkingFallback.error] : [])))];
    const cost = costFor(model, ok);
    return {
      model,
      calls: rs.length,
      noteLines: withCorrection.length,
      perfect: perfect.length,
      otherCorrections: withCorrection.length - perfect.length,
      emptyReplies: ok.filter((r) => !r.rawText).length,
      errors: rs.length - ok.length,
      meanLatencyMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null,
      estCostUsd: cost === null ? null : Number(cost.toFixed(6)),
      thinkingConfigsUsed: configs.map((s) => JSON.parse(s) as ThinkingConfig),
      thinkingErrors,
    };
  });
}

// ---------- main ----------

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set (run with --env-file=.env.local)");
  const { runs, models } = parseArgs(process.argv.slice(2));

  const casesPath = join(__dirname, "correction-cases.json");
  const cases = JSON.parse(readFileSync(casesPath, "utf8")) as Case[];

  const scenarios = new Map<string, Scenario>();
  const missing: string[] = [];
  for (const c of cases) {
    const s = getScenario(c.scenario);
    if (s) scenarios.set(c.scenario, s);
    else missing.push(`${c.id}: ${c.scenario}`);
  }
  if (missing.length) throw new Error(`Unknown scenario ids:\n  ${missing.join("\n  ")}`);

  const tasks: (() => Promise<CallRecord>)[] = [];
  for (const c of cases) {
    for (const model of models) {
      for (let run = 1; run <= runs; run++) {
        tasks.push(() => runCall(c, scenarios.get(c.scenario)!, model, run));
      }
    }
  }

  console.log(`${cases.length} cases × ${models.length} models × ${runs} runs = ${tasks.length} calls`);
  let done = 0;
  const startedAt = new Date();
  const records = await pool(tasks, CONCURRENCY, () => {
    done++;
    if (done % 10 === 0 || done === tasks.length) process.stdout.write(`  ${done}/${tasks.length}\n`);
  });

  const summary = summarize(models, records);
  const outDir = join(__dirname, "output");
  mkdirSync(outDir, { recursive: true });
  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const outPath = join(outDir, `corrections-${stamp}.json`);
  writeFileSync(
    outPath,
    JSON.stringify({ startedAt: startedAt.toISOString(), runs, models, cases, summary, results: records }, null, 2)
  );

  console.log("\nSummary");
  console.table(
    summary.map((s) => ({
      model: s.model,
      calls: s.calls,
      "📝 lines": s.noteLines,
      perfect: s.perfect,
      other: s.otherCorrections,
      empty: s.emptyReplies,
      errors: s.errors,
      "mean ms": s.meanLatencyMs,
      "est $": s.estCostUsd,
    }))
  );
  for (const s of summary) {
    console.log(`${s.model}: thinking config used ${JSON.stringify(s.thinkingConfigsUsed)}`);
    for (const e of s.thinkingErrors) console.log(`  thinking fallback triggered by: ${e}`);
  }
  const errored = records.filter((r) => r.error);
  if (errored.length) {
    console.log("\nErrors:");
    for (const r of errored) console.log(`  ${r.model} ${r.caseId} run ${r.run}: ${r.error}`);
  }
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
