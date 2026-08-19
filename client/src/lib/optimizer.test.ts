/**
 * Tests pinning the 2026 subsidy rules.
 *
 * The values asserted here come from IRS Rev. Proc. 2025-25, which sets the
 * § 36B applicable percentage table for taxable years beginning in 2026:
 * https://www.irs.gov/pub/irs-drop/rp-25-25.pdf
 *
 * The behaviour that matters most is the cliff. If a future change reintroduces
 * a capped percentage above 400% FPL, the boundary tests below will fail loudly,
 * because that is the difference between the product working and not.
 */

import { describe, expect, it } from "vitest";
import {
  calculateACASubsidy,
  getApplicablePercentage,
  runOptimization,
  DEMO_PROFILES,
  FPL_FOR_2026_COVERAGE,
  SUBSIDY_CLIFF_FPL_PERCENTAGE,
  ACTIVE_REGIME,
  REGIME_ENHANCED,
  REGIME_REVERTED_2026,
  type UserProfile,
} from "./optimizer";

const couple: UserProfile = DEMO_PROFILES["couple_58"];
const fplCouple = FPL_FOR_2026_COVERAGE[couple.householdSize];

/** MAGI that lands exactly on a given percentage of FPL. */
const magiAt = (pct: number, householdSize = couple.householdSize) =>
  (FPL_FOR_2026_COVERAGE[householdSize] * pct) / 100;

describe("getApplicablePercentage — Rev. Proc. 2025-25 table", () => {
  it("returns 2.10% below 133% FPL", () => {
    expect(getApplicablePercentage(100)).toBeCloseTo(0.021, 5);
    expect(getApplicablePercentage(132)).toBeCloseTo(0.021, 5);
  });

  it("matches the published band endpoints", () => {
    expect(getApplicablePercentage(133)).toBeCloseTo(0.0314, 5);
    expect(getApplicablePercentage(150)).toBeCloseTo(0.0419, 5);
    expect(getApplicablePercentage(200)).toBeCloseTo(0.066, 5);
    expect(getApplicablePercentage(250)).toBeCloseTo(0.0844, 5);
    expect(getApplicablePercentage(300)).toBeCloseTo(0.0996, 5);
    expect(getApplicablePercentage(400)).toBeCloseTo(0.0996, 5);
  });

  it("interpolates linearly inside a band", () => {
    // Midpoint of 150-200 should sit midway between 4.19% and 6.60%.
    expect(getApplicablePercentage(175)).toBeCloseTo((0.0419 + 0.066) / 2, 5);
  });

  it("rises monotonically across the whole eligible range", () => {
    let previous = 0;
    for (let pct = 100; pct <= 400; pct += 1) {
      const value = getApplicablePercentage(pct)!;
      expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = value;
    }
  });

  it("returns null outside the eligible band", () => {
    expect(getApplicablePercentage(99.9)).toBeNull();
    expect(getApplicablePercentage(400.1)).toBeNull();
    expect(getApplicablePercentage(1000)).toBeNull();
  });

  it("never exceeds the 9.96% required contribution percentage", () => {
    for (let pct = 100; pct <= 400; pct += 0.5) {
      expect(getApplicablePercentage(pct)!).toBeLessThanOrEqual(0.0996 + 1e-9);
    }
  });
});

describe("the 400% FPL cliff", () => {
  it("pays a large subsidy just under the line and none just over it", () => {
    const under = calculateACASubsidy(magiAt(399), couple);
    const over = calculateACASubsidy(magiAt(401), couple);

    expect(under.subsidyEligible).toBe(true);
    expect(under.annualSubsidy).toBeGreaterThan(0);

    expect(over.subsidyEligible).toBe(false);
    expect(over.ineligibleReason).toBe("above-400-fpl");
    expect(over.annualSubsidy).toBe(0);
    expect(over.netAnnualPremium).toBe(over.benchmarkPremium);
  });

  it("costs thousands for a trivial amount of extra income", () => {
    const under = calculateACASubsidy(magiAt(399.9), couple);
    const over = calculateACASubsidy(magiAt(400.1), couple);
    const extraIncome = over.magi - under.magi;
    const extraPremium = over.netAnnualPremium - under.netAnnualPremium;

    expect(extraIncome).toBeLessThan(100);
    expect(extraPremium).toBeGreaterThan(1_000);
  });

  it("is eligible exactly at 400%", () => {
    const at = calculateACASubsidy(magiAt(SUBSIDY_CLIFF_FPL_PERCENTAGE), couple);
    expect(at.subsidyEligible).toBe(true);
  });

  it("flags cliff risk approaching the line but not past it", () => {
    expect(calculateACASubsidy(magiAt(390), couple).subsidyCliffRisk).toBe(true);
    expect(calculateACASubsidy(magiAt(300), couple).subsidyCliffRisk).toBe(false);
    expect(calculateACASubsidy(magiAt(420), couple).subsidyCliffRisk).toBe(false);
  });
});

describe("the 100% FPL floor", () => {
  it("gives no credit below 100% FPL", () => {
    const below = calculateACASubsidy(magiAt(80), couple);
    expect(below.subsidyEligible).toBe(false);
    expect(below.ineligibleReason).toBe("below-100-fpl");
    expect(below.annualSubsidy).toBe(0);
  });

  it("becomes eligible at 100% FPL", () => {
    expect(calculateACASubsidy(fplCouple, couple).subsidyEligible).toBe(true);
  });
});

