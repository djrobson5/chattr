import { describe, it, expect } from "vitest";
import { tryParseJSON, validateFeedback, isPraiseCorrection } from "./report-card-utils";

describe("tryParseJSON", () => {
  it("parses valid JSON directly", () => {
    const result = tryParseJSON('{"key": "value"}');
    expect(result).toEqual({ key: "value" });
  });

  it("strips markdown code fences", () => {
    const result = tryParseJSON('```json\n{"key": "value"}\n```');
    expect(result).toEqual({ key: "value" });
  });

  it("extracts JSON object from surrounding text", () => {
    const result = tryParseJSON('Here is the result: {"key": "value"} hope that helps');
    expect(result).toEqual({ key: "value" });
  });

  it("returns null for completely invalid input", () => {
    expect(tryParseJSON("not json at all")).toBeNull();
    expect(tryParseJSON("")).toBeNull();
  });
});

describe("validateFeedback", () => {
  const validData = {
    goalAccomplished: true,
    goalSummary: "Student ordered coffee successfully.",
    grammarAssessment: "Good use of formal register.",
    vocabularyAssessment: "Appropriate café vocabulary.",
    wellDone: ["Polite greetings", "Correct verb forms"],
    toImprove: ["Article usage"],
    overallRating: 4,
  };

  it("passes through valid data unchanged", () => {
    const result = validateFeedback(validData);
    expect(result).toEqual(validData);
  });

  it("provides fallback for missing string fields", () => {
    const result = validateFeedback({});
    expect(result.goalSummary).toBe("Conversation completed.");
    expect(result.grammarAssessment).toBe("No grammar assessment available.");
    expect(result.vocabularyAssessment).toBe("No vocabulary assessment available.");
  });

  it("defaults goalAccomplished to true when not a boolean", () => {
    expect(validateFeedback({}).goalAccomplished).toBe(true);
    expect(validateFeedback({ goalAccomplished: "yes" }).goalAccomplished).toBe(true);
    expect(validateFeedback({ goalAccomplished: false }).goalAccomplished).toBe(false);
  });

  it("clamps overallRating to 1-5 range, defaults to 3", () => {
    expect(validateFeedback({}).overallRating).toBe(3);
    expect(validateFeedback({ overallRating: 0 }).overallRating).toBe(3);
    expect(validateFeedback({ overallRating: 6 }).overallRating).toBe(3);
    expect(validateFeedback({ overallRating: 3.5 }).overallRating).toBe(3);
    expect(validateFeedback({ overallRating: 5 }).overallRating).toBe(5);
    expect(validateFeedback({ overallRating: 1 }).overallRating).toBe(1);
  });

  it("filters non-string items from arrays", () => {
    const result = validateFeedback({
      wellDone: ["good", 42, "", null, "nice"],
      toImprove: "not an array",
    });
    expect(result.wellDone).toEqual(["good", "nice"]);
    expect(result.toImprove).toEqual([]);
  });
});

describe("isPraiseCorrection", () => {
  it("treats 'Perfect <Language>!' as praise", () => {
    expect(isPraiseCorrection("Perfect English!")).toBe(true);
    expect(isPraiseCorrection("  perfect Korean!")).toBe(true);
  });

  it("treats real corrections as corrections", () => {
    expect(isPraiseCorrection('"fair" should be spelled "faire"')).toBe(false);
    expect(isPraiseCorrection("Perfectly fine, but say 'hacer'")).toBe(false);
  });
});
