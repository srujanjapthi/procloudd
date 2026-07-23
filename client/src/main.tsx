import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "next-themes";
import queryClient from "@/lib/query-client";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AuthProvider>
          </QueryClientProvider>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
