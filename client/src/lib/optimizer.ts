/**
 * Vela — Core Optimization Engine
 * 
 * This module implements the logic that determines the optimal withdrawal
 * strategy across multiple account types to minimize MAGI and maximize
 * ACA Premium Tax Credits (subsidies).
 * 
 * MAGI Impact by Source:
 * - Traditional IRA / 401(k) withdrawals: 100% counts as MAGI
 * - Roth IRA withdrawals (basis): 0% counts as MAGI
 * - Roth conversions: 100% counts as MAGI
 * - Taxable brokerage (capital gains only): only the GAIN counts as MAGI
 * - Taxable brokerage (cost basis return): 0% counts as MAGI
 * - Social Security: 0-85% counts as MAGI depending on total income
 */

export interface AccountBalance {
  traditionalIRA: number;   // Total balance
  rothIRA: number;          // Total balance (all basis, penalty-free)
  brokerage: number;        // Total balance
  brokerageCostBasis: number; // Cost basis (the rest is unrealized gain)
  hsa: number;              // HSA balance (for medical expenses)
}

export interface UserProfile {
  age: number;
  filingStatus: 'single' | 'married';
  householdSize: number;
  state: string;
  annualSpending: number;
  accounts: AccountBalance;
  zipCode: string;
}

export interface ACASubsidyResult {
  magi: number;
  fplPercentage: number;
  benchmarkPremium: number;        // Full cost of Silver benchmark plan
  maxContribution: number;         // Max % of income user must pay (SLCSP cap)
  annualSubsidy: number;           // Premium Tax Credit
  monthlySubsidy: number;
  netAnnualPremium: number;        // What user actually pays
  netMonthlyPremium: number;
  costSharingReduction: boolean;   // CSR eligible (<= 250% FPL)
  subsidyCliffRisk: boolean;       // Close enough to the 400% cliff to be dangerous
  /** False when MAGI falls outside the 100%-400% FPL band where the PTC exists. */
  subsidyEligible: boolean;
  /** Why the household is ineligible, when it is. */
  ineligibleReason: 'below-100-fpl' | 'above-400-fpl' | null;
  /** The § 36B applicable percentage used, or null when ineligible. */
  applicablePercentage: number | null;
}

export interface WithdrawalPrescription {
  traditionalIRAWithdrawal: number;
  rothIRAWithdrawal: number;
  brokerageSale: number;
  brokerageGainRealized: number;   // The portion that counts as MAGI
  brokerageBasisReturned: number;  // The portion that does NOT count as MAGI
  hsaWithdrawal: number;
  totalCashGenerated: number;
  totalMAGI: number;
}

export interface OptimizationResult {
  naive: {
    prescription: WithdrawalPrescription;
    subsidy: ACASubsidyResult;
  };
  optimized: {
    prescription: WithdrawalPrescription;
    subsidy: ACASubsidyResult;
  };
  annualSavings: number;
  roiMultiple: number;
  subscriptionCost: number;
}

/**
 * Federal Poverty Level figures used for 2026 marketplace coverage.
 *
 * Eligibility for a coverage year is determined against the poverty guidelines
 * in effect when open enrollment opens — so 2026 coverage uses the 2025 HHS
 * guidelines, which is what these are. Figures are for the 48 contiguous states
 * and DC; Alaska and Hawaii have separate, higher guidelines that this table
 * does not yet model.
 */
export const FPL_FOR_2026_COVERAGE: Record<number, number> = {
  1: 15650,
  2: 21150,
  3: 26650,
  4: 32150,
  5: 37650,
  6: 43150,
  7: 48650,
  8: 54150,
};

// ─── Subsidy regimes ─────────────────────────────────────────────────────────
//
// Which rules apply is a policy question with an open legislative answer, so it
// is a parameter here rather than a hardcoded assumption.
//
// The enhanced subsidies from the American Rescue Plan, extended by the
// Inflation Reduction Act, EXPIRED on December 31, 2025. The pre-ARPA structure
// governs 2026 coverage: a hard 400% FPL cliff and higher contribution
// percentages. The House passed a three-year extension on January 8, 2026; as of
// this writing it has not cleared the Senate.
//
// If that changes, switch ACTIVE_REGIME. Nothing else needs to move — the
// optimizer, the pipeline projection, and the landing page's cliff chart all
// read their rules from here.

interface PercentageBand {
  /** Lower bound, as a percentage of FPL. */
  from: number;
  /** Upper bound, as a percentage of FPL. */
  to: number;
  /** Applicable percentage at the lower bound. */
  initial: number;
  /** Applicable percentage at the upper bound. */
  final: number;
}

