import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowRight, TrendingDown, Shield, Calculator, ChevronRight, Mail, CheckCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { LOGO_URL } from "@/lib/brand";

const cliffData = [
  { magi: 20000, subsidy: 28400, label: "$20k" },
  { magi: 30000, subsidy: 24200, label: "$30k" },
  { magi: 40000, subsidy: 20100, label: "$40k" },
  { magi: 50000, subsidy: 16800, label: "$50k" },
  { magi: 60000, subsidy: 13200, label: "$60k" },
  { magi: 70000, subsidy: 9400, label: "$70k" },
  { magi: 78000, subsidy: 5800, label: "$78k" },
  { magi: 81000, subsidy: 2100, label: "$81k" },
  { magi: 81760, subsidy: 1200, label: "$81.7k" },
  { magi: 81761, subsidy: 0, label: "$81.8k" },
  { magi: 85000, subsidy: 0, label: "$85k" },
  { magi: 90000, subsidy: 0, label: "$90k" },
  { magi: 100000, subsidy: 0, label: "$100k" },
];

const personas = [
  {
    name: "Sarah K.",
    age: 51,
    title: "Retired Software Engineer",
    location: "Austin, TX",
    story: "I left my job at 51 with $1.8M saved. I thought I had everything figured out — until I realized my planned withdrawals would push me $4,000 over the subsidy cliff and cost me $18,000 in healthcare premiums. Vela showed me I could take $22,000 from my Roth instead of my IRA and save $16,400 that year alone.",
    savings: "$16,400/yr",
    accentColor: "#007AFF",
  },
  {
    name: "Marcus & Jen T.",
    age: 47,
    title: "FIRE at 45 — Both Retired",
    location: "Denver, CO",
    story: "We retired at 45 and have 18 years before Medicare. Our biggest fear was healthcare costs compounding over two decades. Vela's Roth conversion ladder showed us exactly how much to convert each year — building tax-free income for our 60s while keeping our ACA subsidies intact in our 40s and 50s.",
    savings: "$14,800/yr",
    accentColor: "#A855F7",
  },
  {
    name: "David R.",
    age: 58,
    title: "Former Small Business Owner",
    location: "Nashville, TN",
    story: "I sold my business and retired at 58. My accountant told me to just take IRA distributions — he had no idea about ACA subsidies. Vela showed me I was leaving $12,000 a year on the table. I now use a mix of taxable account sales and partial IRA withdrawals to stay right at 300% FPL.",
    savings: "$12,000/yr",
    accentColor: "#06B6D4",
  },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-white overflow-hidden relative">
      {/* Ambient glow orbs */}
      <div
        className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,122,255,0.4) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div
        className="fixed bottom-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)", filter: "blur(100px)" }}
      />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Vela" className="w-9 h-9 object-contain" />
          <span className="font-display font-700 text-xl text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
            Vela
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-sm text-zinc-400">Early Access</span>
          <Link href="/history">
            <button className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2">
              My History
            </button>
          </Link>
          <Button
            onClick={() => navigate("/optimize")}
            className="text-sm font-semibold px-5 py-2 rounded-full text-white border-0"
            style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
          >
            Try the Tool
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu — full-screen slide-out drawer */}
      <div
        className={`fixed inset-0 z-40 sm:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 sm:hidden w-72 flex flex-col transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "#1c1c1e", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Vela" className="w-8 h-8 object-contain" />
            <span className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Vela</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex flex-col gap-1 px-4 py-5 flex-1">
          <div className="px-3 py-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Navigation</span>
          </div>
          <Link href="/history" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,122,255,0.12)" }}>
                <Shield className="w-4 h-4" style={{ color: "#007AFF" }} />
              </div>
              <div>
                <div className="text-sm font-medium">My History</div>
                <div className="text-xs text-zinc-500">Past optimization runs</div>
              </div>
            </div>
          </Link>
          <Link href="/optimize" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.12)" }}>
                <Calculator className="w-4 h-4" style={{ color: "#A855F7" }} />
              </div>
              <div>
                <div className="text-sm font-medium">Run Optimizer</div>
                <div className="text-xs text-zinc-500">Find your optimal withdrawal mix</div>
              </div>
            </div>
          </Link>
        </nav>

        {/* Drawer CTA */}
        <div className="px-4 pb-8 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <Button
            onClick={() => { navigate("/optimize"); setMobileMenuOpen(false); }}
            className="w-full py-3 text-sm font-semibold rounded-xl text-white border-0 h-auto mt-4"
            style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
          >
            Try the Tool — Free
          </Button>
          <p className="text-xs text-zinc-600 text-center mt-2">Results in 5 minutes · No account required</p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8 text-xs sm:text-sm font-semibold"
            style={{ background: "rgba(0,122,255,0.1)", border: "1px solid rgba(0,122,255,0.3)", color: "#007AFF" }}>
            <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
            For Early Retirees & FIRE Community
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-5 sm:mb-6 tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="text-white">Healthcare shouldn't be</span><br />
            <span style={{
              background: "linear-gradient(135deg, #007AFF 0%, #A855F7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              the reason you keep working.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-400 leading-relaxed mb-8 sm:mb-10 max-w-2xl">
            Vela analyzes your retirement accounts, finds the optimal withdrawal strategy, and maximizes your ACA healthcare subsidies — saving the average early retiree over <strong className="text-white">$14,000 per year</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate("/optimize")}
              className="flex items-center gap-2 text-base font-semibold rounded-full text-white border-0 h-auto w-full sm:w-auto justify-center"
              style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)", paddingLeft: "6rem", paddingRight: "6rem", paddingTop: "1.25rem", paddingBottom: "1.25rem" }}
            >
              Run My Optimization
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-14 sm:mt-20">
          {[
            { value: "$14,200", label: "Average Annual Savings", sub: "Per household" },
            { value: "94x", label: "Return on Investment", sub: "vs. $150/yr subscription" },
            { value: "11M+", label: "Americans Eligible", sub: "Pre-Medicare retirees" },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: "linear-gradient(135deg, #007AFF 0%, #A855F7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </div>
              <div className="text-white font-semibold mb-1">{stat.label}</div>
              <div className="text-zinc-500 text-sm">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="text-center mb-10 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            How It Works
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto">
            Four steps to unlock thousands in annual healthcare savings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              step: "01",
              icon: <Shield className="w-5 h-5" />,
              title: "Enter Your Profile",
              desc: "Age, filing status, household size, and annual spending goal.",
            },
            {
              step: "02",
              icon: <Calculator className="w-5 h-5" />,
              title: "Connect Accounts",
              desc: "Enter balances for your Traditional IRA, Roth IRA, and brokerage accounts.",
            },
            {
              step: "03",
              icon: <TrendingDown className="w-5 h-5" />,
              title: "Run Optimization",
              desc: "Our engine calculates the optimal withdrawal mix to minimize your MAGI.",
            },
            {
              step: "04",
              icon: <ArrowRight className="w-5 h-5" />,
              title: "Get Your Prescription",
              desc: "Receive a precise, actionable withdrawal plan with projected subsidy savings.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-2xl relative"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="text-xs font-bold tracking-widest mb-4 uppercase"
                style={{ color: "#007AFF" }}
              >
                {item.step}
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}
              >
                {item.icon}
              </div>
              <h3
                className="text-white font-semibold text-base sm:text-lg mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {item.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Vela Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="mb-10 sm:mb-16">
          <div
            className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7" }}
          >
            Why Vela?
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            "Couldn't I just figure this out myself?"
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl">
            The concept is simple. The execution has four compounding layers of complexity that make it genuinely hard to get right — every single year.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {[
            {
              number: "01",
              title: "Not all money is equal.",
              body: "A dollar from a Roth IRA is invisible to the IRS. A dollar from a Traditional IRA is fully taxable income. A dollar from selling a stock is partially taxable — only the gain, not your original investment. A dollar from an HSA spent on medical bills is tax-free. Most people don't know these distinctions, let alone how to sequence them.",
              accent: "#007AFF",
            },
            {
              number: "02",
              title: "The cliff is brutally nonlinear.",
              body: "Below 400% FPL, every extra dollar of MAGI gradually reduces your subsidy. Cross that line by $1, and you lose the entire subsidy instantly — potentially $15,000–$20,000 gone in a single dollar of income. The optimization isn't just \"minimize income\" — it's \"maximize income right up to but not over a very specific number.\" That requires precise calculation, not intuition.",
              accent: "#EC4899",
            },
            {
              number: "03",
              title: "The number changes every year.",
              body: "The Federal Poverty Level is updated annually. Silver plan benchmark premiums in your zip code change every year. Your account balances shift. Capital gain distributions from your mutual funds are unpredictable. The right answer from last year is wrong this year — and getting it wrong costs you thousands.",
              accent: "#A855F7",
            },
            {
              number: "04",
              title: "There are competing goals.",
              body: "A 50-year-old FIRE retiree doesn't just want cheap healthcare — they also want to build their Roth IRA for tax-free income later. Every dollar not converted to Roth today will be taxed as ordinary income in their 70s when Required Minimum Distributions kick in. The real optimization is a multi-year puzzle: how much to convert each year to minimize lifetime taxes while staying under the ACA cliff. That's a linear programming problem — exactly what Vela solves.",
              accent: "#06B6D4",
            },
          ].map((layer, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-2xl relative"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${layer.accent}22` }}
            >
              <div
                className="text-4xl sm:text-5xl font-extrabold mb-4 sm:mb-5 tracking-tight"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: layer.accent,
                  opacity: 0.25,
                  lineHeight: 1,
                }}
              >
                {layer.number}
              </div>
              <h3
                className="text-lg sm:text-xl font-bold mb-3 text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span style={{ color: layer.accent }}>Layer {layer.number.replace('0', '')} — </span>
                {layer.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{layer.body}</p>
            </div>
          ))}
        </div>

        <div
          className="mt-8 sm:mt-10 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
          style={{ background: "rgba(0,122,255,0.05)", border: "1px solid rgba(0,122,255,0.15)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl font-bold"
            style={{ background: "rgba(0,122,255,0.15)", color: "#007AFF", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            ≈
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">
            <strong className="text-white">The analogy:</strong> Everyone knows what a tax bracket is. But almost nobody manually calculates exactly how much to contribute to their 401(k) to stay in the 22% bracket. That's why TurboTax exists — not because the concept is secret, but because the <em>precise annual execution</em> is hard to get right. Vela does the same thing, but for the ACA subsidy cliff.
          </p>
        </div>
      </section>

      {/* The Cliff Visualized */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <div
              className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
              style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", color: "#EC4899" }}
            >
              The Cliff Visualized
            </div>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 sm:mb-5"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              One dollar can cost you{" "}
              <span style={{ color: "#EC4899" }}>$20,000.</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
              This is the ACA subsidy cliff. Below 400% of the Federal Poverty Level (~$81,760 for a couple in 2026), you receive thousands in annual subsidies. Cross that line by a single dollar and you lose every penny instantly.
            </p>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Vela calculates exactly where your income will land and prescribes the precise withdrawal mix to keep you safely below the cliff — every year.
            </p>
          </div>
          <div>
            <div
              className="p-4 sm:p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(236,72,153,0.15)" }}
            >
              <div className="text-xs text-zinc-500 mb-4 font-medium uppercase tracking-widest">Annual ACA Subsidy vs. Household MAGI (Couple, 2026)</div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cliffData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="subsidyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#71717a", fontSize: 10 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Annual Subsidy"]}
                      labelFormatter={(label) => `MAGI: ${label}`}
                    />
                    <ReferenceLine
                      x="$81.7k"
                      stroke="#EC4899"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{ value: "400% FPL", fill: "#EC4899", fontSize: 10, position: "insideTopRight" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="subsidy"
                      stroke="#007AFF"
                      strokeWidth={2}
                      fill="url(#subsidyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <span className="w-3 h-0.5 inline-block" style={{ background: "#EC4899" }} />
                400% FPL cliff at ~$81,760 (married couple, 2026)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personas / Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="text-center mb-10 sm:mb-16">
          <div
            className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", color: "#06B6D4" }}
          >
            Real Stories
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            People just like you are leaving work on their terms.
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto">
            These are composite profiles based on real scenarios Vela is built to solve.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {personas.map((p, i) => (
            <div
              key={i}
              className="p-6 sm:p-7 rounded-2xl flex flex-col gap-4"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${p.accentColor}22` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: `${p.accentColor}22`, color: p.accentColor, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.name}</div>
                  <div className="text-zinc-500 text-xs">{p.title} · {p.location}</div>
                </div>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed flex-1">
                "{p.story}"
              </p>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold self-start"
                style={{ background: `${p.accentColor}15`, color: p.accentColor }}
              >
                <span>Saving</span>
                <span>{p.savings}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="text-center mb-10 sm:mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 sm:mb-6 text-sm font-semibold"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}
          >
            Simple, Transparent Pricing
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Pays for itself in the first hour.
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto">
            One optimization can save you $10,000–$20,000 in healthcare costs. Vela costs less than a single doctor visit.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* Starter Report */}
          <div
            className="rounded-2xl p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#10B981" }}>Starter Report</div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>$49</span>
                <span className="text-zinc-400 text-sm mb-1.5">one-time</span>
              </div>
              <div className="text-zinc-500 text-sm">Your personalized MAGI optimization plan</div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                "Full optimization run on your real numbers",
                "Subsidy cliff analysis & safe MAGI target",
                "Withdrawal prescription (which accounts, in what order)",
                "Q4 Roth conversion recommendation",
                "PDF report you can share with your advisor",
              ].map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#10B981" }} />
                  <span className="text-sm text-zinc-300">{f}</span>
                </div>
              ))}
              {[
                "Year-round MAGI monitoring",
                "Live alert feed",
              ].map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 shrink-0 mt-0.5 text-zinc-700 text-xs font-bold">—</span>
                  <span className="text-sm text-zinc-600 line-through">{f}</span>
                </div>
              ))}
            </div>
            <div>
              <Button
                onClick={() => navigate("/optimize")}
                variant="outline"
                className="w-full py-3 text-sm font-semibold rounded-xl h-auto"
                style={{ borderColor: "rgba(16,185,129,0.4)", color: "#10B981", background: "rgba(16,185,129,0.06)" }}
              >
                Get My Report
              </Button>
              <p className="text-xs text-zinc-600 text-center mt-2">$150 credit toward Full Access if you upgrade within 30 days.</p>
            </div>
          </div>

          {/* Full Access */}
          <div
            className="rounded-2xl p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden"
            style={{ background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.35)" }}
          >
            <div
              className="absolute top-0 right-0 text-xs font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-xl"
              style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)", color: "white" }}
            >
              Most Popular
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#007AFF" }}>Full Access</div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>$199</span>
                <span className="text-zinc-400 text-sm mb-1.5">/year</span>
              </div>
              <div className="text-zinc-500 text-sm">~$17/month · Cancel anytime</div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                "Everything in Starter Report",
                "Year-round MAGI monitoring (12 months)",
                "Live alert feed — income & distribution events",
                "Q4 Roth conversion window guidance",
                "5-year Roth pipeline tracker",
                "Annual action calendar",
                "Account aggregation (Plaid)",
                "Priority email support",
              ].map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#007AFF" }} />
                  <span className="text-sm text-zinc-300">{f}</span>
                </div>
              ))}
            </div>
            <div>
              <Button
                onClick={() => navigate("/optimize")}
                className="w-full py-3 text-sm font-semibold rounded-xl text-white border-0 h-auto mb-3"
                style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
              >
                Join Waitlist — Founding Price
              </Button>
              <p className="text-xs text-zinc-600 text-center">Founding members lock in $199/yr forever. Price increases at launch.</p>
            </div>
          </div>
        </div>

        {/* ROI callout */}
        <div
          className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <div className="text-2xl font-extrabold text-emerald-400 shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>200x ROI</div>
          <div className="text-sm text-zinc-400">
            Average Vela user saves <strong className="text-white">$10,000+</strong> in their first year.
            At $49, a Starter Report pays for itself <strong className="text-white">200 times over</strong> — in year one alone.
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div
          className="rounded-2xl sm:rounded-3xl p-7 sm:p-12 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.2)" }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(168,85,247,0.6) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <div
                className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7" }}
              >
                Early Access
              </div>
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Be the first to know when Vela launches.
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Join the waitlist and get early access, founding member pricing, and updates as we build. No spam — just the product.
              </p>
            </div>
            <div>
              {submitted ? (
                <div className="flex flex-col items-center gap-4 text-center py-8">
                  <CheckCircle className="w-12 h-12" style={{ color: "#A855F7" }} />
                  <p className="text-white text-xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>You're on the list!</p>
                  <p className="text-zinc-400 text-sm">We'll reach out as soon as Vela is ready for early access.</p>
                </div>
              ) : (
                <form onSubmit={handleWaitlist} className="flex flex-col gap-4">
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Mail className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-4 text-base font-semibold rounded-xl text-white border-0 h-auto"
                    style={{ background: "linear-gradient(135deg, #A855F7, #007AFF)" }}
                  >
                    Join the Waitlist
                  </Button>
                  <p className="text-zinc-600 text-xs text-center">No credit card required. Unsubscribe anytime.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 mb-10 sm:mb-16">
        <div
          className="rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(0,122,255,0.6) 0%, transparent 70%)" }}
          />
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4 relative z-10"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Ready to see your savings?
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg mb-7 sm:mb-8 relative z-10">
            Run a free optimization with our demo data — no sign-up required.
          </p>
          <Button
            onClick={() => navigate("/optimize")}
            className="flex items-center gap-2 px-8 sm:px-10 py-3 sm:py-4 text-base font-semibold rounded-full text-white border-0 h-auto mx-auto"
            style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
          >
            Start Optimization
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
