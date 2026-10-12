export interface ReportCardFeedback {
  goalAccomplished: boolean;
  goalSummary: string;
  grammarAssessment: string;
  vocabularyAssessment: string;
  wellDone: string[];
  toImprove: string[];
  overallRating: number;
}

export function tryParseJSON(raw: string): Record<string, unknown> | null {
  // Direct parse
  try { return JSON.parse(raw); } catch {}
  // Strip markdown fences
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned); } catch {}
  // Extract JSON object
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

export function validateFeedback(data: Record<string, unknown>): ReportCardFeedback {
  const ensureString = (val: unknown, fallback: string): string =>
    typeof val === "string" && val.trim() ? val.trim() : fallback;

  const ensureStringArray = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return val.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  };

  const rating = Number(data.overallRating);

  return {
    goalAccomplished: typeof data.goalAccomplished === "boolean" ? data.goalAccomplished : true,
    goalSummary: ensureString(data.goalSummary, "Conversation completed."),
    grammarAssessment: ensureString(data.grammarAssessment, "No grammar assessment available."),
    vocabularyAssessment: ensureString(data.vocabularyAssessment, "No vocabulary assessment available."),
    wellDone: ensureStringArray(data.wellDone),
    toImprove: ensureStringArray(data.toImprove),
    overallRating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 3,
  };
}

/**
 * Correction mode replies "Perfect <Language>!" when the learner made no
 * mistake. That is praise, not a correction, so it must not count as one.
 */
export function isPraiseCorrection(correction: string): boolean {
  return /^perfect\b/i.test(correction.trim());
}
