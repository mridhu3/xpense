import { describe, expect, it } from "vitest";

import { categoryMeta, formatDate, formatINR } from "../lib/xpense-store";

describe("XPense store helpers", () => {
  it("formats Indian rupee amounts with locale separators", () => {
    expect(formatINR(12480)).toBe("₹12,480");
    expect(formatINR(0)).toBe("₹0");
  });

  it("labels recent transaction dates relative to today", () => {
    const today = new Date().toISOString();
    expect(formatDate(today)).toBe("Today");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDate(yesterday.toISOString())).toBe("Yesterday");
  });

  it("defines a positive budget limit and visual metadata for every category", () => {
    for (const meta of Object.values(categoryMeta)) {
      expect(meta.limit).toBeGreaterThan(0);
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.color).toMatch(/^#/);
    }
  });
});
