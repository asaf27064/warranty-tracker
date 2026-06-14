import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeProvider";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetails from "./pages/ProductDetails"
import ChatWidget from "./components/ChatWidget";
import PrefsSync from "./components/PrefsSync";
import ReminderToaster from "./components/ReminderToaster";
import OnboardingModal from "./components/OnboardingModal";
import { Toaster } from "./components/ui/sonner";

// App-wide chrome that depends on auth: prefs sync (always), plus the in-app
// reminder toaster and first-login onboarding (only when signed in).
function GlobalChrome() {
  const { user } = useAuth();
  return (
    <>
      <PrefsSync />
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
            <Route path="/" element={<LoginPage />} />
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
          <ChatWidget />
          <GlobalChrome />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
