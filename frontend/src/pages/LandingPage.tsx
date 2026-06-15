import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  Bot,
  Sparkles,
  Laptop,
  WashingMachine,
  Headphones,
  Tv,
  LayoutGrid,
  List,
  CircleCheck,
  ClockAlert,
  CircleX,
  AlertTriangle,
  CalendarClock,
  Plus,
  Calendar,
  Store,
  ShieldCheck,
  Receipt,
  Check,
  FileText,
  Mail,
  Smartphone,
  Clock,
  Search,
  FileDown,
  Moon,
  Download,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import logo from "../assets/logo.png";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Reveal = ({
  children,
  className,
  delay = 0,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    whileHover={hover ? "hover" : undefined}
    viewport={{ once: true, margin: "-60px" }}
    variants={{
      hidden: { opacity: 0, y: 18 },
      show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay } },
      hover: { y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const SectionHead = ({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) => (
  <div className="mx-auto max-w-xl text-center">
    {eyebrow && (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </span>
    )}
    <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{title}</h2>
    {sub && <p className="mt-3 text-sm text-muted-foreground">{sub}</p>}
  </div>
);

const products = [
  { icon: Laptop, name: "MacBook Pro", cat: "Electronics", label: "Active", color: "c-active", bar: "bar-active", pct: "72%", left: "1.6y left" },
  { icon: WashingMachine, name: "Dryer", cat: "Appliances", label: "Expiring", color: "c-expiring", bar: "bar-expiring", pct: "91%", left: "12d left" },
  { icon: Headphones, name: "Headphones", cat: "Electronics", label: "Expired", color: "c-expired", bar: "bar-expired", pct: "100%", left: "Expired" },
];

const features = [
  { icon: LayoutGrid, title: "Cards & list views", desc: "Browse visually or scan a dense, sortable list. Your pick." },
  { icon: Search, title: "Search, filter & sort", desc: "Find anything by name, store, category or status in a second." },
  { icon: FileDown, title: "Export & bulk actions", desc: "Select many at once, delete in bulk, or export to CSV." },
  { icon: Moon, title: "Dark, light & system", desc: "A calm theme for every taste, remembered across devices." },
  { icon: Download, title: "Installable app", desc: "Add it to your home screen or desktop and open it like an app." },
  { icon: Lock, title: "Private by default", desc: "Your data is yours. Delete your account and files anytime." },
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

  const signIn = (fresh = false) =>
    !fresh && lastUser
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
            <a href="#features" className="hidden transition-colors hover:text-foreground sm:inline">Features</a>
            <a href="#how" className="hidden transition-colors hover:text-foreground sm:inline">How it works</a>
            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => signIn()}>{lastUser ? "Continue" : "Sign in"}</Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-4rem] h-72 w-[40rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px] dark:bg-emerald-400/20" />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="relative mx-auto max-w-3xl px-5 pb-10 pt-16 text-center">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Never lose a<br />
            <span className="text-emerald-600 dark:text-emerald-400">warranty</span> again.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            The warranty you forget is the one you'll need. Keep every receipt and expiry date in one place, with reminders before coverage runs out.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {lastUser ? (
                <button onClick={() => signIn()} className="group inline-flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-left transition-colors hover:border-emerald-600/40 hover:bg-muted">
                  {lastUser.avatarUrl ? (
                    <img src={lastUser.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">{lastUser.name.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold text-foreground">Continue as {lastUser.name.split(" ")[0]}</span>
                    <span className="block max-w-[200px] truncate text-xs text-muted-foreground">{lastUser.email}</span>
                  </span>
                </button>
              ) : (
                <button onClick={() => signIn()} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90">
                  <GoogleIcon />
                  Sign in with Google
                </button>
              )}
              <a href="#how" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">See how it works</a>
            </div>
            {lastUser ? (
              <button onClick={() => signIn(true)} className="text-xs text-muted-foreground transition-colors hover:text-foreground">Use another account</button>
            ) : (
              <p className="text-xs text-muted-foreground">Free. Sign in with Google, no card needed.</p>
            )}
          </div>
        </motion.div>

        <div className="relative mx-auto max-w-5xl px-5 pb-16">
          <div className="relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -left-6 top-2 h-64 w-72 rounded-full bg-emerald-500/18 blur-3xl" />
            <div className="absolute -right-6 bottom-2 h-64 w-72 rounded-full bg-sky-500/14 blur-3xl" />
          </div>
          <Reveal hover className="shine glass relative overflow-hidden rounded-2xl border border-border shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5">
              <img src={logo} alt="" className="h-6 w-6 object-contain" />
              <div className="hidden flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground sm:flex">
                <Search className="h-3.5 w-3.5" /> Search products
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Add</span>
                <span className="h-7 w-7 rounded-full bg-muted" />
              </div>
            </div>
            <div className="flex">
              <div className="hidden w-44 shrink-0 flex-col border-r border-border p-2.5 sm:flex">
                <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Views</p>
                {[
                  { icon: LayoutGrid, label: "All products", count: 23, color: "", active: true },
                  { icon: CircleCheck, label: "Active", count: 18, color: "c-active", active: false },
                  { icon: ClockAlert, label: "Expiring soon", count: 3, color: "c-expiring", active: false },
                  { icon: CircleX, label: "Expired", count: 2, color: "c-expired", active: false },
                ].map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.label} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${v.active ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
                      <Icon className={`h-4 w-4 shrink-0 ${v.color}`} />
                      <span className="truncate">{v.label}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{v.count}</span>
                    </div>
                  );
                })}
                <p className="mb-1 mt-4 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Categories</p>
                {[
                  { icon: LayoutGrid, label: "All categories", count: undefined as number | undefined },
                  { icon: Laptop, label: "Electronics", count: 12 },
                  { icon: WashingMachine, label: "Appliances", count: 4 },
                  { icon: Smartphone, label: "Phones", count: 3 },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{c.label}</span>
                      {c.count !== undefined && (
                        <span className="ml-auto text-[10px] text-muted-foreground">{c.count}</span>
                      )}
                    </div>
                  );
                })}
                <div className="mt-4 border-t border-border pt-2">
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sky-600 dark:text-sky-400"><Sparkles className="h-4 w-4" /> Ask assistant</div>
                </div>
              </div>

              <div className="min-w-0 flex-1 p-3 sm:p-4">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-border bg-card p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground sm:text-[11px]"><ShieldCheck className="h-3.5 w-3.5 c-active" /> Coverage</div>
                    <div className="mt-1 text-xl font-bold sm:text-2xl">75%</div>
                    <div className="mt-0.5 text-[9px] text-muted-foreground sm:text-[10px]">18 of 24 active</div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bar-active" style={{ width: "75%" }} /></div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground sm:text-[11px]"><AlertTriangle className="h-3.5 w-3.5 c-expiring" /> Needs attention</div>
                    <div className="mt-1 text-xl font-bold sm:text-2xl">5</div>
                    <div className="mt-0.5 text-[9px] sm:text-[10px]"><span className="c-expiring">3 expiring</span> · <span className="c-expired">2 expired</span></div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground sm:text-[11px]"><CalendarClock className="h-3.5 w-3.5" /> Next expiry</div>
                    <div className="mt-1 text-xl font-bold sm:text-2xl">12 days</div>
                    <div className="mt-0.5 truncate text-[9px] text-muted-foreground sm:text-[10px]">Dryer · 28 Jun</div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <div className="flex items-center rounded-lg border border-border p-0.5">
                    <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px]"><LayoutGrid className="h-3 w-3" /> Cards</span>
                    <span className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground"><List className="h-3 w-3" /> List</span>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {products.map((c) => {
                    const Icon = c.icon;
                    return (
                      <div key={c.name} className="overflow-hidden rounded-xl border border-border bg-background">
                        <div className="relative flex h-16 items-center justify-center bg-muted text-muted-foreground">
                          <Icon className="h-6 w-6" />
                          <span className={`absolute right-1.5 top-1.5 rounded-full bg-background/85 px-1.5 py-0.5 text-[9px] font-medium shadow-sm backdrop-blur-sm ${c.color}`}>{c.label}</span>
                        </div>
                        <div className="p-2">
                          <div className="truncate text-[11px] font-medium">{c.name}</div>
                          <div className="mt-0.5 truncate text-[9px] text-muted-foreground">{c.cat}</div>
                          <div className="mt-1.5 flex items-center justify-between text-[9px]">
                            <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-2.5 w-2.5" /> 06 / 28</span>
                            <span className={`font-medium ${c.color}`}>{c.left}</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted"><div className={`h-full ${c.bar}`} style={{ width: c.pct }} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal><SectionHead eyebrow="Meet the assistant" title="Just tell it what you need" sub="Add products, find them, check what's expiring, and set reminders, all in plain language." /></Reveal>
          <Reveal hover className="shine glass mx-auto mt-8 max-w-md space-y-2.5 rounded-2xl border border-border p-4 shadow-lg transition-shadow hover:shadow-2xl" delay={0.05}>
            <div className="flex justify-end"><div className="max-w-[82%] rounded-2xl rounded-br-sm bg-emerald-600 px-3.5 py-2.5 text-[13px] text-white">I bought a Sony TV yesterday, 2 year warranty</div></div>
            <div className="flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"><Bot className="h-4 w-4" /></span>
              <div className="rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2.5 text-[13px] text-muted-foreground">
                Added. Here it is:
                <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-border bg-card p-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground"><Tv className="h-4 w-4" /></span>
                  <div><div className="text-xs font-medium text-foreground">Sony TV</div><div className="text-[10px] text-muted-foreground">Expires in 2 years · Electronics</div></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end"><div className="max-w-[82%] rounded-2xl rounded-br-sm bg-emerald-600 px-3.5 py-2.5 text-[13px] text-white">What's expiring soon?</div></div>
            <div className="flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"><Bot className="h-4 w-4" /></span>
              <div className="rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2.5 text-[13px] text-muted-foreground">2 things in the next 30 days: your <span className="text-foreground">Dryer</span> (12 days) and <span className="text-foreground">Coffee machine</span> (26 days).</div>
            </div>
            <div className="flex justify-end"><div className="max-w-[82%] rounded-2xl rounded-br-sm bg-emerald-600 px-3.5 py-2.5 text-[13px] text-white">Remind me 2 weeks before the laptop expires</div></div>
            <div className="flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"><Bot className="h-4 w-4" /></span>
              <div className="rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2.5 text-[13px] text-muted-foreground">Done. I'll remind you on 28 Mar 2027.</div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <Reveal><SectionHead eyebrow="Quick fill" title="Skip the typing" sub="Describe the purchase in a sentence, or upload a receipt. We read the product, store, date and warranty length and fill the form for you to review." /></Reveal>
        <Reveal className="mt-9 grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]" delay={0.05}>
          <div className="space-y-3">
            <div className="shine rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-medium">Describe it</span>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="flex-1 truncate rounded-md border border-border bg-background px-2.5 py-2 text-xs text-muted-foreground">bought a MacBook Pro at Apple Store last month, 3 year warranty</div>
                <span className="shrink-0 rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background">Fill</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">or scan a receipt</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="shine glass overflow-hidden rounded-xl border border-border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-3 flex items-center justify-between border-b border-dashed border-border pb-2 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" /> receipt.jpg</span><span>scanning</span></div>
              <div className="relative space-y-2">
                <div className="h-2 w-2/3 rounded bg-muted" />
                <div className="h-2 w-1/2 rounded bg-muted" />
                <div className="h-2 w-5/6 rounded bg-muted" />
                <div className="h-2 w-3/4 rounded bg-muted" />
                <div className="h-2 w-2/5 rounded bg-muted" />
                <div className="h-2 w-3/5 rounded bg-muted" />
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 h-0.5 rounded bg-emerald-500/80 shadow-[0_0_10px_1px] shadow-emerald-500/60"
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center text-muted-foreground"><ArrowRight className="hidden h-6 w-6 sm:block" /><ArrowRight className="h-5 w-5 rotate-90 sm:hidden" /></div>
          <div className="shine glass rounded-xl border border-border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            {[
              ["Product", "MacBook Pro"],
              ["Store", "Apple Store"],
              ["Purchase date", "May 2026"],
              ["Warranty", "36 months"],
            ].map(([label, value]) => (
              <div key={label} className="mb-2.5 last:mb-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-1 flex items-center justify-between rounded-md border border-emerald-600/30 bg-emerald-600/10 px-2.5 py-1.5 text-xs font-medium">
                  {value}
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-5">
          <Reveal><SectionHead title="Every detail in one place" sub="Each product gets its own page: a clear warranty gauge, its receipts and documents, and its reminders." /></Reveal>
          <Reveal hover className="shine glass mt-9 overflow-hidden rounded-2xl border border-border shadow-lg transition-shadow hover:shadow-2xl" delay={0.05}>
            <div className="flex flex-col sm:flex-row">
              <div className="flex h-40 shrink-0 items-center justify-center bg-muted text-muted-foreground sm:h-auto sm:w-44"><Laptop className="h-16 w-16" /></div>
              <div className="min-w-0 flex-1 p-5">
                <h3 className="truncate text-xl font-bold">MacBook Pro 14"</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Electronics</span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium badge-active">Active</span>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/25">
                  <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
                    <div className="flex items-center gap-4 border-b border-border p-4 sm:border-b-0 sm:border-r">
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                        <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90 c-active">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/20" />
                          <motion.circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={97.39} initial={{ strokeDashoffset: 97.39 }} whileInView={{ strokeDashoffset: 66.2 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: "easeOut" }} />
                        </svg>
                        <span className="absolute text-base font-bold c-active">32%</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase text-muted-foreground">Remaining</p>
                        <p className="mt-0.5 text-2xl font-semibold tracking-tight c-active">587 days</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Coverage still available</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-border text-xs">
                      <div className="bg-card p-3"><div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Purchased</div><p className="mt-1 font-medium text-foreground">12 Jun 2026</p></div>
                      <div className="bg-card p-3"><div className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Expires</div><p className="mt-1 font-medium text-foreground">12 Jun 2029</p></div>
                      <div className="bg-card p-3"><div className="flex items-center gap-1.5 text-muted-foreground"><Store className="h-3.5 w-3.5" /> Store</div><p className="mt-1 font-medium text-foreground">Apple Store</p></div>
                      <div className="bg-card p-3"><div className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Warranty</div><p className="mt-1 font-medium text-foreground">36 months</p></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="inline-flex rounded-lg border border-border p-0.5 text-xs">
                    <span className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground"><FileText className="h-3.5 w-3.5" /> Documents (2)</span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-muted-foreground"><BellRing className="h-3.5 w-3.5" /> Reminders (3)</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"><Receipt className="h-4 w-4" /></span> Receipt.pdf</span>
                    <span className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400"><FileText className="h-4 w-4" /></span> Warranty.jpg</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <Reveal><SectionHead title="Never caught off guard" sub="Automatic reminders at 30, 7 and 1 days before expiry, plus your own custom reminders at any lead time, delivered exactly where you want." /></Reveal>
        <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground" delay={0.04}>
          <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1"><Clock className="h-3.5 w-3.5" /> 30 days</span>
          <span className="h-px w-5 bg-border" />
          <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1"><Clock className="h-3.5 w-3.5" /> 7 days</span>
          <span className="h-px w-5 bg-border" />
          <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1"><Clock className="h-3.5 w-3.5" /> 1 day</span>
          <span className="h-px w-5 bg-border" />
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-600/40 bg-emerald-600/10 px-3 py-1 text-emerald-700 dark:text-emerald-400"><Plus className="h-3.5 w-3.5" /> your own</span>
        </Reveal>
        <Reveal className="mt-8 grid gap-4 sm:grid-cols-3" delay={0.08}>
          {[
            { icon: Bell, title: "In-app", desc: "A live alert and a bell badge while you're using the app." },
            { icon: Mail, title: "Email digest", desc: "A tidy weekly summary of what's expiring, straight to your inbox." },
            { icon: Smartphone, title: "Browser push", desc: "A notification on your device even when the app is closed." },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="shine rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1.5 hover:border-emerald-600/40 hover:shadow-xl hover:shadow-emerald-600/5">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"><Icon className="h-5 w-5" /></span>
                  <span className="h-4 w-7 rounded-full bg-emerald-600/80 p-0.5"><span className="block h-3 w-3 translate-x-3 rounded-full bg-white" /></span>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            );
          })}
        </Reveal>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <Reveal><SectionHead title="And everything else" sub="The small things that make it pleasant to live in." /></Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                whileHover="hover"
                viewport={{ once: true, margin: "-60px" }}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: (idx: number) => ({
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4, ease: "easeOut", delay: (idx % 3) * 0.08 },
                  }),
                  hover: {
                    y: -6,
                    scale: 1.03,
                    transition: { type: "spring", stiffness: 300, damping: 18 },
                  },
                }}
                className="shine rounded-xl border border-border bg-card p-5 transition-[box-shadow,border-color] hover:border-emerald-600/40 hover:shadow-xl hover:shadow-emerald-600/5"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"><Icon className="h-5 w-5" /></span>
                <h3 className="text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">Up and running in seconds</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            { n: 1, title: "Sign in with Google", desc: "No password, no setup." },
            { n: 2, title: "Add your products", desc: "Snap a receipt or tell the assistant." },
            { n: 3, title: "Relax", desc: "We remind you before anything expires." },
          ].map((s) => (
            <Reveal key={s.n} className="text-center" delay={(s.n - 1) * 0.08}>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/10 font-semibold text-emerald-600 dark:text-emerald-400">{s.n}</div>
              <h3 className="text-[15px] font-semibold">{s.title}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl overflow-hidden px-5 pb-16">
        <div className="rounded-2xl border border-border bg-muted/40 px-6 py-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Start protecting your purchases</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">Join in seconds with your Google account.</p>
          {lastUser ? (
            <button onClick={() => signIn()} className="mt-6 inline-flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-left transition-colors hover:border-emerald-600/40 hover:bg-muted">
              {lastUser.avatarUrl ? (
                <img src={lastUser.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">{lastUser.name.charAt(0).toUpperCase()}</span>
              )}
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-foreground">Continue as {lastUser.name.split(" ")[0]}</span>
                <span className="block max-w-[200px] truncate text-xs text-muted-foreground">{lastUser.email}</span>
              </span>
            </button>
          ) : (
            <button onClick={() => signIn()} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90">
              <GoogleIcon />
              Sign in with Google
            </button>
          )}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><img src={logo} alt="" className="h-5 w-5 object-contain" /> Warranty Tracker</div>
          <div>Built by Asaf</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
