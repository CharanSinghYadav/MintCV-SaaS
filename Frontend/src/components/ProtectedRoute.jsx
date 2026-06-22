import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const ProtectedRoute = ({ children }) => {
  // Tijori se check kiya ki user logged in hai ya nahi
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Agar login nahi hai, toh seedha /login par phek do
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Agar login hai, toh jo page maanga tha wo dikha do
  return children;
};

export default ProtectedRoute;