export interface SubsidyRegime {
  id: 'reverted-2026' | 'enhanced';
  /** Short label for display. */
  label: string;
  /** One line on what this regime is and where it comes from. */
  description: string;
  /** Income floor for any credit, as a percentage of FPL. */
  floorFplPercentage: number;
  /**
   * Income ceiling for any credit, as a percentage of FPL. Null means no
   * ceiling — the defining feature of the enhanced regime.
   */
  ceilingFplPercentage: number | null;
  /** Applicable percentage above the ceiling, when there is no cliff. */
  aboveCeilingPercentage: number | null;
  bands: PercentageBand[];
}

/**
 * Pre-ARPA structure, indexed for 2026.
 * Source: IRS Rev. Proc. 2025-25 — https://www.irs.gov/pub/irs-drop/rp-25-25.pdf
 *
 * Percentages rise linearly inside each band, which is why these interpolate
 * rather than returning a flat rate per tier.
 */
export const REGIME_REVERTED_2026: SubsidyRegime = {
  id: 'reverted-2026',
  label: '2026 rules (enhanced subsidies expired)',
  description:
    'The pre-ARPA structure, indexed for 2026 by Rev. Proc. 2025-25. A hard 400% FPL cliff, contributions topping out at 9.96% of income.',
  floorFplPercentage: 100,
  ceilingFplPercentage: 400,
  aboveCeilingPercentage: null,
  bands: [
    { from: 100, to: 133, initial: 0.0210, final: 0.0210 },
    { from: 133, to: 150, initial: 0.0314, final: 0.0419 },
    { from: 150, to: 200, initial: 0.0419, final: 0.0660 },
    { from: 200, to: 250, initial: 0.0660, final: 0.0844 },
    { from: 250, to: 300, initial: 0.0844, final: 0.0996 },
    { from: 300, to: 400, initial: 0.0996, final: 0.0996 },
  ],
};

/**
 * The ARPA/IRA enhanced schedule that applied 2021-2025, and which pending
 * legislation would restore. No cliff: above 400% FPL the household simply pays
 * 8.5% of income toward the benchmark plan.
 */
export const REGIME_ENHANCED: SubsidyRegime = {
  id: 'enhanced',
  label: 'Enhanced subsidies (ARPA/IRA schedule)',
  description:
    'The schedule in force 2021-2025. No 400% cliff — contributions cap at 8.5% of income at any level above it.',
  floorFplPercentage: 100,
  ceilingFplPercentage: null,
  aboveCeilingPercentage: 0.085,
  bands: [
    { from: 100, to: 150, initial: 0, final: 0 },
    { from: 150, to: 200, initial: 0, final: 0.02 },
    { from: 200, to: 250, initial: 0.02, final: 0.04 },
    { from: 250, to: 300, initial: 0.04, final: 0.06 },
    { from: 300, to: 400, initial: 0.06, final: 0.085 },
  ],
};

export const SUBSIDY_REGIMES: Record<SubsidyRegime['id'], SubsidyRegime> = {
  'reverted-2026': REGIME_REVERTED_2026,
  enhanced: REGIME_ENHANCED,
};

/**
 * The regime currently in force. Change this one line if the Senate acts.
 */
export const ACTIVE_REGIME: SubsidyRegime = REGIME_REVERTED_2026;

/** The income ceiling under the active regime, or 400 for display purposes. */
export const SUBSIDY_CLIFF_FPL_PERCENTAGE = ACTIVE_REGIME.ceilingFplPercentage ?? 400;

/** The income floor under the active regime, as a percentage of FPL. */
export const SUBSIDY_FLOOR_FPL_PERCENTAGE = ACTIVE_REGIME.floorFplPercentage;

/**
 * Where the optimizer aims MAGI: above the 100% FPL eligibility floor with a
 * margin for estimate error, and low enough that the applicable percentage
 * stays near the bottom of the table.
 */
export const MAGI_FLOOR_FPL_PERCENTAGE = 125;

/**
 * The share of household income the household must contribute toward the
 * benchmark plan, or null when no credit is available at this income.
 */
export function getApplicablePercentage(
  fplPct: number,
  regime: SubsidyRegime = ACTIVE_REGIME
): number | null {
  if (fplPct < regime.floorFplPercentage) return null;

  if (regime.ceilingFplPercentage !== null && fplPct > regime.ceilingFplPercentage) {
    // A cliff: no credit at all above the line.
    return null;
  }

  if (regime.ceilingFplPercentage === null) {
    const top = regime.bands[regime.bands.length - 1];
    if (fplPct > top.to) {
      // No cliff: the contribution percentage simply flattens.
      return regime.aboveCeilingPercentage;
    }
  }

  // The statute's bands are half-open — "less than 133%", then "at least 133%
  // but less than 150%", and so on — so an income landing exactly on a boundary
  // belongs to the band above it. The final band includes its upper bound.
  const top = regime.bands[regime.bands.length - 1];
  const band = regime.bands.find(
    (b) => fplPct >= b.from && (fplPct < b.to || b.to === top.to)
  );
  if (!band) return null;

  if (band.final === band.initial) return band.initial;
  const position = (fplPct - band.from) / (band.to - band.from);
  return band.initial + position * (band.final - band.initial);
}

