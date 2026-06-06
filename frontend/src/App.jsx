import { useState, useEffect } from "react";
import HomePage from "./HomePage";
import Dashboard from "./Dashboard";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  useEffect(() => {
    const stored = localStorage.getItem("isAuthenticated") === "true";
    if (stored !== isAuthenticated) {
      setIsAuthenticated(stored);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <HomePage onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
