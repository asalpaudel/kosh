import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Snowfall from "react-snowfall";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  ShieldCheck,
  LineChart,
  Receipt,
  Users,
  Wallet,
  Building2,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Phone,
  MapPin,
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

export const Logo = ({ className }) => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 189 235"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M54.6339 159.688C54.6339 161.055 54.1681 162.387 53.3071 163.458L34.2955 187.171L10.7546 218.031L10.7559 218.032C7.2741 222.599 0 220.129 0 214.383V96.8369C0.000311621 72.7101 19.0853 52.9297 43.1379 52.1278L45.3102 52.0548V44.7339C45.3102 20.0281 65.2876 0 89.9309 0H147.257C151.983 0 154.788 5.18751 152.382 9.12569L152.134 9.50256L118.563 56.6098C117.547 58.0358 115.964 58.9419 114.233 59.1005L113.885 59.1227L54.6339 61.097V159.688ZM9.32374 204.521L26.9658 181.394L27.0009 181.349L45.3102 158.51V61.4074L43.4475 61.47C24.4209 62.1044 9.32405 77.7516 9.32374 96.8369V204.521ZM54.6339 51.7444L111.932 49.834L140.786 9.34738H89.9309C70.437 9.34738 54.6339 25.1905 54.6339 44.7339V51.7444Z"
      fill="#3EEFB1"
    />
    <path
      d="M133.138 183.254L75.2937 185.163L46.1673 225.653H97.5052C117.185 225.653 133.138 209.81 133.138 190.266V183.254ZM178.879 30.478L161.104 53.5622L161.068 53.6078L161.033 53.6509L142.551 76.4872V173.591L144.43 173.53C163.638 172.895 178.879 157.249 178.879 138.163V30.478ZM188.292 138.163C188.292 162.291 169.026 182.07 144.743 182.872L142.551 182.944V190.266C142.551 214.973 122.383 235 97.5052 235H39.6332C34.7126 235 31.8479 229.477 34.709 225.499L68.5994 178.39L68.6007 178.389C69.6989 176.864 71.4439 175.944 73.3122 175.879L73.3214 175.877L133.138 173.902V75.3123C133.138 73.9417 133.610 72.6179 134.464 71.5566L134.472 71.5475L153.669 47.8283L177.435 16.9669L177.603 16.7569C181.179 12.4802 188.292 14.9612 188.292 20.6169V138.163Z"
      fill="#3EEFB1"
    />
  </svg>
);

function useTheme() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("kosh-theme");
    if (saved === "light" || saved === "dark") return saved;
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("kosh-theme", mode);
  }, [mode]);

  return { mode, setMode };
}

