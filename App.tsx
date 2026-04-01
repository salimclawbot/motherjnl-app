import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import Navigation from "./src/navigation";
import { configureRevenueCat } from "./src/lib/revenuecat";

export default function App() {
  useEffect(() => {
    configureRevenueCat();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Navigation />
    </AuthProvider>
  );
}