// Benchmark Silver plan annual premium by age and filing status (2026 national avg)
function getBenchmarkPremium(age: number, filingStatus: 'single' | 'married'): number {
  // Based on 2026 national average Silver plan premiums
  const singlePremiums: Record<string, number> = {
    '45-49': 7200,
    '50-54': 8640,
    '55-59': 11520,
    '60-64': 14400,
  };
  const marriedMultiplier = 1.85; // Two adults, slight discount vs 2x

  let basePremium: number;
  if (age < 50) basePremium = singlePremiums['45-49'];
  else if (age < 55) basePremium = singlePremiums['50-54'];
  else if (age < 60) basePremium = singlePremiums['55-59'];
  else basePremium = singlePremiums['60-64'];

  return filingStatus === 'married' ? basePremium * marriedMultiplier : basePremium;
}

export function calculateACASubsidy(
  magi: number,
  profile: UserProfile,
  regime: SubsidyRegime = ACTIVE_REGIME
): ACASubsidyResult {
  const fpl = FPL_FOR_2026_COVERAGE[profile.householdSize] || FPL_FOR_2026_COVERAGE[4];
  const fplPercentage = (magi / fpl) * 100;
  const benchmarkPremium = getBenchmarkPremium(profile.age, profile.filingStatus);
  const applicablePercentage = getApplicablePercentage(fplPercentage, regime);

  // Outside the 100%-400% band there is no premium tax credit at all, so the
  // household pays the full benchmark premium. This is the cliff, and modelling
  // it is the entire point of the product.
  if (applicablePercentage === null) {
    const ineligibleReason =
      fplPercentage < regime.floorFplPercentage ? 'below-100-fpl' : 'above-400-fpl';
    return {
      magi,
      fplPercentage,
      benchmarkPremium,
      maxContribution: benchmarkPremium,
      annualSubsidy: 0,
      monthlySubsidy: 0,
      netAnnualPremium: benchmarkPremium,
      netMonthlyPremium: benchmarkPremium / 12,
      costSharingReduction: false,
      subsidyCliffRisk: false,
      subsidyEligible: false,
      ineligibleReason,
      applicablePercentage: null,
    };
  }

  const maxContribution = Math.min(magi * applicablePercentage, benchmarkPremium);
  const annualSubsidy = Math.max(0, benchmarkPremium - maxContribution);
  const netAnnualPremium = benchmarkPremium - annualSubsidy;

  return {
    magi,
    fplPercentage,
    benchmarkPremium,
    maxContribution,
    annualSubsidy,
    monthlySubsidy: annualSubsidy / 12,
    netAnnualPremium,
    netMonthlyPremium: netAnnualPremium / 12,
    costSharingReduction: fplPercentage <= 250,
    // Within 5 percentage points of the cliff, a modest surprise in income
    // (a fund distribution, a 1099) wipes out the whole credit.
    // Only meaningful when a cliff exists to fall off.
    subsidyCliffRisk:
      regime.ceilingFplPercentage !== null &&
      fplPercentage >= regime.ceilingFplPercentage - 20 &&
      fplPercentage <= regime.ceilingFplPercentage,
    subsidyEligible: true,
    ineligibleReason: null,
    applicablePercentage,
  };
}

function buildNaivePrescription(profile: UserProfile): WithdrawalPrescription {
  // Naive strategy: just pull everything from Traditional IRA
  const needed = profile.annualSpending;
  const tradWithdrawal = Math.min(needed, profile.accounts.traditionalIRA);
  const remaining = needed - tradWithdrawal;
  const rothWithdrawal = Math.min(remaining, profile.accounts.rothIRA);

  return {
    traditionalIRAWithdrawal: tradWithdrawal,
    rothIRAWithdrawal: rothWithdrawal,
    brokerageSale: 0,
    brokerageGainRealized: 0,
    brokerageBasisReturned: 0,
    hsaWithdrawal: 0,
    totalCashGenerated: tradWithdrawal + rothWithdrawal,
    totalMAGI: tradWithdrawal, // Roth withdrawals don't count
  };
}

/**
 * Choose which accounts to draw from, and how much, to land MAGI in the band
 * where the subsidy is worth most.
 *
 * The objective is NOT "minimise MAGI". Below 100% FPL the premium tax credit
 * disappears entirely, exactly as it does above 400%, so there is a floor as
 * well as a ceiling. The strategy is therefore:
 *
 *   1. Cover spending from the sources that generate the least MAGI — Roth
 *      withdrawals first, then brokerage sales where only the gain counts.
 *   2. If that leaves MAGI below the floor, swap Roth dollars for Traditional
 *      IRA dollars until it clears. Same cash to spend, more MAGI, and it
 *      preserves Roth balance — which is the asset worth keeping.
 *
 * The floor carries a deliberate margin above 100% FPL. Landing exactly on the
 * line is fragile: a small estimate error at enrollment, and the household
 * lands underneath it.
 */
