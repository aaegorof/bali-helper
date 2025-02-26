import React from "react";
import { DataProvider } from "./context/DataContext";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { AppContent } from "./components/app-content";

const App = () => {

  return (
    <ThemeProvider storageKey="vite-ui-theme">
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
