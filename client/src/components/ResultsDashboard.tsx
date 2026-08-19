import { useState } from "react";
import { CheckCircle2, ArrowRight, TrendingDown, DollarSign, Percent, Bell, RefreshCw, Calendar, AlertTriangle, TrendingUp, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type OptimizationResult,
  type UserProfile,
  formatCurrency,
} from "@/lib/optimizer";

interface Props {
  result: OptimizationResult;
  profile: UserProfile;
  onReset: () => void;
}

export default function ResultsDashboard({ result, profile, onReset }: Props) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setIsSubmitting(true);
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, profile, result, source: "optimizer" }),
      });
    } catch {
      /* never block the unlock on a network failure */
    } finally {
      setIsSubmitting(false);
      setIsUnlocked(true);
    }
  };

  const { naive, optimized, annualSavings, roiMultiple } = result;

  const subsidyChartData = [
    {
      name: "Without Optimizer",
      subsidy: naive.subsidy.annualSubsidy,
      premium: naive.subsidy.netAnnualPremium,
    },
    {
      name: "With Optimizer",
      subsidy: optimized.subsidy.annualSubsidy,
      premium: optimized.subsidy.netAnnualPremium,
    },
  ];

  const magiChartData = [
    { name: "Without Optimizer", magi: naive.prescription.totalMAGI },
    { name: "With Optimizer", magi: optimized.prescription.totalMAGI },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h2
            className="text-3xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Optimization Complete
          </h2>
        </div>
        <p className="text-zinc-400">
          Here is your personalized withdrawal prescription to maximize ACA subsidies.
        </p>
      </div>

      {/* Big Savings Number */}
      <div
        className="p-8 rounded-2xl mb-6 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at left, rgba(16,185,129,0.6) 0%, transparent 60%)" }}
        />
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Annual Savings</div>
            <div
              className="text-3xl sm:text-5xl font-extrabold tracking-tight"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: "linear-gradient(135deg, #10B981, #34D399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formatCurrency(annualSavings)}
            </div>
            <div className="text-zinc-500 text-sm mt-1">vs. unoptimized strategy</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Return on Investment</div>
            <div
              className="text-3xl sm:text-5xl font-extrabold tracking-tight"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: "linear-gradient(135deg, #007AFF, #A855F7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {roiMultiple}x
            </div>
            <div className="text-zinc-500 text-sm mt-1">vs. $150/yr subscription</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Your Net Premium</div>
            <div
              className="text-3xl sm:text-5xl font-extrabold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: optimized.subsidy.netAnnualPremium === 0 ? '#10B981' : '#FFFFFF' }}
            >
              {optimized.subsidy.netAnnualPremium === 0 ? 'FREE' : formatCurrency(optimized.subsidy.netAnnualPremium)}
            </div>
            <div className="text-zinc-500 text-sm mt-1">
              {optimized.subsidy.netAnnualPremium === 0
                ? 'Subsidy covers 100% of benchmark premium'
                : `per year (${formatCurrency(optimized.subsidy.netMonthlyPremium)}/mo)`}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* MAGI Comparison */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">MAGI Reduction</span>
          </div>
          <div className="flex items-end gap-6 justify-center" style={{ height: 160 }}>
            {[
              { label: "Without", value: naive.prescription.totalMAGI, color: "#EF4444", max: naive.prescription.totalMAGI },
              { label: "With", value: optimized.prescription.totalMAGI, color: "#10B981", max: naive.prescription.totalMAGI },
            ].map((bar) => {
              const pct = Math.max(8, (bar.value / bar.max) * 100);
              return (
                <div key={bar.label} className="flex flex-col items-center gap-2" style={{ width: 80 }}>
                  <span className="text-xs font-bold" style={{ color: bar.color }}>{formatCurrency(bar.value)}</span>
                  <div
                    style={{
                      width: 56,
                      height: `${pct * 1.2}px`,
                      background: bar.color,
                      borderRadius: "6px 6px 0 0",
                      opacity: 0.85,
                      transition: "height 0.5s ease",
                    }}
                  />
                  <span className="text-xs text-zinc-500">{bar.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-zinc-600 mt-3">
            <span>Before: {formatCurrency(naive.prescription.totalMAGI)}</span>
            <span className="text-emerald-400">After: {formatCurrency(optimized.prescription.totalMAGI)}</span>
          </div>
        </div>

        {/* Subsidy Comparison */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Annual Subsidy Received</span>
          </div>
          <div className="flex items-end gap-6 justify-center" style={{ height: 160 }}>
            {[
              { label: "Without", value: naive.subsidy.annualSubsidy, color: "#52525B", max: optimized.subsidy.annualSubsidy },
              { label: "With", value: optimized.subsidy.annualSubsidy, color: "#007AFF", max: optimized.subsidy.annualSubsidy },
            ].map((bar) => {
              const pct = Math.max(8, (bar.value / bar.max) * 100);
              return (
                <div key={bar.label} className="flex flex-col items-center gap-2" style={{ width: 80 }}>
                  <span className="text-xs font-bold" style={{ color: bar.color }}>{formatCurrency(bar.value)}</span>
                  <div
                    style={{
                      width: 56,
                      height: `${pct * 1.2}px`,
                      background: bar.color,
                      borderRadius: "6px 6px 0 0",
                      opacity: 0.85,
                      transition: "height 0.5s ease",
                    }}
                  />
                  <span className="text-xs text-zinc-500">{bar.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-zinc-600 mt-3">
            <span>Before: {formatCurrency(naive.subsidy.annualSubsidy)}</span>
            <span className="text-blue-400">After: {formatCurrency(optimized.subsidy.annualSubsidy)}</span>
          </div>
        </div>
      </div>

      {/* ── Email Gate ────────────────────────────────────────────────────── */}
      {!isUnlocked && (
        <div className="relative mb-6">
          {/* Blurred preview of the content below */}
          <div
            className="pointer-events-none select-none"
            style={{ filter: "blur(6px)", opacity: 0.45, userSelect: "none" }}
          >
            <div className="p-6 rounded-2xl mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-5">
                <Percent className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-white">Your Withdrawal Prescription</span>
              </div>
              <div className="space-y-3">
                {["Roth IRA Withdrawal", "Brokerage Sale", "Traditional IRA Withdrawal", "HSA Withdrawal"].map((label) => (
                  <div key={label} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      <div className="text-sm font-semibold text-white">{label}</div>
                    </div>
                    <div className="text-base font-bold text-white">$██,███</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">Your Year-Round Co-Pilot</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {["MAGI Monitor", "Q4 Roth Conversion", "5-Year Pipeline"].map((t) => (
                  <div key={t} className="p-4 rounded-xl bg-white/5 text-center">
                    <div className="text-xs text-zinc-500 mb-2">{t}</div>
                    <div className="text-lg font-bold text-white">$██,███</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gate overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(28,28,30,0.85) 25%, rgba(28,28,30,0.97) 50%)" }}
          >
            <div
              className="w-full max-w-md p-8 rounded-2xl text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.3)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)" }}
              >
                <Lock className="w-5 h-5" style={{ color: "#A855F7" }} />
              </div>
              <h3
                className="text-xl font-bold text-white mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Your full plan is ready
              </h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Enter your email to unlock your complete withdrawal prescription, Roth conversion ladder, and year-round co-pilot — free.
              </p>
              <form onSubmit={handleUnlock} className="flex flex-col gap-3">
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: emailError ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.12)" }}
                >
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                  />
                </div>
                {emailError && <p className="text-xs text-red-400 text-left -mt-1">{emailError}</p>}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 text-sm font-semibold rounded-xl text-white border-0 h-auto"
                  style={{ background: "linear-gradient(135deg, #A855F7, #007AFF)" }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" /> Unlocking...
                    </span>
                  ) : (
                    "Unlock My Full Plan →"
                  )}
                </Button>
                <p className="text-xs text-zinc-600">No credit card. No spam. Unsubscribe anytime.</p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Gated content — shown only after email capture */}
      {isUnlocked && (
        <>
      {/* Withdrawal Prescription */}
      <div
        className="p-6 rounded-2xl mb-6"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Percent className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Your Withdrawal Prescription</span>
        </div>
        <div className="space-y-3">
          {[
            {
              label: "Roth IRA Withdrawal",
              amount: optimized.prescription.rothIRAWithdrawal,
              magiImpact: 0,
              color: "#10B981",
              note: "Tax-free, zero MAGI impact",
            },
            {
              label: "Brokerage Sale (Cost Basis Return)",
              amount: optimized.prescription.brokerageBasisReturned,
              magiImpact: 0,
              color: "#10B981",
              note: "Returns your original investment, zero MAGI",
            },
            {
              label: "Brokerage Sale (Capital Gains)",
              amount: optimized.prescription.brokerageGainRealized,
              magiImpact: optimized.prescription.brokerageGainRealized,
              color: "#F59E0B",
              note: "Long-term capital gains — counts as MAGI",
            },
            {
              label: "Traditional IRA Withdrawal",
              amount: optimized.prescription.traditionalIRAWithdrawal,
              magiImpact: optimized.prescription.traditionalIRAWithdrawal,
              color: "#EF4444",
              note: "Ordinary income — counts as MAGI",
            },
          ].filter((item) => item.amount > 0).map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-zinc-500">{item.note}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-xs" style={{ color: item.magiImpact > 0 ? "#EF4444" : "#10B981" }}>
                  {item.magiImpact > 0 ? `+${formatCurrency(item.magiImpact)} MAGI` : "No MAGI impact"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div
          className="mt-4 pt-4 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <div className="text-xs text-zinc-500 mb-1">Total Cash Generated</div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {formatCurrency(optimized.prescription.totalCashGenerated)}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-600" />
          <div className="text-right">
            <div className="text-xs text-zinc-500 mb-1">Total MAGI</div>
            <div
              className="text-xl font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: "linear-gradient(135deg, #007AFF, #A855F7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formatCurrency(optimized.prescription.totalMAGI)}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-600" />
          <div className="text-right">
            <div className="text-xs text-zinc-500 mb-1">FPL Percentage</div>
            <div
              className="text-xl font-bold text-emerald-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {optimized.subsidy.fplPercentage.toFixed(0)}% FPL
            </div>
          </div>
        </div>
      </div>

      {/* CSR Badge */}
      {optimized.subsidy.costSharingReduction && (
        <div
          className="p-4 rounded-xl mb-6 flex items-center gap-3"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-emerald-400">Cost-Sharing Reduction (CSR) Eligible</div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Your MAGI is below 250% FPL — you qualify for reduced deductibles and out-of-pocket maximums on Silver plans.
            </div>
          </div>
        </div>
      )}

      {/* Year-Round Co-Pilot Section */}
      <div className="mt-8 mb-2">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: "#818cf8" }} />
          </div>
          <h3
            className="text-xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Your Year-Round Co-Pilot
          </h3>
        </div>
        <p className="text-zinc-500 text-sm mb-5 ml-11">
          MAGI optimization is not a once-a-year event. Here is what to watch for throughout the year.
        </p>

        {/* Pre-compute headroom to avoid complex JSX inline expressions */}
        {(() => {
          const cliff = profile.householdSize <= 1 ? 58320 : 78880;
          const headroom = Math.max(0, Math.round(cliff - optimized.prescription.totalMAGI - 1));
          const pipelineAmounts = [0,1,2,3,4].map(i => Math.min(headroom, 15000 + i * 2000));
          const pipelineTotal = pipelineAmounts.reduce((s,v) => s+v, 0);
          return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* MAGI Monitor */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4" style={{ color: "#818cf8" }} />
              <span className="text-sm font-semibold" style={{ color: "#a5b4fc" }}>Real-Time MAGI Monitor</span>
            </div>
            <div className="space-y-2">
              {[
                { event: "Freelance income received", risk: "high" },
                { event: "Fund capital gain distribution", risk: "high" },
                { event: "Portfolio rebalancing sale", risk: "medium" },
                { event: "Interest / dividend income", risk: "medium" },
              ].map((item) => (
                <div key={item.event} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{item.event}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: item.risk === "high" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: item.risk === "high" ? "#f87171" : "#fbbf24",
                    }}
                  >
                    {item.risk === "high" ? "Alert" : "Watch"}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-4 p-3 rounded-xl text-xs text-zinc-400"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-400" />
              Any of these events can push your MAGI over the subsidy cliff — triggering a loss of{" "}
              <span className="text-white font-semibold">{formatCurrency(optimized.subsidy.annualSubsidy)}</span> in annual subsidies.
            </div>
          </div>

          {/* Q4 Roth Conversion Window */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.25)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" style={{ color: "#22d3ee" }} />
              <span className="text-sm font-semibold" style={{ color: "#67e8f9" }}>Q4 Roth Conversion Window</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Every October–December, you have a narrow window to convert Traditional IRA funds to Roth — building long-term tax-free wealth without losing your subsidies.
            </p>
            <div
              className="p-3 rounded-xl mb-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="text-xs text-zinc-500 mb-1">Estimated MAGI Headroom</div>
              <div
                className="text-2xl font-extrabold"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: "linear-gradient(90deg, #06b6d4, #6366f1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {formatCurrency(headroom)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">available before the subsidy cliff</div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Converting up to this amount to Roth this year grows your penalty-free access pool — critical for the 45–55 FIRE cohort.
            </p>
          </div>

          {/* 5-Year Roth Pipeline */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">5-Year Roth Pipeline</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Each year's Roth conversion becomes available penalty-free after 5 years. Track your pipeline to ensure cash flow before age 59½.
            </p>
            <div className="space-y-2">
              {[2026, 2027, 2028, 2029, 2030].map((year, i) => {
                const suggestedConversion = pipelineAmounts[i];
                const availableYear = year + 5;
                return (
                  <div key={year} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white">{year}</span>
                      <span className="text-xs text-zinc-500 ml-2">→ available {availableYear}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{formatCurrency(suggestedConversion)}</span>
                  </div>
                );
              })}
            </div>
            <div
              className="mt-3 pt-3 flex justify-between items-center"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-xs text-zinc-500">5-Year Total</span>
              <span className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatCurrency(pipelineTotal)}
              </span>
            </div>
          </div>
        </div>
          );
        })()}
      </div>

      {/* Reset Button */}
      <div className="flex justify-center mt-4">
        <Button
          onClick={onReset}
          variant="outline"
          className="text-sm text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500 rounded-full px-6"
        >
          Try a Different Profile
        </Button>
      </div>
        </>
      )}
    </div>
  );
}
