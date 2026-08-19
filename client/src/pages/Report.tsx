/**
 * Report.tsx — the printable optimization report.
 *
 * This is the artifact the Starter Report tier sells: a self-contained document
 * a household can read on their own or hand to an advisor. It renders from a
 * saved run in local history, so it works without an account.
 *
 * Printing is the browser's own print-to-PDF. That keeps the output vector,
 * searchable, and dependency-free, and it prints identically everywhere.
 */

import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/optimizer";
import { getHistory, type HistoryRun } from "@/lib/history";
import { buildPipeline, buildActionCalendar, MEDICARE_AGE } from "@/lib/pipeline";
import { LOGO_URL } from "@/lib/brand";

export default function Report() {
  const [, params] = useRoute("/report/:id");
  const [run, setRun] = useState<HistoryRun | null | undefined>(undefined);

  useEffect(() => {
    const history = getHistory();
    if (!history.length) {
      setRun(null);
      return;
    }
    const id = params?.id;
    setRun((id && history.find((r) => r.id === id)) || history[0]);
  }, [params?.id]);

  if (run === undefined) {
    return <div className="min-h-screen" style={{ background: "#1c1c1e" }} />;
  }

  if (run === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "#1c1c1e" }}>
        <div className="max-w-md text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-amber-400" />
          <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            No optimization to report on
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            Reports are generated from a saved run on this device. Run the optimizer first.
          </p>
          <Link href="/optimize">
            <Button
              className="px-6 py-3 text-sm font-semibold rounded-xl text-white border-0 h-auto"
              style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
            >
              Run the optimizer
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { profile, result } = run;
  const { naive, optimized, annualSavings } = result;
  const generated = new Date(run.createdAt);
  const startYear = generated.getFullYear();

  const pipeline = buildPipeline(profile, optimized.prescription.totalMAGI, startYear, 5);
  const firstYear = pipeline.years[0];
  const calendar = buildActionCalendar(
    firstYear?.targetMAGI ?? optimized.prescription.totalMAGI,
    firstYear?.headroom ?? 0,
    formatCurrency
  );

  const rows: { label: string; amount: number; magi: number; note: string }[] = [
    {
      label: "Roth IRA withdrawal",
      amount: optimized.prescription.rothIRAWithdrawal,
      magi: 0,
      note: "Contributions and seasoned conversions come out tax-free and do not count toward MAGI.",
    },
    {
      label: "Taxable brokerage sale",
      amount: optimized.prescription.brokerageSale,
      magi: optimized.prescription.brokerageGainRealized,
      note: `Only the realized gain counts. ${formatCurrency(optimized.prescription.brokerageBasisReturned)} of this is return of basis and is invisible to MAGI.`,
    },
    {
      label: "Traditional IRA withdrawal",
      amount: optimized.prescription.traditionalIRAWithdrawal,
      magi: optimized.prescription.traditionalIRAWithdrawal,
      note: "Counts fully toward MAGI. Sized to fill the remaining room under the target, and no more.",
    },
  ].filter((r) => r.amount > 0);

  return (
    <div className="report-root min-h-screen text-white" style={{ background: "#1c1c1e" }}>
      <style>{`
        @media print {
          @page { margin: 16mm 14mm; size: letter; }
          html, body { background: #fff !important; }
          .report-root { background: #fff !important; color: #111 !important; }
          .no-print { display: none !important; }
          .report-page { max-width: none !important; padding: 0 !important; }
          .print-card {
            background: #fff !important;
            border: 1px solid #d4d4d8 !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-dark { color: #111 !important; }
          .print-muted { color: #52525b !important; }
          .print-break { break-before: page; page-break-before: always; }
          h1, h2, h3 { color: #111 !important; }
          table { break-inside: auto; }
          tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div
        className="no-print sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/5"
        style={{ background: "rgba(28,28,30,0.9)", backdropFilter: "blur(8px)" }}
      >
        <Link href="/history">
          <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </Link>
        <Button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white border-0 h-auto"
          style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="report-page max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Masthead */}
        <header className="flex items-start justify-between gap-4 pb-6 mb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={LOGO_URL} alt="" className="w-7 h-7 object-contain" />
              <span className="font-bold text-lg print-dark" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Vela
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight print-dark"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              MAGI Optimization Report
            </h1>
            <p className="text-sm text-zinc-400 print-muted mt-1">
              {startYear} plan year · prepared{" "}
              {generated.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </header>

        {/* Household */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 print-muted mb-3">
            Household
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Age", value: String(profile.age) },
              { label: "Filing status", value: profile.filingStatus === "married" ? "Married" : "Single" },
              { label: "Household size", value: String(profile.householdSize) },
              { label: "Annual spending", value: formatCurrency(profile.annualSpending) },
            ].map((f) => (
              <div
                key={f.label}
                className="print-card p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="text-xs text-zinc-500 print-muted mb-1">{f.label}</div>
                <div className="text-sm font-bold print-dark">{f.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Headline result */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 print-muted mb-3">
            Result
          </h2>
          <div
            className="print-card p-5 rounded-2xl mb-3"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <div className="text-xs text-zinc-500 print-muted mb-1">
              Modelled reduction in {startYear} premiums
            </div>
            <div
              className="text-3xl sm:text-4xl font-extrabold text-emerald-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {formatCurrency(annualSavings)}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 print-muted">
                <th className="py-2 font-semibold">&nbsp;</th>
                <th className="py-2 font-semibold text-right">Unoptimized</th>
                <th className="py-2 font-semibold text-right">Optimized</th>
              </tr>
            </thead>
            <tbody className="print-dark">
              {[
                {
                  label: "MAGI",
                  a: formatCurrency(naive.prescription.totalMAGI),
                  b: formatCurrency(optimized.prescription.totalMAGI),
                },
                {
                  label: "% of Federal Poverty Level",
                  // fplPercentage is already expressed as a percentage (128 = 128%),
                  // so it must not be multiplied again by formatPercent.
                  a: `${Math.round(naive.subsidy.fplPercentage)}%`,
                  b: `${Math.round(optimized.subsidy.fplPercentage)}%`,
                },
                {
                  label: "Annual premium tax credit",
                  a: formatCurrency(naive.subsidy.annualSubsidy),
                  b: formatCurrency(optimized.subsidy.annualSubsidy),
                },
                {
                  label: "Premium you pay",
                  a: formatCurrency(naive.subsidy.netAnnualPremium),
                  b: formatCurrency(optimized.subsidy.netAnnualPremium),
                },
              ].map((r) => (
                <tr key={r.label} className="border-t border-white/5">
                  <td className="py-2.5 text-zinc-300 print-dark">{r.label}</td>
                  <td className="py-2.5 text-right text-zinc-500 print-muted">{r.a}</td>
                  <td className="py-2.5 text-right font-bold">{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Prescription */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 print-muted mb-1">
            Withdrawal prescription
          </h2>
          <p className="text-sm text-zinc-400 print-muted mb-4">
            Where to take {formatCurrency(profile.annualSpending)} from, and what each source does to MAGI.
          </p>
          <div className="space-y-2.5">
            {rows.map((r) => (
              <div
                key={r.label}
                className="print-card p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                  <span className="text-sm font-bold print-dark">{r.label}</span>
                  <span className="text-sm font-bold print-dark">{formatCurrency(r.amount)}</span>
                </div>
                <div className="text-xs text-zinc-500 print-muted mb-1.5">
                  Counts toward MAGI: <strong className="print-dark">{formatCurrency(r.magi)}</strong>
                </div>
                <p className="text-xs text-zinc-400 print-muted leading-relaxed">{r.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        {pipeline.yearsToMedicare > 0 && (
          <section className="mb-8 print-break">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 print-muted mb-1">
              Roth conversion pipeline
            </h2>
            <p className="text-sm text-zinc-400 print-muted mb-4">
              {pipeline.yearsToMedicare} years remain before Medicare at {MEDICARE_AGE}. Each year has room
              under the MAGI target that a conversion can fill. Each conversion is accessible
              penalty-free five tax years later.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 print-muted">
                  <th className="py-2 font-semibold">Year</th>
                  <th className="py-2 font-semibold text-right">Convert</th>
                  <th className="py-2 font-semibold text-right">Total MAGI</th>
                  <th className="py-2 font-semibold text-right">Est. tax</th>
                  <th className="py-2 font-semibold text-right">Accessible</th>
                </tr>
              </thead>
              <tbody className="print-dark">
                {pipeline.years.map((y) => (
                  <tr key={y.year} className="border-t border-white/5">
                    <td className="py-2.5">
                      {y.year} <span className="text-zinc-500 print-muted">· {y.age}</span>
                    </td>
                    <td className="py-2.5 text-right font-bold">{formatCurrency(y.conversion)}</td>
                    <td className="py-2.5 text-right text-zinc-400 print-muted">{formatCurrency(y.totalMAGI)}</td>
                    <td className="py-2.5 text-right text-zinc-400 print-muted">
                      {formatCurrency(y.conversionTaxCost)}
                    </td>
                    <td className="py-2.5 text-right text-zinc-400 print-muted">{y.accessibleIn}</td>
                  </tr>
                ))}
                <tr className="border-t border-white/20 font-bold">
                  <td className="py-2.5">Total</td>
                  <td className="py-2.5 text-right">{formatCurrency(pipeline.totalConverted)}</td>
                  <td className="py-2.5" />
                  <td className="py-2.5 text-right">{formatCurrency(pipeline.totalConversionTax)}</td>
                  <td className="py-2.5" />
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* Calendar */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 print-muted mb-1">
            {startYear} action calendar
          </h2>
          <p className="text-sm text-zinc-400 print-muted mb-4">
            The dates that decide the outcome.
          </p>
          <div className="space-y-2">
            {calendar.map((c, i) => (
              <div
                key={i}
                className="print-card p-3.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-bold print-dark">{c.title}</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: c.urgency === "deadline" ? "#EF4444" : c.urgency === "window" ? "#007AFF" : "#10B981" }}
                  >
                    {c.when}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 print-muted leading-relaxed">{c.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Method and limits */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 print-muted mb-3">
            Method and limits
          </h2>
          <div className="space-y-3 text-xs text-zinc-400 print-muted leading-relaxed">
            <p>
              <strong className="print-dark">What this is.</strong> Every figure here is produced by
              modelling the household's own inputs against 2026 Federal Poverty Level thresholds and
              the ACA premium contribution schedule. Nothing is drawn from other households or
              historical averages.
            </p>
            <p>
              <strong className="print-dark">Benchmark premiums are estimates.</strong> The subsidy
              calculation uses national average Silver plan premiums by age band. Actual benchmark
              premiums are set by rating area and vary substantially by county. A local quote will
              move these numbers.
            </p>
            <p>
              <strong className="print-dark">Projections assume conditions that will change.</strong>{" "}
              The pipeline assumes {(pipeline.assumptions.growthRate * 100).toFixed(0)}% annual growth,{" "}
              {(pipeline.assumptions.inflationRate * 100).toFixed(1)}% inflation, and a{" "}
              {(pipeline.assumptions.effectiveTaxRate * 100).toFixed(0)}% effective rate on conversions.
              Returns, FPL levels, premiums, and the subsidy rules themselves will all differ from these
              assumptions over a multi-year horizon.
            </p>
            <p>
              <strong className="print-dark">This is not tax or investment advice.</strong> Vela is
              software, not a licensed advisor. State taxes, the ACA repayment rules for
              underestimating income, Social Security taxation, IRMAA once Medicare begins, and the
              early-withdrawal penalty rules for your specific accounts are all outside this model.
              Confirm any conversion or large withdrawal with a tax professional before executing it.
            </p>
          </div>
        </section>

        <footer className="pt-6 border-t border-white/10 text-xs text-zinc-600 print-muted">
          Generated by Vela · {generated.toLocaleString()} · Figures are modelled projections, not
          guaranteed outcomes.
        </footer>
      </div>
    </div>
  );
}