function buildOptimizedPrescription(profile: UserProfile): WithdrawalPrescription {
  const { accounts, annualSpending, householdSize } = profile;
  const fpl = FPL_FOR_2026_COVERAGE[householdSize] || FPL_FOR_2026_COVERAGE[4];

  /** Target MAGI floor, with margin above the 100% FPL eligibility line. */
  const floorMAGI = fpl * (MAGI_FLOOR_FPL_PERCENTAGE / 100);

  const gainRatio =
    accounts.brokerage > 0
      ? (accounts.brokerage - accounts.brokerageCostBasis) / accounts.brokerage
      : 0;

  // Step 1 — cover spending from the least MAGI-generating sources first.
  let need = annualSpending;

  let rothWithdrawal = Math.min(need, accounts.rothIRA);
  need -= rothWithdrawal;

  const brokerageSale = Math.min(need, accounts.brokerage);
  let brokerageGainRealized = brokerageSale * gainRatio;
  const brokerageBasisReturned = brokerageSale - brokerageGainRealized;
  need -= brokerageSale;

  let traditionalIRAWithdrawal = Math.min(need, accounts.traditionalIRA);
  need -= traditionalIRAWithdrawal;

  let totalMAGI = traditionalIRAWithdrawal + brokerageGainRealized;

  // Step 2 — if MAGI is under the floor, swap Roth dollars for Traditional
  // dollars. Cash generated is unchanged; MAGI rises to where the credit lives.
  const deficit = floorMAGI - totalMAGI;
  if (deficit > 0) {
    const headroomInTraditional = accounts.traditionalIRA - traditionalIRAWithdrawal;
    const shift = Math.min(deficit, rothWithdrawal, headroomInTraditional);
    if (shift > 0) {
      traditionalIRAWithdrawal += shift;
      rothWithdrawal -= shift;
      totalMAGI += shift;
    }
  }

  return {
    traditionalIRAWithdrawal,
    rothIRAWithdrawal: rothWithdrawal,
    brokerageSale,
    brokerageGainRealized,
    brokerageBasisReturned,
    hsaWithdrawal: 0,
    totalCashGenerated: traditionalIRAWithdrawal + rothWithdrawal + brokerageSale,
    totalMAGI,
  };
}

export function runOptimization(profile: UserProfile): OptimizationResult {
  const naivePrescription = buildNaivePrescription(profile);
  const optimizedPrescription = buildOptimizedPrescription(profile);

  const naiveSubsidy = calculateACASubsidy(naivePrescription.totalMAGI, profile);
  const optimizedSubsidy = calculateACASubsidy(optimizedPrescription.totalMAGI, profile);

  const annualSavings = naiveSubsidy.netAnnualPremium - optimizedSubsidy.netAnnualPremium;
  const subscriptionCost = 199; // Full Access annual price, matching the pricing page
  const roiMultiple = annualSavings > 0 ? Math.round(annualSavings / subscriptionCost) : 0;

  return {
    naive: { prescription: naivePrescription, subsidy: naiveSubsidy },
    optimized: { prescription: optimizedPrescription, subsidy: optimizedSubsidy },
    annualSavings,
    roiMultiple,
    subscriptionCost,
  };
}

// Demo profiles for the prototype
export const DEMO_PROFILES: Record<string, UserProfile> = {
  'couple_58': {
    age: 58,
    filingStatus: 'married',
    householdSize: 2,
    state: 'TX',
    annualSpending: 65000,
    zipCode: '78701',
    accounts: {
      traditionalIRA: 600000,
      rothIRA: 200000,
      brokerage: 400000,
      brokerageCostBasis: 240000, // 60% basis
      hsa: 18000,
    },
  },
  'single_52': {
    age: 52,
    filingStatus: 'single',
    householdSize: 1,
    state: 'CO',
    annualSpending: 45000,
    zipCode: '80202',
    accounts: {
      traditionalIRA: 450000,
      rothIRA: 150000,
      brokerage: 250000,
      brokerageCostBasis: 175000, // 70% basis
      hsa: 12000,
    },
  },
  'couple_47': {
    age: 47,
    filingStatus: 'married',
    householdSize: 4,
    state: 'WA',
    annualSpending: 80000,
    zipCode: '98101',
    accounts: {
      traditionalIRA: 800000,
      rothIRA: 300000,
      brokerage: 500000,
      brokerageCostBasis: 350000, // 70% basis
      hsa: 25000,
    },
  },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
