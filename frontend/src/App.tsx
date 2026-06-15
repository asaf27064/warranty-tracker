import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeProvider";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetails from "./pages/ProductDetails"
import ChatWidget from "./components/ChatWidget";
import PrefsSync from "./components/PrefsSync";
import ReminderToaster from "./components/ReminderToaster";
import OnboardingModal from "./components/OnboardingModal";
import { Toaster } from "./components/ui/sonner";

function GlobalChrome() {
  const { user } = useAuth();
  return (
    <>
      <PrefsSync />
      {user && <ChatWidget />}
      {user && <ReminderToaster />}
      {user && <OnboardingModal />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product/:id"
              element={
                <ProtectedRoute>
                  <ProductDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
          <GlobalChrome />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
