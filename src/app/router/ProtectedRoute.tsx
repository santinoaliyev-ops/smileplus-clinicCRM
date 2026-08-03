import { Navigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth";

interface Props {
  children: JSX.Element;
}

export default function ProtectedRoute({
  children,
}: Props) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}