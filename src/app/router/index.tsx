import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../layouts/app-shell";

import DashboardPage from "@/pages/dashboard";
import StaffPage from "@/pages/staff";
import LoginPage from "@/pages/auth/login";
import NotFoundPage from "@/pages/not-found";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "staff",
        element: <StaffPage />,
      },
    ],
  },

  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },

  {
    path: "*",
    element: <NotFoundPage />,
  },
]);