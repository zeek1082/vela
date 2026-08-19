import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, ChevronRight, User, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  runOptimization,
  DEMO_PROFILES,
  formatCurrency,
  type UserProfile,
  type OptimizationResult,
} from "@/lib/optimizer";
import ResultsDashboard from "@/components/ResultsDashboard";
import { saveRun } from "@/lib/history";
import { LOGO_URL } from "@/lib/brand";

type Step = "profile" | "accounts" | "optimize" | "results";

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Your Profile", icon: <User className="w-4 h-4" /> },
  { id: "accounts", label: "Accounts", icon: <Wallet className="w-4 h-4" /> },
  { id: "optimize", label: "Optimize", icon: <Zap className="w-4 h-4" /> },
  { id: "results", label: "Results", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const STEP_ORDER: Step[] = ["profile", "accounts", "optimize", "results"];

export default function Optimizer() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<UserProfile>(DEMO_PROFILES["couple_58"]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedRun, setSavedRun] = useState(false);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  function goNext() {
    if (currentStep === "optimize") {
      setIsCalculating(true);
      setSavedRun(false);

      const res = runOptimization(profile);
      setResult(res);

      // Persist the run locally so it shows up in /history.
      saveRun(profile, res);
      setSavedRun(true);

      setTimeout(() => {
        setIsCalculating(false);
        setCurrentStep("results");
      }, 1200);
    } else {
      const next = STEP_ORDER[currentStepIndex + 1];
      if (next) setCurrentStep(next);
    }
  }

  function goBack() {
    const prev = STEP_ORDER[currentStepIndex - 1];
    if (prev) setCurrentStep(prev);
    else navigate("/");
  }

  function loadDemoProfile(key: string) {
    setProfile(DEMO_PROFILES[key]);
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-white relative">
      {/* Ambient glow orbs */}
      <div
        className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div
        className="fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,122,255,0.4) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-white/5">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStepIndex === 0 ? "Back to Home" : "Back"}
        </button>
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Vela" className="w-8 h-8 object-contain" />
          <span className="font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Vela
          </span>
        </div>
        <div className="text-sm text-zinc-500">Early Access</div>
      </header>

      {/* Progress Steps */}
      <div className="relative z-10 flex items-center justify-center gap-0 px-3 sm:px-8 py-4 sm:py-6 overflow-x-auto">
        {STEPS.map((step, i) => {
          const stepIdx = STEP_ORDER.indexOf(step.id);
          const isActive = step.id === currentStep;
          const isComplete = stepIdx < currentStepIndex;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #007AFF, #A855F7)"
                      : isComplete
                      ? "rgba(16,185,129,0.2)"
                      : "rgba(255,255,255,0.05)",
                    border: isActive
                      ? "none"
                      : isComplete
                      ? "1px solid rgba(16,185,129,0.4)"
                      : "1px solid rgba(255,255,255,0.1)",
                    color: isActive ? "#fff" : isComplete ? "#10B981" : "#71717A",
                  }}
                >
                  {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: isActive ? "#FFFFFF" : isComplete ? "#10B981" : "#71717A" }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-8 sm:w-16 h-px mx-1 sm:mx-2 mb-4"
                  style={{
                    background: stepIdx < currentStepIndex
                      ? "linear-gradient(90deg, #10B981, rgba(16,185,129,0.3))"
                      : "rgba(255,255,255,0.08)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 pb-16">
        {currentStep === "profile" && (
          <ProfileStep profile={profile} setProfile={setProfile} onLoadDemo={loadDemoProfile} />
        )}
        {currentStep === "accounts" && (
          <AccountsStep profile={profile} setProfile={setProfile} />
        )}
        {currentStep === "optimize" && (
          <OptimizeStep profile={profile} isCalculating={isCalculating} />
        )}
        {currentStep === "results" && result && (
          <>
            <ResultsDashboard result={result} profile={profile} onReset={() => setCurrentStep("profile")} />

            {/* Saved to DB badge — only show when authenticated and saved */}
            {savedRun && (
              <div
                className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>This run has been saved to your history on this device.</span>
                <Link href="/history">
                  <span className="underline underline-offset-2 cursor-pointer hover:text-green-300 transition-colors ml-1">
                    View all runs →
                  </span>
                </Link>
              </div>
            )}

            {/* Year-round monitoring teaser */}
            <div
              className="mt-4 p-5 rounded-2xl flex items-center justify-between"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <div>
                <div className="text-sm font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Ready to monitor this year-round?
                </div>
                <div className="text-xs text-zinc-400">
                  Year-round MAGI alerts and a Q4 Roth conversion plan are coming next.
                </div>
              </div>
              <Link href="/history">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full text-white shrink-0 ml-4"
                  style={{ background: "linear-gradient(135deg, #6366f1, #A855F7)" }}
                >
                  View History
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        {currentStep !== "results" && (
          <div className="flex justify-end mt-8">
            <Button
              onClick={goNext}
              disabled={isCalculating}
              className="flex items-center gap-2 px-8 py-3 text-sm font-semibold rounded-full text-white border-0 h-auto"
              style={{ background: isCalculating ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #007AFF, #A855F7)" }}
            >
              {isCalculating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculating...
                </>
              ) : currentStep === "optimize" ? (
                <>
                  Run Optimization
                  <Zap className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Step 1: Profile ────────────────────────────────────────────────────────

function ProfileStep({
  profile,
  setProfile,
  onLoadDemo,
}: {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onLoadDemo: (key: string) => void;
}) {
  return (
    <div>
      <StepHeader
        title="Tell us about yourself"
        subtitle="We'll use this to calculate your Federal Poverty Level percentage and ACA subsidy eligibility."
      />

      {/* Demo Profile Selector */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          Load a Demo Profile
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: "couple_58", label: "Married Couple, 58", sub: "$65k/yr spending" },
            { key: "single_52", label: "Single, Age 52", sub: "$45k/yr spending" },
            { key: "couple_47", label: "Married Couple, 47", sub: "$80k/yr spending" },
          ].map((demo) => (
            <button
              key={demo.key}
              onClick={() => onLoadDemo(demo.key)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: profile.annualSpending === DEMO_PROFILES[demo.key].annualSpending
                  ? "1px solid rgba(0,122,255,0.5)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-sm font-semibold text-white mb-1">{demo.label}</div>
              <div className="text-xs text-zinc-500">{demo.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <FormRow label="Age">
          <SliderInput
            value={profile.age}
            min={40}
            max={64}
            step={1}
            onChange={(v) => setProfile({ ...profile, age: v })}
            display={`${profile.age} years old`}
          />
        </FormRow>

        <FormRow label="Filing Status">
          <ToggleSelect
            options={[
              { value: "single", label: "Single" },
              { value: "married", label: "Married Filing Jointly" },
            ]}
            value={profile.filingStatus}
            onChange={(v) => setProfile({ ...profile, filingStatus: v as "single" | "married" })}
          />
        </FormRow>

        <FormRow label="Household Size">
          <SliderInput
            value={profile.householdSize}
            min={1}
            max={6}
            step={1}
            onChange={(v) => setProfile({ ...profile, householdSize: v })}
            display={`${profile.householdSize} ${profile.householdSize === 1 ? "person" : "people"}`}
          />
        </FormRow>

        <FormRow label="Annual Spending Goal">
          <SliderInput
            value={profile.annualSpending}
            min={30000}
            max={150000}
            step={5000}
            onChange={(v) => setProfile({ ...profile, annualSpending: v })}
            display={formatCurrency(profile.annualSpending)}
          />
        </FormRow>
      </div>
    </div>
  );
}

// ─── Step 2: Accounts ───────────────────────────────────────────────────────

function AccountsStep({
  profile,
  setProfile,
}: {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}) {
  const { accounts } = profile;

  function updateAccount(key: keyof typeof accounts, value: number) {
    setProfile({ ...profile, accounts: { ...accounts, [key]: value } });
  }

  return (
    <div>
      <StepHeader
        title="Your Account Balances"
        subtitle="Enter the current balances of each account type. The optimizer uses these to determine the most tax-efficient withdrawal mix."
      />

      <div className="space-y-5">
        <AccountCard
          label="Traditional IRA / 401(k)"
          sublabel="100% of withdrawals count as MAGI"
          color="#EF4444"
          value={accounts.traditionalIRA}
          onChange={(v) => updateAccount("traditionalIRA", v)}
          min={0}
          max={2000000}
          step={25000}
        />
        <AccountCard
          label="Roth IRA"
          sublabel="Withdrawals do NOT count as MAGI"
          color="#10B981"
          value={accounts.rothIRA}
          onChange={(v) => updateAccount("rothIRA", v)}
          min={0}
          max={1000000}
          step={10000}
        />
        <AccountCard
          label="Taxable Brokerage — Total Balance"
          sublabel="Only realized capital gains count as MAGI"
          color="#007AFF"
          value={accounts.brokerage}
          onChange={(v) => updateAccount("brokerage", v)}
          min={0}
          max={2000000}
          step={25000}
        />
        <AccountCard
          label="Taxable Brokerage — Cost Basis"
          sublabel="The portion that returns your original investment (zero MAGI impact)"
          color="#A855F7"
          value={accounts.brokerageCostBasis}
          onChange={(v) => updateAccount("brokerageCostBasis", Math.min(v, accounts.brokerage))}
          min={0}
          max={accounts.brokerage}
          step={10000}
        />
        <AccountCard
          label="HSA Balance"
          sublabel="Withdrawals for medical expenses do NOT count as MAGI"
          color="#F59E0B"
          value={accounts.hsa}
          onChange={(v) => updateAccount("hsa", v)}
          min={0}
          max={100000}
          step={1000}
        />
      </div>

      {/* Summary */}
      <div
        className="mt-6 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Portfolio Summary</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {formatCurrency(accounts.traditionalIRA + accounts.rothIRA + accounts.brokerage)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Total Portfolio</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#10B981" }}>
              {formatCurrency(accounts.rothIRA + accounts.brokerageCostBasis)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Zero-MAGI Assets</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#EF4444" }}>
              {formatCurrency(accounts.traditionalIRA + (accounts.brokerage - accounts.brokerageCostBasis))}
            </div>
            <div className="text-xs text-zinc-500 mt-1">MAGI-Generating Assets</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Optimize Preview ────────────────────────────────────────────────

function OptimizeStep({ profile, isCalculating }: { profile: UserProfile; isCalculating: boolean }) {
  return (
    <div>
      <StepHeader
        title="Ready to optimize"
        subtitle="We'll analyze your accounts and find the withdrawal strategy that minimizes your MAGI and maximizes your ACA subsidies."
      />

      <div
        className="p-8 rounded-2xl text-center"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {isCalculating ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
            >
              <span className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <div className="text-white font-semibold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Running optimization engine...
            </div>
            <div className="text-zinc-500 text-sm">Analyzing 10,000+ withdrawal combinations</div>
          </div>
        ) : (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "linear-gradient(135deg, #007AFF, #A855F7)" }}
            >
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3
              className="text-2xl font-bold text-white mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Optimization Summary
            </h3>
            <p className="text-zinc-400 text-sm mb-8">
              Profile: {profile.filingStatus === "married" ? "Married" : "Single"}, Age {profile.age} •
              Spending Goal: {formatCurrency(profile.annualSpending)} •
              Household: {profile.householdSize}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { label: "Traditional IRA", value: formatCurrency(profile.accounts.traditionalIRA), color: "#EF4444" },
                { label: "Roth IRA", value: formatCurrency(profile.accounts.rothIRA), color: "#10B981" },
                { label: "Brokerage", value: formatCurrency(profile.accounts.brokerage), color: "#007AFF" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-xs text-zinc-500 mb-1">{item.label}</div>
                  <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI Components ────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2
        className="text-3xl font-bold text-white mb-3 tracking-tight"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {title}
      </h2>
      <p className="text-zinc-400 text-base leading-relaxed">{subtitle}</p>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="p-5 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">{label}</div>
      {children}
    </div>
  );
}

function SliderInput({
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div
        className="text-2xl font-bold text-white mb-4"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {display}
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-zinc-600 mt-2">
        <span>{typeof min === "number" && min >= 1000 ? formatCurrency(min) : min}</span>
        <span>{typeof max === "number" && max >= 1000 ? formatCurrency(max) : max}</span>
      </div>
    </div>
  );
}

function ToggleSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: value === opt.value ? "linear-gradient(135deg, #007AFF, #A855F7)" : "rgba(255,255,255,0.04)",
            border: value === opt.value ? "none" : "1px solid rgba(255,255,255,0.08)",
            color: value === opt.value ? "#fff" : "#A1A1AA",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AccountCard({
  label,
  sublabel,
  color,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  sublabel: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div
      className="p-5 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white mb-0.5">{label}</div>
          <div className="text-xs text-zinc-500">{sublabel}</div>
        </div>
        <div
          className="text-xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color }}
        >
          {formatCurrency(value)}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}