describe("subsidy arithmetic", () => {
  it("charges the applicable percentage of income, capped at the benchmark", () => {
    const r = calculateACASubsidy(magiAt(300), couple);
    const expected = r.magi * getApplicablePercentage(300)!;
    expect(r.maxContribution).toBeCloseTo(Math.min(expected, r.benchmarkPremium), 2);
    expect(r.annualSubsidy).toBeCloseTo(r.benchmarkPremium - r.maxContribution, 2);
  });

  it("keeps monthly figures consistent with annual ones", () => {
    const r = calculateACASubsidy(magiAt(250), couple);
    expect(r.monthlySubsidy).toBeCloseTo(r.annualSubsidy / 12, 6);
    expect(r.netMonthlyPremium).toBeCloseTo(r.netAnnualPremium / 12, 6);
  });

  it("never returns a negative subsidy or premium", () => {
    for (const pct of [50, 100, 150, 250, 399, 401, 800]) {
      const r = calculateACASubsidy(magiAt(pct), couple);
      expect(r.annualSubsidy).toBeGreaterThanOrEqual(0);
      expect(r.netAnnualPremium).toBeGreaterThanOrEqual(0);
    }
  });

  it("marks cost-sharing reduction eligibility at or below 250% FPL", () => {
    expect(calculateACASubsidy(magiAt(200), couple).costSharingReduction).toBe(true);
    expect(calculateACASubsidy(magiAt(251), couple).costSharingReduction).toBe(false);
  });
});

describe("runOptimization on the demo profiles", () => {
  it("produces a positive saving for every demo profile", () => {
    for (const [name, p] of Object.entries(DEMO_PROFILES)) {
      const r = runOptimization(p);
      expect(r.annualSavings, name).toBeGreaterThan(0);
      expect(r.optimized.subsidy.netAnnualPremium, name).toBeLessThanOrEqual(
        r.naive.subsidy.netAnnualPremium
      );
    }
  });

  it("keeps optimized MAGI below the cliff", () => {
    for (const [name, p] of Object.entries(DEMO_PROFILES)) {
      const r = runOptimization(p);
      expect(r.optimized.subsidy.fplPercentage, name).toBeLessThanOrEqual(
        SUBSIDY_CLIFF_FPL_PERCENTAGE
      );
      expect(r.optimized.subsidy.subsidyEligible, name).toBe(true);
    }
  });

  it("shows a very large saving for a household the naive plan pushes over the cliff", () => {
    // Spending high enough that pulling it all from a Traditional IRA lands
    // past 400% FPL — the case the product exists to prevent.
    const overCliff: UserProfile = {
      ...couple,
      annualSpending: Math.round(magiAt(420)),
    };
    const r = runOptimization(overCliff);
    expect(r.naive.subsidy.subsidyEligible).toBe(false);
    expect(r.optimized.subsidy.subsidyEligible).toBe(true);
    expect(r.annualSavings).toBeGreaterThan(10_000);
  });
});

describe("subsidy regimes", () => {
  it("has no cliff under the enhanced schedule", () => {
    const over = calculateACASubsidy(magiAt(500), couple, REGIME_ENHANCED);
    expect(over.subsidyEligible).toBe(true);
    expect(over.applicablePercentage).toBeCloseTo(0.085, 5);
    expect(over.subsidyCliffRisk).toBe(false);
  });

  it("has a cliff under the reverted schedule", () => {
    const over = calculateACASubsidy(magiAt(500), couple, REGIME_REVERTED_2026);
    expect(over.subsidyEligible).toBe(false);
    expect(over.annualSubsidy).toBe(0);
  });

  it("charges nothing below 150% FPL under the enhanced schedule", () => {
    expect(getApplicablePercentage(120, REGIME_ENHANCED)).toBe(0);
    expect(getApplicablePercentage(149, REGIME_ENHANCED)).toBe(0);
  });

  it("charges more at every income under the reverted schedule", () => {
    for (const pct of [120, 175, 225, 275, 350, 400]) {
      const reverted = getApplicablePercentage(pct, REGIME_REVERTED_2026)!;
      const enhanced = getApplicablePercentage(pct, REGIME_ENHANCED)!;
      expect(reverted, `at ${pct}% FPL`).toBeGreaterThan(enhanced);
    }
  });

  it("keeps the 100% floor in both regimes", () => {
    for (const regime of [REGIME_REVERTED_2026, REGIME_ENHANCED]) {
      expect(getApplicablePercentage(99, regime), regime.id).toBeNull();
    }
  });

  it("makes optimization worth dramatically more under the reverted schedule", () => {
    // A household whose naive plan crosses 400% FPL. Under the enhanced
    // schedule crossing costs relatively little; under the reverted one it
    // costs the entire credit. This gap is the product's whole premise.
    const overCliff: UserProfile = { ...couple, annualSpending: Math.round(magiAt(420)) };

    const savingUnder = (regime: typeof REGIME_ENHANCED) => {
      const naive = calculateACASubsidy(overCliff.annualSpending, overCliff, regime);
      const optimized = calculateACASubsidy(magiAt(125), overCliff, regime);
      return naive.netAnnualPremium - optimized.netAnnualPremium;
    };

    expect(savingUnder(REGIME_REVERTED_2026)).toBeGreaterThan(savingUnder(REGIME_ENHANCED) * 2);
  });

  it("ships with the reverted schedule active", () => {
    expect(ACTIVE_REGIME.id).toBe("reverted-2026");
  });
});
