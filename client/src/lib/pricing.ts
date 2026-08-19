/**
 * Purchase configuration.
 *
 * Payment runs through a Stripe Payment Link — a URL created in the Stripe
 * dashboard. No API keys live in this codebase and no card details ever touch
 * Vela; Stripe hosts the checkout page entirely.
 *
 * Set VITE_STRIPE_PAYMENT_LINK in Vercel to switch selling on. Until it is set,
 * every purchase CTA stays a waitlist signup, so the site never offers to sell
 * something that cannot be bought.
 *
 * ── On the access check ──────────────────────────────────────────────────────
 * hasPurchased() reads a localStorage flag set when Stripe redirects back after
 * a successful payment. This is NOT access control. Anyone who opens devtools
 * can set the flag, and the optimizer itself runs client-side regardless.
 *
 * That is a deliberate trade for this stage. The purpose right now is to find
 * out whether anyone will pay $49 at all, and a bypassable gate answers that
 * question just as well as a real one — nobody pirates a product they have not
 * decided they want. Before this matters, the report generation moves to a
 * serverless function behind a Stripe webhook and a signed token. That is a
 * day of work, and it is the right day of work only once the answer is yes.
 */

const PURCHASE_FLAG = "vela.purchased.v1";

/** The Stripe Payment Link, or empty when selling is not yet switched on. */
export const PAYMENT_LINK: string = import.meta.env.VITE_STRIPE_PAYMENT_LINK ?? "";

/** Whether the site is currently able to take money. */
export const SELLING_ENABLED = PAYMENT_LINK.trim().length > 0;

/** Price shown alongside the buy CTA. Keep in step with the Stripe product. */
export const STARTER_PRICE = "$49";

export function hasPurchased(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PURCHASE_FLAG) === "1";
  } catch {
    return false;
  }
}

export function markPurchased(): void {
  try {
    window.localStorage.setItem(PURCHASE_FLAG, "1");
  } catch {
    /* private browsing — the buyer will need to re-enter through Stripe's receipt link */
  }
}

/**
 * Records a purchase when Stripe redirects back with ?purchased=1, then strips
 * the parameter so a shared or bookmarked URL does not grant access to someone
 * else. Call once on app start.
 */
export function consumePurchaseRedirect(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("purchased") !== "1") return;
  markPurchased();
  url.searchParams.delete("purchased");
  window.history.replaceState({}, "", url.toString());
}
