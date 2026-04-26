import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevenção contra Service Workers antigos interceptando o callback do Google (preview/iframe/dev)
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

if ("serviceWorker" in navigator && (isInIframe || isPreviewHost)) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
