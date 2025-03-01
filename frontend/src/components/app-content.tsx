import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { LoginForm } from "@/components/auth/login-form";
import { UserSwitcher } from "@/components/auth/user-switcher";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TransactionAnalyzer from "@/pages/permata";
import APYCalculation from "@/pages/APYCalculation";
import TradingAnalyser from "./TradingAnalyser";
import FundingRateDisplay from "@/bybit-api-tests";
import { ModeToggle } from "./mode-toggle";

export function AppContent() {
  const { currentUser, recentUsers, login, logout, switchUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoginForm onLogin={login} />
      </div>
    );
  }

  return (
    <Router>
      <div>
        <nav className="bg-accent text-accent-foreground p-4 mb-4">
          <div className="container mx-auto flex items-center justify-center gap-8">
            <Link to="/" className="hover:text-gray-300">
              Funding Rates
            </Link>
            <Link to="/apy" className="hover:text-gray-300">
              APY Calculation
            </Link>
            <Link to="/trading-analyser" className="hover:text-gray-300">
              Trading Analyser
            </Link>
            <Link to="/permata" className="hover:text-gray-300">
              Permata
            </Link>
            <Link to="/settings" className="hover:text-gray-300">
              Settings
            </Link>
            
            <div className="flex gap-2 ml-auto">
            <UserSwitcher
              currentUser={currentUser.email}
              recentUsers={recentUsers.map(user => user.email)}
              onSwitch={switchUser}
              onLogout={logout}
            />
              <ModeToggle />
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<FundingRateDisplay />} />
          <Route path="/apy" element={<APYCalculation />} />
          <Route path="/trading-analyser" element={<TradingAnalyser />} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          <Route path="/permata" element={<TransactionAnalyzer />} />
        </Routes>
      </div>
    </Router>
  );
}
