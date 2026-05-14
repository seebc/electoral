import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

window.onerror = function(msg, url, line) {
  console.error("ERROR:", msg, "line:", line);
  return false;
};

console.log('SEEBC Starting...');
console.log('DB: Google Sheets (16Xkow8EIvGtgiKS9smrHJmr35Ogq5wEvQVHOtxbAqwo)');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('SEEBC Rendered');