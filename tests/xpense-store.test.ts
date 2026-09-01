import { describe, expect, it } from "vitest";

import { categoryMeta, formatDate, formatINR, mergeTransactionsById } from "../lib/xpense-store";

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

  it("merges local and remote transactions by ID with newest-first ordering", () => {
    const local = [{ id: "same", merchant: "Local", amount: 100, category: "Food" as const, wallet: "UPI" as const, createdAt: "2026-09-01T10:00:00.000Z" }];
    const remote = [
      { id: "same", merchant: "Remote", amount: 110, category: "Food" as const, wallet: "UPI" as const, createdAt: "2026-09-01T11:00:00.000Z" },
      { id: "new", merchant: "Bus", amount: 40, category: "Transport" as const, wallet: "Cash" as const, createdAt: "2026-09-01T09:00:00.000Z" },
    ];
    expect(mergeTransactionsById(local, remote).map((item) => item.id)).toEqual(["same", "new"]);
    expect(mergeTransactionsById(local, remote)[0].merchant).toBe("Remote");
  });
});
