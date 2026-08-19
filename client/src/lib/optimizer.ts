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
  costSharingReduction: boolean;   // CSR eligible (< 250% FPL)
  subsidyCliffRisk: boolean;       // Within $2,000 of 400% FPL cliff
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

// 2026 Federal Poverty Level (FPL) thresholds
const FPL_2026: Record<number, number> = {
  1: 15650,
  2: 21150,
  3: 26650,
  4: 32150,
  5: 37650,
  6: 43150,
  7: 48650,
  8: 54150,
};

// ACA contribution percentage table (2026 — enhanced subsidies extended)
// Maps FPL % range to max % of income user must contribute to benchmark premium
function getMaxContributionPercentage(fplPct: number): number {
  if (fplPct <= 133) return 0.0;
  if (fplPct <= 150) return 0.0;
  if (fplPct <= 200) return 0.02;
  if (fplPct <= 250) return 0.04;
  if (fplPct <= 300) return 0.06;
  if (fplPct <= 400) return 0.085;
  // With enhanced subsidies extended, cap at 8.5% above 400% FPL
  return 0.085;
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
  profile: UserProfile
): ACASubsidyResult {
  const fpl = FPL_2026[profile.householdSize] || FPL_2026[4];
  const fplPercentage = (magi / fpl) * 100;
  const benchmarkPremium = getBenchmarkPremium(profile.age, profile.filingStatus);
  const maxContributionPct = getMaxContributionPercentage(fplPercentage);
  const maxContribution = Math.min(magi * maxContributionPct, benchmarkPremium);
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
    subsidyCliffRisk: fplPercentage >= 380 && fplPercentage <= 410,
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

function buildOptimizedPrescription(profile: UserProfile): WithdrawalPrescription {
  const { accounts, annualSpending, householdSize, filingStatus } = profile;
  const fpl = FPL_2026[householdSize] || FPL_2026[4];
  
  // Target MAGI: ~175% FPL — sweet spot for CSR + large subsidy
  // But must be at least 100% FPL to qualify for subsidies
  const targetMAGI = Math.min(fpl * 1.75, fpl * 3.5);
  
  let remainingSpendingNeed = annualSpending;
  let currentMAGI = 0;

  // Step 1: Use Roth IRA withdrawals first (zero MAGI impact)
  const rothWithdrawal = Math.min(remainingSpendingNeed * 0.45, accounts.rothIRA);
  remainingSpendingNeed -= rothWithdrawal;

  // Step 2: Use brokerage cost basis return (zero MAGI impact)
  const brokerageGainRatio = accounts.brokerage > 0
    ? (accounts.brokerage - accounts.brokerageCostBasis) / accounts.brokerage
    : 0;
  
  // How much brokerage can we sell while keeping gains within MAGI budget?
  const magiRemainingBudget = Math.max(0, targetMAGI - currentMAGI);
  const maxBrokerageSaleForMAGI = brokerageGainRatio > 0
    ? magiRemainingBudget / brokerageGainRatio
    : accounts.brokerage;
  
  const brokerageSale = Math.min(
    remainingSpendingNeed * 0.4,
    accounts.brokerage,
    maxBrokerageSaleForMAGI
  );
  const brokerageGainRealized = brokerageSale * brokerageGainRatio;
  const brokerageBasisReturned = brokerageSale - brokerageGainRealized;
  currentMAGI += brokerageGainRealized;
  remainingSpendingNeed -= brokerageSale;

  // Step 3: Fill remaining from Traditional IRA, up to MAGI target
  const tradWithdrawal = Math.min(
    remainingSpendingNeed,
    accounts.traditionalIRA,
    Math.max(0, targetMAGI - currentMAGI)
  );
  currentMAGI += tradWithdrawal;
  remainingSpendingNeed -= tradWithdrawal;

  // Step 4: Any remaining gap filled from Roth (still zero MAGI)
  const additionalRoth = Math.min(remainingSpendingNeed, accounts.rothIRA - rothWithdrawal);
  const totalRoth = rothWithdrawal + additionalRoth;

  const totalMAGI = tradWithdrawal + brokerageGainRealized;

  return {
    traditionalIRAWithdrawal: tradWithdrawal,
    rothIRAWithdrawal: totalRoth,
    brokerageSale,
    brokerageGainRealized,
    brokerageBasisReturned,
    hsaWithdrawal: 0,
    totalCashGenerated: tradWithdrawal + totalRoth + brokerageSale,
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
