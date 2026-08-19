/**
 * Local optimization history.
 *
 * The Manus build persisted runs to a server-side database behind OAuth. With auth
 * removed, runs are stored in the browser instead. Same shape, no account required.
 * When real auth lands, swap the two functions below for API calls.
 */

import type { OptimizationResult, UserProfile } from "./optimizer";

const STORAGE_KEY = "vela.history.v1";
const MAX_RUNS = 50;

export interface HistoryRun {
  id: string;
  profile: UserProfile;
  result: OptimizationResult;
  createdAt: string;
}

export function getHistory(): HistoryRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryRun[]) : [];
  } catch {
    return [];
  }
}

export function saveRun(profile: UserProfile, result: OptimizationResult): HistoryRun {
  const run: HistoryRun = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    profile,
    result,
    createdAt: new Date().toISOString(),
  };
  try {
    const next = [run, ...getHistory()].slice(0, MAX_RUNS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — history is best effort */
  }
  return run;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
