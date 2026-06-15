import { motion } from "framer-motion";
import { Navigate, Link } from "react-router-dom";
import { ChevronRight, Clock, LockKeyhole, Smartphone, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import logo from "../assets/logo.png";

const LoginPage = () => {
  const { loginWithGoogle, user, lastUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <Link
        to="/"
        className="absolute left-5 top-5 z-20 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border bg-card p-9 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <motion.img
              src={logo}
              alt="Warranty Tracker"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
              className="mb-5 h-32 w-auto object-contain"
            />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Warranty Tracker
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Keep your purchases, receipts, warranty dates, and reminders in
              one place.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {lastUser ? (
              <>
                <Button
                  onClick={() =>
                    loginWithGoogle({ loginHint: lastUser.email })
                  }
                  variant="outline"
                  className="group w-full cursor-pointer justify-between gap-3 py-6 text-base font-medium"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {lastUser.avatarUrl ? (
                      <img
                        src={lastUser.avatarUrl}
                        alt={lastUser.name}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
                        {lastUser.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 text-left">
                      <span className="block truncate">Continue as {lastUser.name}</span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        {lastUser.email}
                      </span>
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </Button>
                <Button
                  onClick={() => loginWithGoogle({ selectAccount: true })}
                  variant="ghost"
                  className="w-full"
                >
                  Use another Google account
                </Button>
              </>
            ) : (
              <Button
                onClick={() => loginWithGoogle({ selectAccount: true })}
                variant="outline"
                className="group w-full cursor-pointer gap-3 py-6 text-base font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Sign in with Google</span>
                <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </Button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center text-xs text-muted-foreground">
            {[
              { icon: LockKeyhole, text: "Private" },
              { icon: Smartphone, text: "Portable" },
              { icon: Clock, text: "Timely" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex flex-col items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
