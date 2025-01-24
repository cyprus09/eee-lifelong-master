import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (!user && loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};
