/**
 * An inline "why?" disclosure.
 *
 * The results page is dense, and the questions it raises are predictable —
 * so they get written answers rather than a chat box. Collapsed by default,
 * because someone who already understands the mechanism should not have to
 * scroll past an explanation of it.
 */

import { useId, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { Explanation } from "@/lib/explanations";

interface Props {
  explanation: Explanation;
  /** Accent for the trigger, usually matching the row it belongs to. */
  color?: string;
  /** Compact sits inline in a row; block sits under a section heading. */
  variant?: "compact" | "block";
}

export default function Explain({ explanation, color = "#71717A", variant = "compact" }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={variant === "block" ? "mt-3" : ""}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 text-xs rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
        style={{ color }}
      >
        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{explanation.question}</span>
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="mt-2 p-4 rounded-xl space-y-2.5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {explanation.answer.map((paragraph, i) => (
            <p key={i} className="text-xs text-zinc-400 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
