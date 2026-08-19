import { TrendingUp, Lock, Info } from "lucide-react";
import { formatCurrency, type OptimizationResult, type UserProfile } from "@/lib/optimizer";
import { buildPipeline, MEDICARE_AGE } from "@/lib/pipeline";

interface Props {
  profile: UserProfile;
  result: OptimizationResult;
  /** Years to project. Defaults to five. */
  horizon?: number;
}

export default function RothPipeline({ profile, result, horizon = 5 }: Props) {
  const startYear = new Date().getFullYear();
  const pipeline = buildPipeline(
    profile,
    result.optimized.prescription.totalMAGI,
    startYear,
    horizon
  );

  if (pipeline.yearsToMedicare === 0) {
    return (
      <div
        className="p-6 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold text-white">Roth Conversion Pipeline</span>
        </div>
        <p className="text-sm text-zinc-400">
          At {profile.age} you are already Medicare-eligible, so ACA subsidies no longer constrain
          your conversion decisions. The pipeline applies to the years before {MEDICARE_AGE}.
        </p>
      </div>
    );
  }

  const maxBar = Math.max(...pipeline.years.map((y) => y.totalMAGI), 1);

  return (
    <div
      className="p-5 sm:p-6 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: "#A855F7" }} />
          <span className="text-sm font-semibold text-white">Roth Conversion Pipeline</span>
        </div>
        <div className="text-xs text-zinc-500">
          {pipeline.years.length}-year projection · {pipeline.yearsToMedicare} years to Medicare
        </div>
      </div>
      <p className="text-xs text-zinc-500 mb-5 max-w-2xl leading-relaxed">
        Each year there is room between the MAGI your withdrawals already generate and your
        subsidy target. Converting into that room moves money from Traditional to Roth without
        costing subsidy. Every conversion is accessible penalty-free five tax years later.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total converted", value: formatCurrency(pipeline.totalConverted), color: "#A855F7" },
          { label: "Est. tax on conversions", value: formatCurrency(pipeline.totalConversionTax), color: "#F59E0B" },
          { label: "Subsidy retained", value: formatCurrency(pipeline.totalSubsidy), color: "#10B981" },
          {
            label: "Traditional remaining",
            value: formatCurrency(pipeline.traditionalRemainingAtMedicare),
            color: "#71717A",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-xs text-zinc-500 mb-1">{s.label}</div>
            <div className="text-base sm:text-lg font-bold" style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Year rows */}
      <div className="space-y-2">
        {pipeline.years.map((y) => {
          const basePct = (y.baseMAGI / maxBar) * 100;
          const convPct = (y.conversion / maxBar) * 100;
          return (
            <div
              key={y.year}
              className="p-3 sm:p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {y.year}
                  </span>
                  <span className="text-xs text-zinc-500">age {y.age}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "#A855F7" }}>
                  <span className="font-bold">{formatCurrency(y.conversion)}</span>
                  <span className="text-zinc-500">convert</span>
                </div>
              </div>

              {/* Stacked MAGI bar: base + conversion, against target */}
              <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className="absolute inset-y-0 left-0"
                  style={{ width: `${basePct}%`, background: "#007AFF" }}
                />
                <div
                  className="absolute inset-y-0"
                  style={{ left: `${basePct}%`, width: `${convPct}%`, background: "#A855F7" }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 flex-wrap">
                <span>
                  MAGI {formatCurrency(y.totalMAGI)} of {formatCurrency(y.targetMAGI)} target
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  accessible {y.accessibleIn}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend + assumptions */}
      <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-full" style={{ background: "#007AFF" }} /> Withdrawal MAGI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-full" style={{ background: "#A855F7" }} /> Conversion
        </span>
      </div>

      <div
        className="mt-4 p-3 rounded-xl flex gap-2 text-xs text-zinc-500 leading-relaxed"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Projection, not a forecast. Assumes {(pipeline.assumptions.growthRate * 100).toFixed(0)}% annual
          growth, {(pipeline.assumptions.inflationRate * 100).toFixed(1)}% inflation on spending and FPL
          thresholds, a {pipeline.assumptions.targetFplPercentage}% FPL target, and a{" "}
          {(pipeline.assumptions.effectiveTaxRate * 100).toFixed(0)}% effective rate on converted amounts.
          Real returns, future FPL levels, premium costs, and subsidy rules will all differ. Confirm any
          conversion with a tax professional before executing it.
        </span>
      </div>
    </div>
  );
}
