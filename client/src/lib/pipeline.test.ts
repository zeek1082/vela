import { describe, expect, it } from "vitest";
import { buildPipeline, buildActionCalendar, MEDICARE_AGE, ROTH_SEASONING_YEARS, DEFAULT_ASSUMPTIONS } from "./pipeline";
import { DEMO_PROFILES, runOptimization, type UserProfile } from "./optimizer";

const profile: UserProfile = DEMO_PROFILES["couple_58"];
const baseMAGI = runOptimization(profile).optimized.prescription.totalMAGI;

describe("buildPipeline", () => {
  it("stops at Medicare age", () => {
    const r = buildPipeline(profile, baseMAGI, 2026, 20);
    expect(r.years.length).toBe(MEDICARE_AGE - profile.age);
    expect(r.years[r.years.length - 1].age).toBeLessThan(MEDICARE_AGE);
  });

  it("respects the maxYears cap", () => {
    const young: UserProfile = { ...profile, age: 45 };
    const r = buildPipeline(young, baseMAGI, 2026, 5);
    expect(r.years.length).toBe(5);
  });

  it("never converts past the MAGI target", () => {
    const r = buildPipeline(profile, baseMAGI, 2026, 10);
    for (const y of r.years) {
      // Allow a cent of floating point slack.
      expect(y.totalMAGI).toBeLessThanOrEqual(y.targetMAGI + 0.01);
    }
  });

  it("never converts more than the Traditional IRA holds in a given year", () => {
    // Cumulative conversions can exceed the starting balance, because whatever
    // is left keeps growing between conversions. What must hold is that no
    // single year converts more than was available at the start of that year.
    const small: UserProfile = {
      ...profile,
      accounts: { ...profile.accounts, traditionalIRA: 10_000 },
    };
    const r = buildPipeline(small, baseMAGI, 2026, 10);
    let available = 10_000;
    for (const y of r.years) {
      expect(y.conversion).toBeLessThanOrEqual(available + 0.01);
      available = y.traditionalBalance;
      expect(y.traditionalBalance).toBeGreaterThanOrEqual(0);
    }
  });

  it("seasons each conversion by five years", () => {
    const r = buildPipeline(profile, baseMAGI, 2026, 5);
    for (const y of r.years) {
      expect(y.accessibleIn).toBe(y.year + ROTH_SEASONING_YEARS);
    }
  });

  it("moves balance from Traditional to Roth", () => {
    // Growth is applied after the conversion, so the Traditional balance can
    // still rise year over year. The conversion's effect is visible by
    // comparing against the same projection with no headroom to convert into.
    const withConversion = buildPipeline(profile, baseMAGI, 2026, 6);
    const noConversion = buildPipeline(profile, 500_000, 2026, 6);
    const a = withConversion.years[0];
    const b = noConversion.years[0];
    expect(a.conversion).toBeGreaterThan(0);
    expect(a.traditionalBalance).toBeLessThan(b.traditionalBalance);
    expect(a.rothBalance).toBeGreaterThan(b.rothBalance);
  });

  it("returns zero headroom when base MAGI already exceeds the target", () => {
    const r = buildPipeline(profile, 500_000, 2026, 5);
    expect(r.totalConverted).toBe(0);
    expect(r.years.every((y) => y.headroom === 0)).toBe(true);
  });

  it("produces no negative figures", () => {
    const r = buildPipeline(profile, baseMAGI, 2026, 10);
    for (const y of r.years) {
      expect(y.conversion).toBeGreaterThanOrEqual(0);
      expect(y.headroom).toBeGreaterThanOrEqual(0);
      expect(y.conversionTaxCost).toBeGreaterThanOrEqual(0);
      expect(y.annualSubsidy).toBeGreaterThanOrEqual(0);
      expect(y.rothBalance).toBeGreaterThanOrEqual(0);
    }
  });

  it("handles a household already at Medicare age without crashing", () => {
    const old: UserProfile = { ...profile, age: 66 };
    const r = buildPipeline(old, baseMAGI, 2026, 10);
    expect(r.yearsToMedicare).toBe(0);
    expect(r.totalConverted).toBe(0);
  });

  it("exposes the assumptions it used", () => {
    const r = buildPipeline(profile, baseMAGI, 2026, 5);
    expect(r.assumptions).toEqual(DEFAULT_ASSUMPTIONS);
  });
});

describe("buildActionCalendar", () => {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  it("covers the year in order", () => {
    const items = buildActionCalendar(50_000, 20_000, fmt);
    const months = items.map((i) => i.month);
    expect(months).toEqual([...months].sort((a, b) => a - b));
  });

  it("writes the household's own numbers into the entries", () => {
    const items = buildActionCalendar(50_000, 20_000, fmt);
    expect(items.some((i) => i.detail.includes("$50,000"))).toBe(true);
    expect(items.some((i) => i.detail.includes("$20,000"))).toBe(true);
  });

  it("marks the December items as deadlines", () => {
    const items = buildActionCalendar(50_000, 20_000, fmt);
    const dec = items.filter((i) => i.month === 11);
    expect(dec.length).toBeGreaterThanOrEqual(3);
    expect(dec.every((i) => i.urgency === "deadline")).toBe(true);
  });
});
