import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn) {
  window.addEventListener(
    "load",
    () => {
      import("@sentry/react").then(({ init }) => {
        init({
          dsn: sentryDsn,
          sendDefaultPii: true,
        });
      });
    },
    { once: true },
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