function ThemeToggle({ mode, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      className={[
        "inline-flex items-center justify-center rounded-lg border px-3 py-3 backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-[#14c596]/40",
        mode === "dark"
          ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
          : "border-slate-200 bg-white/70 text-slate-900 hover:bg-white",
      ].join(" ")}
    >
      {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function CursorTrail({ mode }) {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const s1x = useSpring(x, { stiffness: 420, damping: 35, mass: 0.7 });
  const s1y = useSpring(y, { stiffness: 420, damping: 35, mass: 0.7 });
  const s2x = useSpring(s1x, { stiffness: 260, damping: 40, mass: 0.9 });
  const s2y = useSpring(s1y, { stiffness: 260, damping: 40, mass: 0.9 });

  useEffect(() => {
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-[60] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl opacity-30"
        style={{
          left: s2x,
          top: s2y,
          background:
            mode === "dark"
              ? "radial-gradient(circle at 30% 30%, rgba(20,197,150,0.55), rgba(0,0,0,0.0) 70%)"
              : "radial-gradient(circle at 30% 30%, rgba(20,197,150,0.18), rgba(0,0,0,0.0) 70%)",
        }}
      />
      <motion.div
        className="pointer-events-none fixed z-[61] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: s1x,
          top: s1y,
          background: "rgba(20,197,150,1)",
          boxShadow:
            mode === "dark"
              ? "0 0 16px rgba(20,197,150,0.35)"
              : "0 0 14px rgba(20,197,150,0.22)",
        }}
      />
    </>
  );
}

const PRIMARY = "bg-[#14c596] hover:bg-[#21ab87] text-black";

function PrimaryButton({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-[#14c596]/40",
        PRIMARY,
        className,
      ].join(" ")}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function GhostButton({ children, onClick, mode, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-semibold backdrop-blur transition",
        "focus:outline-none focus:ring-2 focus:ring-[#14c596]/40",
        mode === "dark"
          ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
          : "border-slate-200 bg-white/70 text-slate-900 hover:bg-white",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SignInButton({ onClick, mode, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-[#14c596]/40",
        mode === "dark"
          ? "border-white/15 bg-white/5 text-white hover:bg-[#14c596] hover:text-black hover:border-[#14c596]"
          : "border-slate-200 bg-white/70 text-slate-900 hover:bg-[#14c596] hover:text-black hover:border-[#14c596]",
        className,
      ].join(" ")}
    >
      Sign in
    </button>
  );
}

function NavItem({ children, onClick, mode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-sm transition",
        mode === "dark"
          ? "text-slate-200/80 hover:text-white"
          : "text-slate-700 hover:text-slate-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Pill({ icon: Icon, children, mode }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm backdrop-blur",
        mode === "dark"
          ? "border-white/10 bg-white/5 text-slate-200"
          : "border-slate-200 bg-white/70 text-slate-700",
      ].join(" ")}
    >
      <Icon className={["h-4 w-4", mode === "dark" ? "text-emerald-200" : "text-emerald-600"].join(" ")} />
      {children}
    </span>
  );
}

function Card({ children, mode, className = "" }) {
  return (
    <div
      className={[
        "rounded-lg border backdrop-blur",
        mode === "dark"
          ? "border-white/10 bg-white/5"
          : "border-slate-200 bg-white/70",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function HorizontalScroller({ title, subtitle, items, renderItem, mode }) {
  const scrollerRef = useRef(null);

  const scrollBy = (dx) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  const fadeLeft =
    mode === "dark"
      ? "from-slate-950"
      : "from-white";
  const fadeRight =
    mode === "dark"
      ? "from-slate-950"
      : "from-slate-200";

  return (
    <div className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className={["text-2xl font-bold md:text-3xl", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
            {title}
          </h2>
          <p className={["mt-3 max-w-2xl text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
            {subtitle}
          </p>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollBy(-520)}
            className={[
              "rounded-lg border p-2 transition",
              mode === "dark"
                ? "border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
                : "border-slate-200 bg-white/70 text-slate-900 hover:bg-white",
            ].join(" ")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(520)}
            className={[
              "rounded-lg border p-2 transition",
              mode === "dark"
                ? "border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
                : "border-slate-200 bg-white/70 text-slate-900 hover:bg-white",
            ].join(" ")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative mt-6">
        <div className={["pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r to-transparent", fadeLeft].join(" ")} />
        <div className={["pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l to-transparent", fadeRight].join(" ")} />

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              className="min-w-[85%] snap-start sm:min-w-[420px]"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35 }}
            >
              {renderItem(item)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const nav = useNavigate();
  const { mode, setMode } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastYRef = useRef(0);
  const upAccumRef = useRef(0);

  const heroCardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const headerOffset = 88;
    const rect = el.getBoundingClientRect();
    const top = window.pageYOffset + rect.top - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const goSection = (id) => {
    setMenuOpen(false);
    scrollToId(id);
  };

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const last = lastYRef.current;
      const dy = y - last;

      if (dy > 8) {
        upAccumRef.current = 0;
        setNavVisible(false);
      }

      if (dy < -8) {
        upAccumRef.current += Math.abs(dy);
        if (upAccumRef.current >= 140) {
          setNavVisible(true);
          upAccumRef.current = 0;
        }
      }

      if (y < 40) setNavVisible(true);

      lastYRef.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = heroCardRef.current;
    if (!el) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const ry = (px - 0.5) * 14;
      const rx = (0.5 - py) * 10;
      setTilt({ rx, ry });
    };

    const onLeave = () => setTilt({ rx: 0, ry: 0 });

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const snowProps = useMemo(
    () => ({
      snowflakeCount: 120,
      speed: [0.15, 0.75],
      wind: [-0.2, 0.25],
      radius: [0.6, 2.4],
      color: mode === "dark" ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.14)",
    }),
    [mode]
  );

  const features = [
    {
      icon: ShieldCheck,
      title: "Audit trail on every action",
      desc: "Track who created, edited, approved, and exported entries—verification stays straightforward.",
    },
    {
      icon: Users,
      title: "Member-first accounting",
      desc: "Profiles, balances, statements, and history connected to every transaction for clear member service.",
    },
    {
      icon: Receipt,
      title: "Voucher-driven operations",
      desc: "Receipt, payment, journal, bank, and adjustment vouchers with approvals and narration standards.",
    },
    {
      icon: LineChart,
      title: "Reports that match reality",
      desc: "Ledger, trial balance, profit/loss, balance sheet, cash/bank book, interest reports, and more.",
    },
    {
      icon: Lock,
      title: "Role-based access control",
      desc: "Separate admin, accountant, cashier, and staff permissions to protect data and reduce mistakes.",
    },
    {
      icon: Wallet,
      title: "Cash & bank controls",
      desc: "Daily cash position, bank reconciliation support, and controlled withdrawals and settlements.",
    },
  ];

  const modules = [
    { title: "Members & KYC", desc: "Registration, identity records, nominee info, documents, and member statements." },
    { title: "Deposits & Savings", desc: "Daily/recurring deposits, passbook history, maturity schedules, and interest posting." },
    { title: "Loans & Repayments", desc: "Loan products, schedules, installments, penalties, outstanding tracking, and recovery reports." },
    { title: "Vouchers & Approvals", desc: "Receipt, payment, journal, bank vouchers with controlled approvals and narration rules." },
    { title: "General Ledger", desc: "Chart of accounts, ledgers, trial balance, cash/bank book, and closing support." },
    { title: "Exports & Printing", desc: "Print/PDF reports for statements, ledgers, vouchers, and audit packs." },
  ];

  const pageBg =
    mode === "dark"
      ? "bg-slate-950 text-white"
      : "bg-gradient-to-br from-white via-slate-50 to-slate-200 text-slate-900";

  const glowOverlay =
    mode === "dark"
      ? "bg-[radial-gradient(circle_at_20%_10%,rgba(20,197,150,0.10),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(99,102,241,0.10),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.06),transparent_50%)]"
      : "bg-[radial-gradient(circle_at_20%_10%,rgba(20,197,150,0.08),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(15,23,42,0.08),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(0,0,0,0.05),transparent_55%)]";

  return (
    <div className={["relative min-h-screen overflow-hidden", pageBg].join(" ")}>
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        {mode === "dark" && (
          <>
            <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -right-40 top-24 h-[520px] w-[520px] rounded-full bg-indigo-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-[480px] w-[840px] -translate-x-1/2 rounded-full bg-cyan-300/5 blur-3xl" />
          </>
        )}
        <div className={["absolute inset-0", glowOverlay].join(" ")} />
      </div>

      {/* snow */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <Snowfall {...snowProps} />
      </div>

      {/* cursor */}
      <CursorTrail mode={mode} />

      {/* Navbar */}
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          navVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-3 pointer-events-none",
        ].join(" ")}
      >
        <div className="mx-auto w-full px-5 py-4 md:px-8">
          <div
            className={[
              "flex items-center justify-between rounded-lg border px-4 py-3 backdrop-blur",
              mode === "dark"
                ? "border-white/10 bg-white/5"
                : "border-slate-200 bg-white/70",
            ].join(" ")}
          >
            {/* Brand */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-3"
            >
              <div
                className={[
                  "rounded-lg border p-2",
                  mode === "dark"
                    ? "border-white/10 bg-white/5"
                    : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <Logo className="h-8 w-8" />
              </div>
              <div className="text-xl font-semibold tracking-wide md:text-2xl">
                Kosh
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-6 md:flex">
              <NavItem mode={mode} onClick={() => goSection("features")}>Features</NavItem>
              <NavItem mode={mode} onClick={() => goSection("modules")}>Modules</NavItem>
              <NavItem mode={mode} onClick={() => goSection("security")}>Security</NavItem>
              <NavItem mode={mode} onClick={() => goSection("pricing")}>Pricing</NavItem>
              <NavItem mode={mode} onClick={() => goSection("contact")}>Contact</NavItem>
            </nav>

            {/* Actions */}
            <div className="hidden items-center gap-3 md:flex">
              <ThemeToggle
                mode={mode}
                onToggle={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
              />
              <SignInButton mode={mode} onClick={() => nav("/login")} />
              <PrimaryButton onClick={() => goSection("contact")}>
                Request a demo
              </PrimaryButton>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={[
                "inline-flex items-center justify-center rounded-lg border p-2 transition md:hidden",
                mode === "dark"
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-slate-200 bg-white/70 hover:bg-white",
              ].join(" ")}
              aria-label="Open menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu Panel */}
          {menuOpen && (
            <div
              className={[
                "mt-3 rounded-lg border p-3 backdrop-blur md:hidden",
                mode === "dark"
                  ? "border-white/10 bg-slate-950/70"
                  : "border-slate-200 bg-white/85",
              ].join(" ")}
            >
              <div className="flex flex-col gap-2">
                {[
                  ["Features", "features"],
                  ["Modules", "modules"],
                  ["Security", "security"],
                  ["Pricing", "pricing"],
                  ["Contact", "contact"],
                ].map(([label, id]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => goSection(id)}
                    className={[
                      "rounded-lg border px-4 py-3 text-left text-sm transition",
                      mode === "dark"
                        ? "border-white/10 bg-white/5 text-slate-200/85 hover:bg-white/10"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ThemeToggle
                    mode={mode}
                    onToggle={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
                  />
                  <SignInButton
                    mode={mode}
                    onClick={() => {
                      setMenuOpen(false);
                      nav("/login");
                    }}
                    className="w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => goSection("contact")}
                  className="mt-2 w-full rounded-lg bg-[#14c596] py-3 text-sm font-semibold text-black transition hover:bg-[#21ab87]"
                >
                  Request a demo
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* spacing for fixed navbar */}
      <div className="h-[84px]" />

      {/* content */}
      <main className="relative z-20">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-10 md:px-8 md:pb-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill mode={mode} icon={ShieldCheck}>Audit-ready records</Pill>
                <Pill mode={mode} icon={Building2}>Built for cooperatives</Pill>
                <Pill mode={mode} icon={Lock}>Role-based access</Pill>
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Modern accounting for{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                  Sahakari
                </span>{" "}
                operations.
              </h1>

              {/* short on mobile, long on md+ */}
              <p className={["mt-5 max-w-xl text-base leading-relaxed md:hidden", mode === "dark" ? "text-slate-200/85" : "text-slate-700"].join(" ")}>
                Members, vouchers, loans, reports—kept clean and easy to verify.
              </p>
              <p className={["mt-5 hidden max-w-xl text-base leading-relaxed md:block", mode === "dark" ? "text-slate-200/85" : "text-slate-700"].join(" ")}>
                Kosh helps cooperatives manage members, deposits, loans, vouchers, and reports in one clean system—so your team works faster and every number stays easy to verify.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <PrimaryButton onClick={() => goSection("contact")}>
                  Book a live demo
                </PrimaryButton>
                <GhostButton mode={mode} onClick={() => goSection("features")}>
                  Explore features
                </GhostButton>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <Card mode={mode} className="p-5">
                  <div className="text-2xl font-bold">25+</div>
                  <div className={["mt-1 text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-600"].join(" ")}>Voucher types</div>
                </Card>
                <Card mode={mode} className="p-5">
                  <div className="text-2xl font-bold">60+</div>
                  <div className={["mt-1 text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-600"].join(" ")}>Reports & ledgers</div>
                </Card>
                <Card mode={mode} className="p-5">
                  <div className="text-2xl font-bold">Admin</div>
                  <div className={["mt-1 text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-600"].join(" ")}>Staff roles</div>
                </Card>
              </div>
            </div>

            {/* 3D Tilt Card */}
            <motion.div
              ref={heroCardRef}
              className={[
                "relative overflow-hidden rounded-lg border p-6 backdrop-blur md:p-7",
                mode === "dark"
                  ? "border-white/10 bg-white/5"
                  : "border-slate-200 bg-white/70",
              ].join(" ")}
              style={{
                transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              {mode === "dark" && (
                <>
                  <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
                  <div className="absolute -bottom-14 -right-14 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
                </>
              )}

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "rounded-lg border p-2",
                        mode === "dark"
                          ? "border-white/10 bg-white/5"
                          : "border-slate-200 bg-white",
                      ].join(" ")}
                    >
                      <Logo className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Kosh Dashboard</div>
                      <div className={["text-xs", mode === "dark" ? "text-slate-200/70" : "text-slate-600"].join(" ")}>
                        Cooperative ledger & reporting
                      </div>
                    </div>
                  </div>

                  <span
                    className={[
                      "rounded-lg border px-3 py-1 text-xs font-semibold",
                      mode === "dark"
                        ? "border-white/10 bg-white/5 text-slate-100"
                        : "border-slate-200 bg-white text-slate-800",
                    ].join(" ")}
                  >
                    Live
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className={["rounded-lg border p-5", mode === "dark" ? "border-white/10 bg-slate-950/30" : "border-slate-200 bg-white"].join(" ")}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      Today’s Collections
                    </div>
                    <div className="mt-3 text-3xl font-bold">NPR 4,82,500</div>
                    <div className={["mt-2 text-xs", mode === "dark" ? "text-slate-200/70" : "text-slate-600"].join(" ")}>
                      Deposits, fees, installments
                    </div>
                  </div>

                  <div className={["rounded-lg border p-5", mode === "dark" ? "border-white/10 bg-slate-950/30" : "border-slate-200 bg-white"].join(" ")}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <LineChart className="h-4 w-4 text-indigo-400" />
                      Outstanding Loans
                    </div>
                    <div className="mt-3 text-3xl font-bold">NPR 28,10,000</div>
                    <div className={["mt-2 text-xs", mode === "dark" ? "text-slate-200/70" : "text-slate-600"].join(" ")}>
                      By member & product
                    </div>
                  </div>

                  <div className={["rounded-lg border p-5 md:col-span-2", mode === "dark" ? "border-white/10 bg-slate-950/30" : "border-slate-200 bg-white"].join(" ")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Receipt className="h-4 w-4 text-cyan-400" />
                        Voucher Queue
                      </div>
                      <span className={["text-xs", mode === "dark" ? "text-slate-200/70" : "text-slate-600"].join(" ")}>
                        Approvals
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        ["Cash Receipt", "Member Deposit", "Pending"],
                        ["Journal Voucher", "Interest Posting", "Approved"],
                        ["Bank Payment", "Vendor Settlement", "Pending"],
                      ].map(([t, s, st]) => (
                        <div
                          key={t}
                          className={[
                            "flex items-center justify-between rounded-lg border px-4 py-3",
                            mode === "dark"
                              ? "border-white/10 bg-white/5"
                              : "border-slate-200 bg-slate-50",
                          ].join(" ")}
                        >
                          <div>
                            <div className="text-sm font-semibold">{t}</div>
                            <div className={["text-xs", mode === "dark" ? "text-slate-200/70" : "text-slate-600"].join(" ")}>
                              {s}
                            </div>
                          </div>
                          <span
                            className={[
                              "rounded-lg px-3 py-1 text-xs font-semibold ring-1",
                              st === "Approved"
                                ? "bg-[#14c596]/15 text-emerald-700 ring-[#14c596]/25"
                                : "bg-amber-300/10 text-amber-800 ring-amber-300/20",
                              mode === "dark" ? "text-white" : "",
                            ].join(" ")}
                          >
                            {st}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Pill mode={mode} icon={Users}>Member profiles</Pill>
                  <Pill mode={mode} icon={ShieldCheck}>Audit trail</Pill>
                  <Pill mode={mode} icon={Lock}>Approvals workflow</Pill>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features scroller */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <HorizontalScroller
            mode={mode}
            title="Features"
            subtitle="Clean entries, controlled approvals, and reports that match real workflow. No clutter."
            items={features}
            renderItem={(f) => (
              <Card mode={mode} className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={[
                      "rounded-lg border p-3",
                      mode === "dark"
                        ? "border-white/10 bg-white/5"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <f.icon className={["h-5 w-5", mode === "dark" ? "text-emerald-200" : "text-emerald-600"].join(" ")} />
                  </div>
                  <div>
                    <h3 className={["text-base font-semibold", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                      {f.title}
                    </h3>
                    <p className={["mt-2 text-sm leading-relaxed", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          />
        </section>

        {/* Modules scroller */}
        <section id="modules" className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <HorizontalScroller
            mode={mode}
            title="Core modules"
            subtitle="Start with what you need now, expand later—without changing your accounting discipline."
            items={modules}
            renderItem={(m) => (
              <Card mode={mode} className="p-6">
                <div className="flex items-center justify-between">
                  <div className={["text-base font-semibold", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                    {m.title}
                  </div>
                  <Sparkles className={["h-4 w-4", mode === "dark" ? "text-emerald-200" : "text-emerald-600"].join(" ")} />
                </div>
                <p className={["mt-2 text-sm leading-relaxed", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                  {m.desc}
                </p>
              </Card>
            )}
          />
        </section>

        {/* Security */}
        <section id="security" className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className={["text-2xl font-bold md:text-3xl", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                Security and governance you can trust.
              </h2>
              <p className={["mt-3 text-sm leading-relaxed", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                Controlled permissions, clear logs, and export-ready documentation that supports audits and internal checks.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Role-based permissions for admin, accountant, cashier, and staff",
                  "Immutable audit logs for critical actions and approvals",
                  "Optional two-step approval flow for sensitive vouchers",
                  "Controlled exports (PDF/print) and activity tracking",
                ].map((t) => (
                  <Card key={t} mode={mode} className="p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className={["mt-0.5 h-5 w-5", mode === "dark" ? "text-emerald-200" : "text-emerald-600"].join(" ")} />
                      <div className={["text-sm", mode === "dark" ? "text-slate-200/85" : "text-slate-700"].join(" ")}>
                        {t}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Card mode={mode} className="p-7 md:p-10">
              <div className={["text-sm font-semibold", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                Governance checklist
              </div>

              <div className={["mt-4 space-y-3 text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                {[
                  { k: "Daily cash closing", v: "Track opening, inflow, outflow" },
                  { k: "Approval trail", v: "Know who approved what and when" },
                  { k: "Member statements", v: "Clear history per member" },
                  { k: "Report packs", v: "Audit-friendly exports" },
                ].map((r) => (
                  <div
                    key={r.k}
                    className={[
                      "flex items-center justify-between rounded-lg border px-4 py-3",
                      mode === "dark"
                        ? "border-white/10 bg-slate-950/30"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="font-semibold">{r.k}</div>
                    <div className={["text-xs", mode === "dark" ? "text-slate-200/70" : "text-slate-600"].join(" ")}>
                      {r.v}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={[
                  "mt-6 rounded-lg border p-4 text-sm",
                  mode === "dark"
                    ? "border-white/10 bg-white/5 text-slate-100"
                    : "border-slate-200 bg-white text-slate-800",
                ].join(" ")}
              >
                Tip: keep approvals consistent—your reports become cleaner automatically.
              </div>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className={["text-2xl font-bold md:text-3xl", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                Pricing that grows with your cooperative
              </h2>
              <p className={["mt-3 max-w-2xl text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                Start small, expand when you need. Choose a plan that matches your team size and reporting needs.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { name: "Starter", price: "NPR 4,999", items: ["Core ledger + vouchers", "Basic statements", "Standard reports", "Email support"], highlight: false },
              { name: "Professional", price: "NPR 9,999", items: ["Members + deposits + loans", "Approvals workflow", "Advanced reports & exports", "Role-based access"], highlight: true },
              { name: "Enterprise", price: "Custom", items: ["Multi-branch support", "Custom vouchers & packs", "Onboarding + training", "Priority support"], highlight: false },
            ].map((p) => (
              <Card
                key={p.name}
                mode={mode}
                className={[
                  "relative p-7",
                  p.highlight
                    ? mode === "dark"
                      ? "border-[#14c596]/35"
                      : "border-[#14c596]/40"
                    : "",
                ].join(" ")}
              >
                {p.highlight && (
                  <div
                    className={[
                      "absolute right-5 top-5 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-semibold ring-1",
                      mode === "dark"
                        ? "bg-[#14c596]/15 text-emerald-100 ring-[#14c596]/25"
                        : "bg-[#14c596]/15 text-slate-900 ring-[#14c596]/25",
                    ].join(" ")}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Most chosen
                  </div>
                )}

                <div className={["text-lg font-semibold", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                  {p.name}
                </div>

                <div className="mt-3 flex items-end gap-2">
                  <div className={["text-4xl font-bold", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                    {p.price}
                  </div>
                  <div className={["pb-1 text-sm", mode === "dark" ? "text-slate-200/70" : "text-slate-600"].join(" ")}>
                    /month
                  </div>
                </div>

                <ul className={["mt-5 space-y-3 text-sm", mode === "dark" ? "text-slate-200/85" : "text-slate-700"].join(" ")}>
                  {p.items.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <CheckCircle2 className={["mt-0.5 h-4 w-4", mode === "dark" ? "text-emerald-200" : "text-emerald-600"].join(" ")} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <PrimaryButton onClick={() => goSection("contact")}>
                    Get started
                  </PrimaryButton>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact (NO form) */}
        <section id="contact" className="mx-auto max-w-7xl px-5 pb-20 pt-14 md:px-8">
          <Card mode={mode} className="p-8 md:p-12">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h3 className={["text-2xl font-bold md:text-3xl", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                  Contact us
                </h3>
                <p className={["mt-3 text-sm leading-relaxed", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                  Want a quick walkthrough or a setup plan for your cooperative? Call us, visit our office, or email us—simple.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <PrimaryButton onClick={() => nav("/signup")}>
                    Start free setup
                  </PrimaryButton>
                  <SignInButton mode={mode} onClick={() => nav("/login")} />
                </div>

                <p className={["mt-4 text-xs", mode === "dark" ? "text-slate-300/70" : "text-slate-600"].join(" ")}>
                  We can tailor modules and reporting based on your workflow.
                </p>
              </div>

              <div className="grid gap-4">
                <div className={["rounded-lg border p-5", mode === "dark" ? "border-white/10 bg-slate-950/30" : "border-slate-200 bg-white"].join(" ")}>
                  <div className={["flex items-center gap-2 text-sm font-semibold", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                    <Phone className={["h-4 w-4", mode === "dark" ? "text-emerald-200" : "text-emerald-600"].join(" ")} />
                    Call us
                  </div>
                  <div className={["mt-2 text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                    +977 98XXXXXXXX
                  </div>
                  <div className={["mt-1 text-xs", mode === "dark" ? "text-slate-200/60" : "text-slate-600"].join(" ")}>
                    Sunday–Friday, 10:00 AM – 6:00 PM
                  </div>
                </div>

                <div className={["rounded-lg border p-5", mode === "dark" ? "border-white/10 bg-slate-950/30" : "border-slate-200 bg-white"].join(" ")}>
                  <div className={["flex items-center gap-2 text-sm font-semibold", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                    <Mail className={["h-4 w-4", mode === "dark" ? "text-emerald-200" : "text-emerald-600"].join(" ")} />
                    Email
                  </div>
                  <div className={["mt-2 text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                    support@kosh.app
                  </div>
                  <div className={["mt-1 text-xs", mode === "dark" ? "text-slate-200/60" : "text-slate-600"].join(" ")}>
                    Reply within 1 business day
                  </div>
                </div>

                <div className={["rounded-lg border p-5", mode === "dark" ? "border-white/10 bg-slate-950/30" : "border-slate-200 bg-white"].join(" ")}>
                  <div className={["flex items-center gap-2 text-sm font-semibold", mode === "dark" ? "text-white" : "text-slate-900"].join(" ")}>
                    <MapPin className={["h-4 w-4", mode === "dark" ? "text-emerald-200" : "text-emerald-600"].join(" ")} />
                    Visit our office
                  </div>
                  <div className={["mt-2 text-sm", mode === "dark" ? "text-slate-200/80" : "text-slate-700"].join(" ")}>
                    Biratnagar, Nepal (Office Address)
                  </div>
                  <div className={["mt-1 flex items-center gap-2 text-xs", mode === "dark" ? "text-slate-200/60" : "text-slate-600"].join(" ")}>
                    <Clock className="h-3.5 w-3.5" />
                    Walk-ins by appointment
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className={["relative z-20 border-t", mode === "dark" ? "border-white/10" : "border-slate-200"].join(" ")}>
        <div className={["mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm md:flex-row md:items-center md:justify-between md:px-8", mode === "dark" ? "text-slate-200/70" : "text-slate-600"].join(" ")}>
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span>© {new Date().getFullYear()} Kosh</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <button type="button" onClick={() => goSection("features")} className={mode === "dark" ? "hover:text-white" : "hover:text-slate-900"}>
              Features
            </button>
            <button type="button" onClick={() => goSection("security")} className={mode === "dark" ? "hover:text-white" : "hover:text-slate-900"}>
              Security
            </button>
            <button type="button" onClick={() => goSection("pricing")} className={mode === "dark" ? "hover:text-white" : "hover:text-slate-900"}>
              Pricing
            </button>
            <button type="button" onClick={() => nav("/privacy")} className={mode === "dark" ? "hover:text-white" : "hover:text-slate-900"}>
              Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
