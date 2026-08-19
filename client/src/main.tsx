import { createRoot } from "react-dom/client";
import App from "./App";
import { consumePurchaseRedirect } from "./lib/pricing";
import "./index.css";

// Stripe redirects back with ?purchased=1 after checkout.
consumePurchaseRedirect();

createRoot(document.getElementById("root")!).render(<App />);
