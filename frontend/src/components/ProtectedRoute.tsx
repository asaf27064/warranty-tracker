import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { accessToken, loading } = useAuth();

  if (loading) return null;
  if (!accessToken) return <Navigate to="/" />;
  return children;
};

export default ProtectedRoute;
