import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { I18nProvider } from "./i18n/index.tsx";
import "./styles.css";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <I18nProvider storage={localStorage} preferred={navigator.languages}>
      <App />
    </I18nProvider>
  </StrictMode>,
);
