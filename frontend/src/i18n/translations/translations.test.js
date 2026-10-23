import { describe, expect, it } from "vitest";
import { translate } from "../I18nProvider.jsx";
import { translations } from "./index.js";

const LANGUAGES = Object.keys(translations);
const BASE_KEYS = Object.keys(translations.en);

describe("translations", () => {
  it("has the same keys in every language", () => {
    for (const language of LANGUAGES) {
      const keys = Object.keys(translations[language]).sort();
      expect(keys, language).toEqual([...BASE_KEYS].sort());
    }
  });

  it("has no empty strings", () => {
    for (const language of LANGUAGES) {
      for (const key of BASE_KEYS) {
        expect(translations[language][key].trim(), `${language}:${key}`).not.toBe(
          "",
        );
      }
    }
  });

  it("interpolates variables and falls back to English", () => {
    expect(translate("en", "home.comingSoon", { label: "Lab Reports" })).toContain(
      "Lab Reports",
    );
    expect(translate("hi", "missing.key")).toBe("missing.key");
    expect(translate("hi", "nav.home")).toBe("होम");
  });
});
