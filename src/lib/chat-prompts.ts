/**
 * Prompt fragments appended to the scenario system prompt by /api/chat.
 * Shared with scripts/compare-corrections.ts so the eval sends exactly what
 * production sends.
 */

/** Correction-mode instruction, appended when correctionMode is on. */
export function buildCorrectionInstruction(lang: string): string {
  return `\n\nAfter your in-character reply, add a new line starting with "📝 " followed by a brief, friendly grammar or vocabulary correction of the user's last message (in English). If the user's ${lang} was correct, say "📝 Perfect ${lang}!" instead. Keep the correction to one sentence.`;
}
