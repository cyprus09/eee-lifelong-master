import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, userRole } = useAuth();

  if (!user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;

  if (adminOnly && userRole !== "admin") {
    return <Navigate to="/home" />;
  }

  return children;
};
