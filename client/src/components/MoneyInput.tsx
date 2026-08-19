/**
 * An amount that can be dragged approximately or typed exactly.
 *
 * Sliders are good for exploring and bad for accuracy — nobody's IRA balance is
 * a round $600,000. This shows the formatted figure until you click it, then
 * becomes a plain number field so an exact balance can be typed.
 *
 * The typed value is only parsed and clamped on commit (blur or Enter), not on
 * every keystroke. Reformatting mid-typing fights the user: clearing the field
 * to type a new number would otherwise snap to $0 the moment it went empty.
 */

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/optimizer";

interface Props {
  value: number;
  onChange: (value: number) => void;
  /** Lower bound, applied on commit. */
  min?: number;
  /**
   * Upper bound, applied on commit. Omit for no ceiling — a slider's maximum is
   * a display convenience and should not stop someone entering a real balance
   * that happens to be larger.
   */
  max?: number;
  /** Colour of the displayed figure, matching its account. */
  color?: string;
  className?: string;
  /** Accessible name, since the visible label sits in the parent card. */
  ariaLabel: string;
}

/** Accepts "1,234", "$1,234", "1234.56" and similar. */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function MoneyInput({
  value,
  onChange,
  min = 0,
  max,
  color = "#FFFFFF",
  className = "",
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const parsed = parseAmount(draft);
    if (parsed !== null) {
      let next = Math.max(min, parsed);
      if (max !== undefined) next = Math.min(max, next);
      onChange(Math.round(next));
    }
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        aria-label={`${ariaLabel}: ${formatCurrency(value)}. Click to type an exact amount.`}
        className={`text-xl font-bold rounded-md px-1 -mx-1 transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 ${className}`}
        style={{ fontFamily: "'Space Grotesk', sans-serif", color }}
      >
        {formatCurrency(value)}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoFocus
      aria-label={ariaLabel}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className={`text-xl font-bold bg-transparent rounded-md px-1 -mx-1 w-40 text-right focus:outline-none focus:ring-2 focus:ring-white/20 ${className}`}
      style={{ fontFamily: "'Space Grotesk', sans-serif", color }}
    />
  );
}
