/**
 * Plain-language explanations of the optimizer's output.
 *
 * These are deterministic, not generated. Every figure quoted is interpolated
 * from the same computed result the page is displaying, so an explanation can
 * never contradict the number it sits next to — which is the failure mode that
 * would matter most for a tool whose entire value is being right about a number.
 *
 * They describe what the model did and why. They do not tell anyone what to do:
 * "your plan draws X from here, and here is the mechanism" rather than "you
 * should withdraw X". Vela is software, not a licensed advisor, and the
 * difference between describing a calculation and directing someone's finances
 * is the line this file stays on the correct side of.
 */

import {
  formatCurrency,
  FPL_FOR_2026_COVERAGE,
  SUBSIDY_CLIFF_FPL_PERCENTAGE,
  SUBSIDY_FLOOR_FPL_PERCENTAGE,
  ACTIVE_REGIME,
  type OptimizationResult,
  type UserProfile,
} from "./optimizer";
import { MEDICARE_AGE, ROTH_SEASONING_YEARS, type PipelineResult } from "./pipeline";

export interface Explanation {
  /** The question a reader would actually ask. */
  question: string;
  /** Paragraphs of answer. */
  answer: string[];
}

const pct = (n: number) => `${Math.round(n)}%`;

// ─── The prescription lines ──────────────────────────────────────────────────

export function explainRothWithdrawal(result: OptimizationResult): Explanation {
  const amount = result.optimized.prescription.rothIRAWithdrawal;
  return {
    question: "Why take this much from the Roth?",
    answer: [
      `Money coming out of a Roth IRA does not count toward MAGI, so this ${formatCurrency(amount)} funds your spending without affecting your subsidy at all. That makes it the cheapest cash in your plan, in subsidy terms.`,
      `It is not free of trade-offs. Roth balances are the most valuable dollars you own long term, because they grow and come out untaxed. The plan spends them here only where doing so protects a larger subsidy than the balance is worth keeping intact for one more year.`,
      `One caution the model does not check: Roth withdrawal rules depend on your age and on how long each contribution or conversion has been in the account. Confirm your own situation before acting.`,
    ],
  };
}

export function explainBasisReturn(result: OptimizationResult): Explanation {
  const basis = result.optimized.prescription.brokerageBasisReturned;
  const gain = result.optimized.prescription.brokerageGainRealized;
  const sale = result.optimized.prescription.brokerageSale;
  return {
    question: "Why doesn't the whole brokerage sale count?",
    answer: [
      `When you sell in a taxable account, only the profit is income. The rest is your own money coming back.`,
      `This plan sells ${formatCurrency(sale)}. Of that, ${formatCurrency(basis)} is return of what you originally invested — invisible to MAGI — and ${formatCurrency(gain)} is realized gain, which counts.`,
      `This is why a taxable brokerage is often the most useful account in these years: it can produce a large amount of spendable cash while adding comparatively little to your income.`,
    ],
  };
}

export function explainCapitalGains(result: OptimizationResult): Explanation {
  const gain = result.optimized.prescription.brokerageGainRealized;
  return {
    question: "Why realize any gains at all?",
    answer: [
      `Selling from your brokerage means realizing ${formatCurrency(gain)} of gain, and that does add to MAGI. The plan accepts it because the same sale releases a much larger amount of cost basis that does not.`,
      `The ratio matters. A position bought long ago and up substantially is mostly gain, so selling it is expensive in MAGI terms. A more recent position is mostly basis and is cheap. The model uses the average ratio across your account rather than lot-by-lot detail, so your real result depends on which specific lots you sell.`,
    ],
  };
}

