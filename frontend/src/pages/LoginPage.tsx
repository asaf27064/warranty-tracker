import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { ChevronRight } from "lucide-react";
import logo from "../assets/logo.png";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const LoginPage = () => {
  const { loginWithGoogle, user, loading } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const hasToken = params.get("token");

  if (loading || hasToken) return null;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <motion.div
        className="absolute -top-40 -left-40 h-125 w-125 rounded-full bg-emerald-500/10 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-40 -bottom-40 h-125 w-125 rounded-full bg-sky-500/10 blur-[120px]"
        animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="rounded-2xl border border-border bg-card/80 p-10 shadow-2xl backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 flex flex-col items-center"
          >
            <img
              src={logo}
              alt="Warranty Tracker"
              className="mb-4 h-30 w-30 rounded-2xl shadow-2xl"
            />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Warranty Tracker
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Never lose track of your warranties again.
              <br />
              Upload receipts, track expiry dates, get reminders.
            </p>
          </motion.div>

          <div className="mb-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              continue with
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Button
              onClick={loginWithGoogle}
              variant="outline"
              className="group relative w-full cursor-pointer overflow-hidden rounded-xl border-border bg-muted/50 px-6 py-6 text-base font-medium text-foreground transition-all duration-300 hover:bg-muted"
            >
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-foreground/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <div className="flex items-center justify-center gap-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
                <ChevronRight className="h-4 w-4 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
              </div>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-6 text-center text-xs text-muted-foreground"
          >
            By signing in, you agree to our{" "}
            <span className="cursor-pointer underline underline-offset-2 transition-colors hover:text-foreground">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="cursor-pointer underline underline-offset-2 transition-colors hover:text-foreground">
              Privacy Policy
            </span>
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-8 flex justify-center gap-8 text-xs text-muted-foreground"
        >
          {[
            { icon: "🔒", text: "Secure & Private" },
            { icon: "📱", text: "Access Anywhere" },
            { icon: "⏰", text: "Smart Reminders" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-1.5"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;