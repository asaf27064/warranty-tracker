import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  Receipt,
  Bot,
  Smartphone,
  FileDown,
  Lock,
  Sparkles,
  Laptop,
  WashingMachine,
  Headphones,
  Tv,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import logo from "../assets/logo.png";

const GoogleIcon = () => (
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
);

const features = [
  {
    icon: Receipt,
    title: "Receipts & documents",
    desc: "Store receipts, invoices and certificates, and preview them inline.",
  },
  {
    icon: BellRing,
    title: "Smart reminders",
    desc: "Nudges 30, 7 and 1 days before a warranty expires.",
  },
  {
    icon: Bot,
    title: "AI assistant",
    desc: "Add products by chatting. It even reads your receipts.",
  },
  {
    icon: Smartphone,
    title: "Push & installable",
    desc: "Install it like an app and get push even when it is closed.",
  },
  {
    icon: FileDown,
    title: "Export & search",
    desc: "Filter, sort and export everything to CSV in a click.",
  },
  {
    icon: Lock,
    title: "Private by default",
    desc: "Your data is yours. Delete your account and files anytime.",
  },
];

const steps = [
  {
    n: 1,
    title: "Sign in with Google",
    desc: "No password, no setup.",
  },
  {
    n: 2,
    title: "Add your products",
    desc: "Snap a receipt or tell the assistant.",
  },
  {
    n: 3,
    title: "Relax",
    desc: "We remind you before anything expires.",
  },
];

const heroCards = [
  { icon: Laptop, name: "MacBook Pro", cat: "Electronics", label: "Active", color: "c-active", bar: "bar-active", pct: "72%" },
  { icon: WashingMachine, name: "Dryer", cat: "Appliances", label: "Expiring", color: "c-expiring", bar: "bar-expiring", pct: "91%" },
  { icon: Headphones, name: "Headphones", cat: "Electronics", label: "Expired", color: "c-expired", bar: "bar-expired", pct: "100%" },
];

const LandingPage = () => {
  const { loginWithGoogle, user, lastUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" />;

  const signIn = () =>
    lastUser
      ? loginWithGoogle({ loginHint: lastUser.email })
      : loginWithGoogle({ selectAccount: true });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-8 w-8 object-contain" />
            <span className="text-[15px] font-semibold">Warranty Tracker</span>
          </div>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <a href="#features" className="hidden transition-colors hover:text-foreground sm:inline">
              Features
            </a>
            <a href="#how" className="hidden transition-colors hover:text-foreground sm:inline">
              How it works
            </a>
            <Button size="sm" className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700" onClick={signIn}>
              Sign in
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-4rem] h-72 w-[40rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px] dark:bg-emerald-400/20" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mx-auto max-w-3xl px-5 pb-10 pt-16 text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Bell className="h-3.5 w-3.5" />
            Now with browser push reminders
          </span>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Never lose a<br />
            <span className="text-emerald-600 dark:text-emerald-400">warranty</span> again.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Keep every receipt, document and warranty date in one place, and get
            reminded before coverage expires by email, in-app, or push.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={signIn}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free. Sign in with Google, no card needed.
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-3xl px-5 pb-16">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-lg sm:p-4">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {heroCards.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.name} className="overflow-hidden rounded-xl border border-border bg-background">
                    <div className="relative flex h-16 items-center justify-center bg-muted text-muted-foreground sm:h-20">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                      <span className={`absolute right-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[9px] font-medium shadow-sm backdrop-blur-sm sm:text-[10px] ${c.color}`}>
                        {c.label}
                      </span>
                    </div>
                    <div className="p-2 sm:p-2.5">
                      <div className="truncate text-[11px] font-medium sm:text-xs">{c.name}</div>
                      <div className="mt-0.5 truncate text-[9px] text-muted-foreground sm:text-[10px]">{c.cat}</div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${c.bar}`} style={{ width: c.pct }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Everything in one place</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            From the receipt to the reminder, the whole lifecycle of a warranty.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: (i % 3) * 0.08 }}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-emerald-600/40"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-3xl px-5">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Meet the assistant
            </span>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Add a warranty by just talking</h2>
          </div>
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-4">
            <div className="mb-2.5 flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-emerald-600 px-3.5 py-2.5 text-[13px] text-white">
                I bought a Sony TV yesterday, 2 year warranty
              </div>
            </div>
            <div className="flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                <Bot className="h-4 w-4" />
              </span>
              <div className="rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2.5 text-[13px] text-muted-foreground">
                Got it, here is what I will add:
                <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-border bg-card p-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Tv className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs font-medium text-foreground">Sony TV</div>
                    <div className="text-[10px] text-muted-foreground">Expires in 2 years · Electronics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">Up and running in seconds</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/10 font-semibold text-emerald-600 dark:text-emerald-400">
                {s.n}
              </div>
              <h3 className="text-[15px] font-semibold">{s.title}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl overflow-hidden px-5 pb-16">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-[34rem] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[110px] dark:bg-emerald-400/15" />
        <div className="relative rounded-2xl border border-emerald-600/25 bg-emerald-600/10 px-6 py-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Start protecting your purchases</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Join in seconds with your Google account.
          </p>
          <button
            onClick={signIn}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-5 w-5 object-contain" />
            Warranty Tracker
          </div>
          <div>Built by Asaf</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