export function explainTraditionalWithdrawal(
  profile: UserProfile,
  result: OptimizationResult
): Explanation {
  const amount = result.optimized.prescription.traditionalIRAWithdrawal;
  const fplPct = result.optimized.subsidy.fplPercentage;
  return {
    question: "Why take anything from the Traditional IRA?",
    answer: [
      `Every dollar out of a Traditional IRA counts fully toward MAGI, so the instinct is to avoid it entirely. That instinct is wrong here, and the reason is the floor.`,
      `Below ${SUBSIDY_FLOOR_FPL_PERCENTAGE}% of the Federal Poverty Level there is no premium tax credit at all — the same as being above the ceiling. Driving MAGI to zero would cost you the entire subsidy.`,
      `So the plan deliberately generates ${formatCurrency(amount)} of income here. That puts your MAGI at ${pct(fplPct)} of the poverty line — clear of the floor, with margin in case your income estimate turns out slightly low.`,
      `Using Traditional dollars for this, rather than Roth, also preserves Roth balance you will want later.`,
    ],
  };
}

// ─── The headline figures ────────────────────────────────────────────────────

export function explainTarget(profile: UserProfile, result: OptimizationResult): Explanation {
  const fpl = FPL_FOR_2026_COVERAGE[profile.householdSize] ?? FPL_FOR_2026_COVERAGE[4];
  const magi = result.optimized.prescription.totalMAGI;
  const fplPct = result.optimized.subsidy.fplPercentage;
  return {
    question: `Why aim for ${pct(fplPct)} of the poverty level?`,
    answer: [
      `The premium tax credit exists in a band, not a slope. Below ${SUBSIDY_FLOOR_FPL_PERCENTAGE}% of the poverty line there is no credit; above ${SUBSIDY_CLIFF_FPL_PERCENTAGE}% there is no credit. Inside the band, the lower your income, the smaller the share of it you are expected to pay toward premiums.`,
      `For a household of ${profile.householdSize}, the poverty line used for ${new Date().getFullYear()} coverage is ${formatCurrency(fpl)}. Your plan lands at ${formatCurrency(magi)}, which is ${pct(fplPct)} of it.`,
      `That sits low enough to keep your required contribution small, and far enough above the floor that an unexpected dividend or a part-time paycheck will not drop you underneath it. Aiming exactly at the floor would be worth marginally more and would be fragile.`,
    ],
  };
}

export function explainSavings(result: OptimizationResult): Explanation {
  const { naive, optimized, annualSavings } = result;
  const crossed = !naive.subsidy.subsidyEligible;
  return {
    question: "Where does this saving actually come from?",
    answer: [
      `Both plans fund the same spending. The only difference is which accounts the money comes from, and therefore how much of it counts as income.`,
      `Drawing everything from the Traditional IRA puts MAGI at ${formatCurrency(naive.prescription.totalMAGI)} — ${pct(naive.subsidy.fplPercentage)} of the poverty line — and leaves you paying ${formatCurrency(naive.subsidy.netAnnualPremium)} in premiums.`,
      crossed
        ? `That is past the ${SUBSIDY_CLIFF_FPL_PERCENTAGE}% line, where the credit is not reduced but eliminated. You pay the full benchmark premium.`
        : `Mixing sources brings MAGI to ${formatCurrency(optimized.prescription.totalMAGI)}, which lowers the share of income you are expected to contribute.`,
      `The optimized plan leaves you paying ${formatCurrency(optimized.subsidy.netAnnualPremium)}. The gap — ${formatCurrency(annualSavings)} — is the saving. No investment changed, no spending was cut.`,
    ],
  };
}

export function explainCliff(): Explanation {
  return {
    question: "What is the subsidy cliff?",
    answer: [
      `Above ${SUBSIDY_CLIFF_FPL_PERCENTAGE}% of the Federal Poverty Level, the premium tax credit does not taper — it stops. A single dollar of extra income can cost a household the entire credit, often more than fifteen thousand dollars.`,
      `The enhanced subsidies in place from 2021 through 2025 removed this cliff by capping contributions at 8.5% of income at any level. They expired on 31 December 2025 and were not extended, so the cliff applies again.`,
      `This report is calculated under ${ACTIVE_REGIME.label.toLowerCase()}. Legislation to change it is pending; if it passes, these figures change and the plan should be re-run.`,
    ],
  };
}

