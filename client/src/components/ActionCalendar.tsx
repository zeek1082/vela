import { CalendarDays, AlertTriangle, CircleDot, CalendarRange } from "lucide-react";
import { formatCurrency, type OptimizationResult, type UserProfile } from "@/lib/optimizer";
import { buildActionCalendar, buildPipeline, type CalendarUrgency } from "@/lib/pipeline";

interface Props {
  profile: UserProfile;
  result: OptimizationResult;
}

const URGENCY: Record<CalendarUrgency, { color: string; label: string; Icon: typeof AlertTriangle }> = {
  deadline: { color: "#EF4444", label: "Deadline", Icon: AlertTriangle },
  window: { color: "#007AFF", label: "Window opens", Icon: CalendarRange },
  action: { color: "#10B981", label: "Check in", Icon: CircleDot },
};

export default function ActionCalendar({ profile, result }: Props) {
  const startYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const pipeline = buildPipeline(
    profile,
    result.optimized.prescription.totalMAGI,
    startYear,
    1
  );
  const firstYear = pipeline.years[0];
  const targetMAGI = firstYear?.targetMAGI ?? result.optimized.prescription.totalMAGI;
  const headroom = firstYear?.headroom ?? 0;

  const items = buildActionCalendar(targetMAGI, headroom, formatCurrency);
  const nextUp = items.find((i) => i.month >= currentMonth) ?? items[0];

  return (
    <div
      className="p-5 sm:p-6 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4" style={{ color: "#06B6D4" }} />
        <span className="text-sm font-semibold text-white">Your {startYear} Action Calendar</span>
      </div>
      <p className="text-xs text-zinc-500 mb-5 max-w-2xl leading-relaxed">
        MAGI is decided over a year, not in a single sitting. These are the dates that actually
        move it — with your own numbers written in.
      </p>

      <div className="space-y-2.5">
        {items.map((item, i) => {
          const { color, label, Icon } = URGENCY[item.urgency];
          const isPast = item.month < currentMonth;
          const isNext = item === nextUp;
          return (
            <div
              key={i}
              className="p-3.5 sm:p-4 rounded-xl flex gap-3.5"
              style={{
                background: isNext ? `${color}0D` : "rgba(255,255,255,0.02)",
                border: `1px solid ${isNext ? `${color}44` : "rgba(255,255,255,0.05)"}`,
                opacity: isPast ? 0.45 : 1,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}1A`, color }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                  <span
                    className="text-sm font-bold text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {item.title}
                  </span>
                  <span className="text-xs font-semibold" style={{ color }}>
                    {item.when}
                  </span>
                  {isNext && !isPast && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: `${color}22`, color }}
                    >
                      Next up
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.detail}</p>
                <span className="sr-only">{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-600 mt-4 leading-relaxed">
        Enrollment dates follow the federal marketplace. A few states open earlier and several run
        later deadlines — check your own marketplace before relying on these.
      </p>
    </div>
  );
}
