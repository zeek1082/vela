// History.tsx — My Optimization History
// Shows past optimization runs stored locally in this browser.

import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { getHistory, type HistoryRun } from "@/lib/history";
import { Button } from "@/components/ui/button";
import {
  Calculator, ArrowLeft, TrendingDown, Clock,
  CheckCircle, ChevronRight, Sparkles, BarChart2,
  DollarSign, RefreshCw,
} from "lucide-react";
import { LOGO_URL } from "@/lib/brand";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDollar(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

function SavingsBadge({ savings }: { savings: number }) {
  const color = savings > 10000 ? "#22c55e" : savings > 5000 ? "#f59e0b" : "#007AFF";
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: `${color}18`, color }}
    >
      <TrendingDown className="w-3 h-3" />
      Saving {formatDollar(savings)}/yr
    </div>
  );
}

// ─── Run Card ─────────────────────────────────────────────────────────────────
function RunCard({ run, index }: { run: HistoryRun; index: number }) {
  const result = run.result as any;
  const profile = run.profile as any;
  const savings = result?.annualSavings ?? 0;
  const optimizedMagi = result?.optimized?.subsidy?.magi ?? 0;
  const naiveMagi = result?.naive?.subsidy?.magi ?? 0;
  const magiReduction = naiveMagi - optimizedMagi;
  const roiMultiple = result?.roiMultiple ?? 0;
  const isLatest = index === 0;

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: isLatest
          ? "rgba(0,122,255,0.05)"
          : "rgba(255,255,255,0.02)",
        border: isLatest
          ? "1px solid rgba(0,122,255,0.3)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {isLatest && (
        <div
          className="absolute top-0 right-0 text-xs font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-xl"
          style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)", color: "white" }}
        >
          Latest
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">
              {formatDate(run.createdAt)} at {formatTime(run.createdAt)}
            </span>
          </div>
          <div className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Run — Age {profile?.age ?? "—"}, {profile?.filingStatus === "married" ? "Married" : "Single"}
          </div>
          <div className="text-zinc-500 text-sm mt-0.5">
            {profile?.state ?? "—"} · Household size {profile?.householdSize ?? 1} · Spending goal {formatDollar(profile?.annualSpending ?? 0)}/yr
          </div>
        </div>
        <SavingsBadge savings={savings} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {[
          {
            icon: <DollarSign className="w-4 h-4" />,
            label: "Annual Savings",
            value: formatDollar(savings),
            color: "#22c55e",
          },
          {
            icon: <BarChart2 className="w-4 h-4" />,
            label: "Optimized MAGI",
            value: formatDollar(optimizedMagi),
            color: "#007AFF",
          },
          {
            icon: <TrendingDown className="w-4 h-4" />,
            label: "MAGI Reduction",
            value: formatDollar(magiReduction),
            color: "#A855F7",
          },
          {
            icon: <Sparkles className="w-4 h-4" />,
            label: "ROI Multiple",
            value: `${roiMultiple}x`,
            color: "#f59e0b",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-1.5 mb-2" style={{ color: stat.color }}>
              {stat.icon}
              <span className="text-xs text-zinc-500">{stat.label}</span>
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Withdrawal prescription summary */}
      {result?.optimized?.prescription && (
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Optimized Withdrawal Prescription
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Roth IRA",
                value: result.optimized.prescription.rothIRAWithdrawal,
                note: "Tax-free · No MAGI impact",
                color: "#22c55e",
              },
              {
                label: "Brokerage",
                value: result.optimized.prescription.brokerageSale,
                note: `Gain: ${formatDollar(result.optimized.prescription.brokerageGainRealized)} counts as MAGI`,
                color: "#007AFF",
              },
              {
                label: "Traditional IRA",
                value: result.optimized.prescription.traditionalIRAWithdrawal,
                note: "100% counts as MAGI",
                color: "#f59e0b",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="text-xs text-zinc-500">{item.label}</div>
                <div className="font-bold text-sm" style={{ color: item.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatDollar(item.value)}
                </div>
                <div className="text-xs text-zinc-600 leading-tight">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  const [, navigate] = useLocation();
  return (
    <div
      className="rounded-2xl p-12 text-center"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}
      >
        <Calculator className="w-7 h-7" />
      </div>
      <h3
        className="text-xl font-bold text-white mb-3"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        No optimization runs yet
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
        Run your first optimization to see how much you could save on healthcare costs this year.
      </p>
      <Button
        onClick={() => navigate("/optimize")}
        className="px-8 py-3 text-sm font-semibold rounded-xl text-white border-0 h-auto"
        style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
      >
        Run My First Optimization
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function History() {
  const [, navigate] = useLocation();
  const [history, setHistory] = useState<HistoryRun[] | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const isLoading = history === null;

  const totalSavings = history?.reduce(
    (sum, run) => sum + (run.result?.annualSavings ?? 0),
    0
  ) ?? 0;

  const runCount = history?.length ?? 0;

  return (
    <div className="min-h-screen text-white" style={{ background: "#1c1c1e" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-5 sm:py-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Vela" className="w-9 h-9 object-contain" />
          <span
            className="font-bold text-xl text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Vela
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <Button
            onClick={() => navigate("/optimize")}
            className="text-sm font-semibold px-5 py-2 rounded-full text-white border-0 h-auto"
            style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
          >
            New Optimization
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        {/* Header */}
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold"
            style={{ background: "rgba(0,122,255,0.1)", border: "1px solid rgba(0,122,255,0.25)", color: "#007AFF" }}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Optimization History
          </div>
          <h1
            className="text-4xl font-extrabold text-white mb-3 tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            My Optimization Runs
          </h1>
          <p className="text-zinc-400 text-lg">
            Every time you run the optimizer, your results are saved here.
          </p>
        </div>

        {/* Summary stats — only show if there are runs */}
        {!isLoading && runCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
            {[
              {
                label: "Total Runs",
                value: runCount.toString(),
                sub: "Optimizations completed",
                color: "#007AFF",
                icon: <RefreshCw className="w-5 h-5" />,
              },
              {
                label: "Latest Annual Savings",
                value: formatDollar(history![0]?.result?.annualSavings ?? 0),
                sub: "From most recent run",
                color: "#22c55e",
                icon: <TrendingDown className="w-5 h-5" />,
              },
              {
                label: "Cumulative Savings Identified",
                value: formatDollar(totalSavings),
                sub: "Across all runs",
                color: "#A855F7",
                icon: <DollarSign className="w-5 h-5" />,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2 mb-3" style={{ color: stat.color }}>
                  {stat.icon}
                  <span className="text-sm text-zinc-400">{stat.label}</span>
                </div>
                <div
                  className="text-3xl font-extrabold mb-1"
                  style={{ color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-zinc-600">{stat.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {(isLoading) && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl h-48 animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)" }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && runCount === 0 && <EmptyState />}

        {/* Run list */}
        {!isLoading && runCount > 0 && (
          <div className="space-y-5">
            {history!.map((run, i) => (
              <RunCard key={run.id} run={run} index={i} />
            ))}
          </div>
        )}

        {/* CTA at bottom */}
        {!isLoading && runCount > 0 && (
          <div
            className="mt-10 p-6 rounded-2xl flex items-center justify-between"
            style={{ background: "rgba(0,122,255,0.05)", border: "1px solid rgba(0,122,255,0.15)" }}
          >
            <div>
              <div className="text-white font-semibold mb-1">Ready to run a new optimization?</div>
              <div className="text-zinc-400 text-sm">
                Update your numbers for this year and get a fresh withdrawal prescription.
              </div>
            </div>
            <Button
              onClick={() => navigate("/optimize")}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl text-white border-0 h-auto shrink-0"
              style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
            >
              Run Optimization
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