export function explainCsr(profile: UserProfile, result: OptimizationResult): Explanation {
  return {
    question: "What is a cost-sharing reduction?",
    answer: [
      `Separately from the premium credit, households under 250% of the poverty line qualify for Silver plans with lower deductibles and lower out-of-pocket maximums — the same premium, better coverage.`,
      `Your plan lands at ${pct(result.optimized.subsidy.fplPercentage)}, which qualifies. It only applies to Silver plans, so a Bronze plan chosen for its lower premium forfeits it.`,
      `This is a real reason not to aim purely at the lowest premium. The savings from reduced cost-sharing can exceed the premium difference in a year with meaningful medical spending.`,
    ],
  };
}

// ─── The pipeline and the calendar ───────────────────────────────────────────

export function explainPipeline(profile: UserProfile, pipeline: PipelineResult): Explanation {
  const first = pipeline.years[0];
  return {
    question: "What is a conversion pipeline for?",
    answer: [
      `Each year there is a gap between the MAGI your withdrawals already produce and the target. Converting Traditional IRA money into a Roth fills that gap. It costs income tax now, but almost no subsidy — because it fits under the ceiling you were going to stay under anyway.`,
      first
        ? `In ${first.year} that room is ${formatCurrency(first.headroom)}. Converted money becomes accessible without penalty ${ROTH_SEASONING_YEARS} tax years later, in ${first.accessibleIn}.`
        : `The room available each year depends on how much of your target the withdrawal plan already uses.`,
      `Repeating this each year until Medicare at ${MEDICARE_AGE} moves a substantial balance out of a Traditional IRA at a low tax cost, and builds a supply of Roth money that is invisible to MAGI in later years. That is what a ladder is: this year's conversion is a future year's subsidy-free spending.`,
      `The multi-year figures are projections. They assume returns, inflation, and tax rates nobody can know in advance, and they assume the subsidy rules stay as they are.`,
    ],
  };
}

export function explainCalendar(): Explanation {
  return {
    question: "Why does timing matter so much?",
    answer: [
      `MAGI is a full-year figure that becomes final on 31 December. Nothing after that date can change the year's subsidy, and unlike an IRA contribution, a Roth conversion cannot be done retroactively in April.`,
      `That makes the last quarter the decision point. By October your income for the year is nearly known, so the remaining room is reliable enough to act on.`,
      `Separately, the estimate you give when enrolling determines the subsidy paid on your behalf during the year. Estimating too low means repaying the difference at tax time.`,
    ],
  };
}

// ─── What people worry about ─────────────────────────────────────────────────

export function explainIncomeChange(): Explanation {
  return {
    question: "What if my income changes during the year?",
    answer: [
      `The subsidy is reconciled on your tax return against what you actually earned. If income comes in higher than estimated, some of the advance credit is repaid; if lower, you receive the difference.`,
      `The exception is the cliff. Crossing ${SUBSIDY_CLIFF_FPL_PERCENTAGE}% of the poverty line means repaying the entire year's credit, which is why the plan leaves margin rather than aiming at the line.`,
      `Unplanned income is the usual culprit: a mutual fund capital gains distribution in December, a bonus, a Roth conversion done without checking the effect first, or a part-time job. Checking the running total mid-year leaves time to correct.`,
    ],
  };
}

export function explainAccuracy(): Explanation {
  return {
    question: "How accurate are these numbers?",
    answer: [
      `The MAGI arithmetic and the poverty-line thresholds are exact — they come from the published tables. What is estimated is the benchmark premium, which the model takes from national averages by age band.`,
      `Actual benchmark premiums are set by rating area and vary substantially by county, so a real quote from your own marketplace will move the premium figures up or down. The MAGI target itself does not change.`,
      `The model also does not include state income taxes, Social Security taxation, IRMAA once Medicare begins, or the early-withdrawal penalty rules specific to your accounts. It is a planning tool, not tax advice.`,
    ],
  };
}
