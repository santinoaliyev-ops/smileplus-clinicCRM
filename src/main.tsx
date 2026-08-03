import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@/shared/i18n";
import App from "./App";
import { AuthProvider } from "@/app/providers/auth";
import { ClinicProvider } from "@/app/providers/clinic";
import { QueryProvider } from "@/app/providers/query";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <ClinicProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ClinicProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);