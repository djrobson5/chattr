import { describe, expect, it } from "vitest";
import { isSignupAllowed } from "./signup";

describe("isSignupAllowed", () => {
  it("is enabled only by the exact value 'true'", () => {
    expect(isSignupAllowed({ ALLOW_SIGNUP: "true" } as NodeJS.ProcessEnv)).toBe(true);
  });

  it.each([undefined, "", "false", "TRUE", "True", "1", "yes", " true", "true "])(
    "stays disabled for %j",
    (value) => {
      expect(isSignupAllowed({ ALLOW_SIGNUP: value } as NodeJS.ProcessEnv)).toBe(false);
    }
  );
});
