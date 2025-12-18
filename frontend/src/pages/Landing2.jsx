// Landing.jsx (or src/pages/Landing.jsx)
// npm i react-snowfall framer-motion lucide-react
import React, { useEffect, useMemo, useRef, useState } from "react";
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

/** 3D cursor + trailing glow */
function CursorTrail() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const s1x = useSpring(x, { stiffness: 420, damping: 35, mass: 0.7 });
  const s1y = useSpring(y, { stiffness: 420, damping: 35, mass: 0.7 });
  const s2x = useSpring(s1x, { stiffness: 260, damping: 40, mass: 0.9 });
  const s2y = useSpring(s1y, { stiffness: 260, damping: 40, mass: 0.9 });
  const s3x = useSpring(s2x, { stiffness: 180, damping: 45, mass: 1.1 });
  const s3y = useSpring(s2y, { stiffness: 180, damping: 45, mass: 1.1 });

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
      {/* Soft glow layers */}
      <motion.div
        className="pointer-events-none fixed z-[60] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl opacity-40"
        style={{
          left: s3x,
          top: s3y,
          background:
            "radial-gradient(circle at 30% 30%, rgba(62,239,177,0.55), rgba(99,102,241,0.25), transparent 65%)",
        }}
      />
      <motion.div
        className="pointer-events-none fixed z-[61] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl opacity-55"
        style={{
          left: s2x,
          top: s2y,
          background:
            "radial-gradient(circle at 30% 30%, rgba(62,239,177,0.75), rgba(15,23,42,0.0) 70%)",
        }}
      />
      {/* Cursor core */}
      <motion.div
        className="pointer-events-none fixed z-[62] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: s1x,
          top: s1y,
          background:
            "linear-gradient(135deg, rgba(62,239,177,1), rgba(99,102,241,1))",
          boxShadow: "0 0 18px rgba(62,239,177,0.55)",
        }}
      />
    </>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
      {children}
    </span>
  );
}

function PrimaryButton({ children, href = "#", onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-300/90 to-indigo-400/90 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-400/10 ring-1 ring-white/10 transition hover:shadow-emerald-400/20 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </a>
  );
}

function GhostButton({ children, href = "#" }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition hover:bg-white/10"
    >
      {children}
    </a>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/10 blur-2xl" />
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <Icon className="h-5 w-5 text-emerald-200" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-200/80">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-200/80">{label}</div>
    </div>
  );
}

function PricingCard({ name, price, items, highlight }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl border p-7 backdrop-blur",
        highlight
          ? "border-emerald-300/30 bg-gradient-to-b from-emerald-300/10 to-white/5"
          : "border-white/10 bg-white/5",
      ].join(" ")}
    >
      {highlight && (
        <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/20">
          <Sparkles className="h-3.5 w-3.5" />
          Most chosen
        </div>
      )}
      <div className="text-lg font-semibold text-white">{name}</div>
      <div className="mt-3 flex items-end gap-2">
        <div className="text-4xl font-bold text-white">{price}</div>
        <div className="pb-1 text-sm text-slate-200/70">/month</div>
      </div>
      <ul className="mt-5 space-y-3 text-sm text-slate-200/85">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <PrimaryButton href="#contact">Get started</PrimaryButton>
      </div>
    </div>
  );
}

export default function Landing() {
  const heroCardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    const el = heroCardRef.current;
    if (!el) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height; // 0..1
      const ry = (px - 0.5) * 14; // rotateY
      const rx = (0.5 - py) * 10; // rotateX
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
      // Keep it soft and clean
      snowflakeCount: 140,
      speed: [0.2, 0.9],
      wind: [-0.2, 0.3],
      radius: [0.6, 2.6],
    }),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -right-40 top-24 h-[520px] w-[520px] rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[480px] w-[840px] -translate-x-1/2 rounded-full bg-cyan-300/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(62,239,177,0.08),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(99,102,241,0.10),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.06),transparent_50%)]" />
      </div>

      {/* Snow effect */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <Snowfall {...snowProps} />
      </div>

      {/* Cursor */}
      <CursorTrail />

      {/* Top Nav */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur">
              <Logo className="h-8 w-8" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-wide">Kosh</div>
              <div className="text-xs text-slate-300/80">
                Sahakari Accounting Platform
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm text-slate-200/80 md:flex">
            <a className="hover:text-white" href="#features">
              Features
            </a>
            <a className="hover:text-white" href="#modules">
              Modules
            </a>
            <a className="hover:text-white" href="#security">
              Security
            </a>
            <a className="hover:text-white" href="#pricing">
              Pricing
            </a>
            <a className="hover:text-white" href="#contact">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <GhostButton href="/login">Sign in</GhostButton>
            <PrimaryButton href="#contact">Request a demo</PrimaryButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-20">
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-8 md:px-8 md:pb-20 md:pt-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill>
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  Audit-ready records
                </Pill>
                <Pill>
                  <Building2 className="h-4 w-4 text-indigo-200" />
                  Built for cooperatives
                </Pill>
                <Pill>
                  <Lock className="h-4 w-4 text-cyan-200" />
                  Role-based access
                </Pill>
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Modern accounting for{" "}
                <span className="bg-gradient-to-r from-emerald-200 to-indigo-200 bg-clip-text text-transparent">
                  Sahakari
                </span>{" "}
                operations.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200/85">
                Kosh helps cooperatives manage members, deposits, loans,
                vouchers, and reports in one clean system—so your team works
                faster, your data stays consistent, and every number is easy to
                verify.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <PrimaryButton href="#contact">Book a live demo</PrimaryButton>
                <GhostButton href="#features">Explore features</GhostButton>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <Stat label="Voucher types" value="25+" />
                <Stat label="Reports & ledgers" value="60+" />
                <Stat label="User roles" value="Admin • Staff" />
              </div>

              <p className="mt-4 text-xs text-slate-300/70">
                Designed for daily use: simple screens, clear approvals, and
                export-ready reports.
              </p>
            </div>

            {/* 3D Tilt Card */}
            <motion.div
              ref={heroCardRef}
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7"
              style={{
                transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
              <div className="absolute -bottom-14 -right-14 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                      <Logo className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Kosh Dashboard
                      </div>
                      <div className="text-xs text-slate-200/70">
                        Cooperative ledger & reporting
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Live
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Wallet className="h-4 w-4 text-emerald-200" />
                      Today’s Collections
                    </div>
                    <div className="mt-3 text-3xl font-bold text-white">
                      NPR 4,82,500
                    </div>
                    <div className="mt-2 text-xs text-slate-200/70">
                      Deposits, fees, installments
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <LineChart className="h-4 w-4 text-indigo-200" />
                      Outstanding Loans
                    </div>
                    <div className="mt-3 text-3xl font-bold text-white">
                      NPR 28,10,000
                    </div>
                    <div className="mt-2 text-xs text-slate-200/70">
                      By member & product
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Receipt className="h-4 w-4 text-cyan-200" />
                        Voucher Queue
                      </div>
                      <span className="text-xs text-slate-200/70">
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
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {t}
                            </div>
                            <div className="text-xs text-slate-200/70">{s}</div>
                          </div>
                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                              st === "Approved"
                                ? "bg-emerald-300/10 text-emerald-100 ring-emerald-300/20"
                                : "bg-amber-300/10 text-amber-100 ring-amber-300/20",
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
                  <Pill>
                    <Users className="h-4 w-4 text-emerald-200" />
                    Member profiles
                  </Pill>
                  <Pill>
                    <ShieldCheck className="h-4 w-4 text-indigo-200" />
                    Audit trail
                  </Pill>
                  <Pill>
                    <Lock className="h-4 w-4 text-cyan-200" />
                    Approvals workflow
                  </Pill>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Everything a cooperative needs—kept simple.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200/80">
                Clean entries, controlled approvals, and reports that match your
                real workflow. No clutter, no confusion.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={ShieldCheck}
              title="Audit trail on every action"
              desc="Track who created, edited, approved, and exported entries—so verification is always straightforward."
            />
            <FeatureCard
              icon={Users}
              title="Member-first accounting"
              desc="Profiles, balances, statements, and history connected to every transaction for clear member service."
            />
            <FeatureCard
              icon={Receipt}
              title="Voucher-driven operations"
              desc="Receipt, payment, journal, bank, and adjustment vouchers with approval flow and narration standards."
            />
            <FeatureCard
              icon={LineChart}
              title="Reports that match reality"
              desc="Ledger, trial balance, profit/loss, balance sheet, cash/bank book, interest reports, and more."
            />
            <FeatureCard
              icon={Lock}
              title="Role-based access control"
              desc="Separate admin, accountant, cashier, and branch staff permissions to keep data protected."
            />
            <FeatureCard
              icon={Wallet}
              title="Cash & bank controls"
              desc="Daily cash position, bank reconciliation support, and controlled withdrawals and settlements."
            />
          </div>
        </section>

        {/* Modules */}
        <section
          id="modules"
          className="mx-auto max-w-7xl px-5 py-14 md:px-8"
        >
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur md:p-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Core modules
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-slate-200/80">
                  Configure what you need today, and expand later—without
                  changing your accounting discipline.
                </p>
              </div>
              <Pill>
                <Sparkles className="h-4 w-4 text-emerald-200" />
                Clean UI • Fast workflow
              </Pill>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Members & KYC",
                  desc: "Member registration, identity records, nominee, documents, and member statements.",
                },
                {
                  title: "Deposits & Savings",
                  desc: "Daily/recurring deposits, passbook-style history, maturity schedules, and interest posting.",
                },
                {
                  title: "Loans & Repayments",
                  desc: "Loan products, schedules, installments, penalties, outstanding tracking, and recovery reports.",
                },
                {
                  title: "Vouchers & Approvals",
                  desc: "Receipt, payment, journal, bank vouchers with controlled approvals and narration rules.",
                },
                {
                  title: "General Ledger",
                  desc: "Chart of accounts, ledgers, trial balance, cash/bank book, and closing support.",
                },
                {
                  title: "Exports & Printing",
                  desc: "PDF/print formats for statements, ledgers, vouchers, and report packs for audits.",
                },
              ].map((m) => (
                <div
                  key={m.title}
                  className="rounded-3xl border border-white/10 bg-slate-950/30 p-6"
                >
                  <div className="text-base font-semibold text-white">
                    {m.title}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-200/80">
                    {m.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section
          id="security"
          className="mx-auto max-w-7xl px-5 py-14 md:px-8"
        >
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Security and governance you can trust.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-200/80">
                Kosh is designed for accountability: controlled permissions,
                clear logs, and export-ready documentation that supports audits
                and internal checks.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Role-based permissions for admin, accountant, cashier, and staff",
                  "Immutable audit logs for critical actions and approvals",
                  "Optional two-step approval flow for sensitive vouchers",
                  "Controlled exports (PDF/print) and activity tracking",
                ].map((t) => (
                  <div
                    key={t}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-200" />
                    <div className="text-sm text-slate-200/85">{t}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur md:p-10">
              <div className="text-sm font-semibold text-white">
                Governance checklist
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-200/80">
                {[
                  { k: "Daily cash closing", v: "Track opening, inflow, outflow" },
                  { k: "Approval trail", v: "Know who approved what and when" },
                  { k: "Member statements", v: "Clear history per member" },
                  { k: "Report packs", v: "Audit-friendly exports" },
                ].map((r) => (
                  <div
                    key={r.k}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3"
                  >
                    <div className="font-semibold text-white">{r.k}</div>
                    <div className="text-xs text-slate-200/70">{r.v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
                Tip: keep approvals consistent—your reports become cleaner
                automatically.
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="mx-auto max-w-7xl px-5 py-14 md:px-8"
        >
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Pricing that grows with your cooperative
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-200/80">
                Start small, expand when you need. Choose a plan that matches
                your team size and reporting needs.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <PricingCard
              name="Starter"
              price="NPR 4,999"
              items={[
                "Core ledger + vouchers",
                "Basic member statements",
                "Standard reports",
                "Email support",
              ]}
            />
            <PricingCard
              name="Professional"
              price="NPR 9,999"
              highlight
              items={[
                "Members + deposits + loans",
                "Approvals workflow",
                "Advanced reports & exports",
                "Role-based access control",
              ]}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              items={[
                "Multi-branch support",
                "Custom vouchers & report packs",
                "Onboarding + training",
                "Priority support",
              ]}
            />
          </div>
        </section>

        {/* Contact / CTA */}
        <section
          id="contact"
          className="mx-auto max-w-7xl px-5 pb-20 pt-14 md:px-8"
        >
          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/5 p-8 backdrop-blur md:p-12">
            <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -right-16 -bottom-16 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

            <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-2xl font-bold text-white md:text-3xl">
                  Want a demo tailored to your workflow?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-200/80">
                  Tell us your cooperative size and the modules you use (members,
                  deposits, loans, vouchers). We’ll show you the exact setup and
                  reporting you need.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <PrimaryButton href="/signup">Start free setup</PrimaryButton>
                  <GhostButton href="/login">Open dashboard</GhostButton>
                </div>

                <div className="mt-5 text-xs text-slate-300/70">
                  No clutter. Clean records. Strong control.
                </div>
              </div>

              <form
                className="rounded-3xl border border-white/10 bg-slate-950/30 p-6"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="grid gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-200/80">
                      Cooperative name
                    </label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                      placeholder="e.g., ABC Sahakari"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-200/80">
                        Contact number
                      </label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                        placeholder="98XXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-200/80">
                        Team size
                      </label>
                      <select className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40">
                        <option className="bg-slate-950">1–3</option>
                        <option className="bg-slate-950">4–10</option>
                        <option className="bg-slate-950">11–25</option>
                        <option className="bg-slate-950">25+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-200/80">
                      What do you want to manage?
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["Members", "Deposits", "Loans", "Vouchers", "Reports"].map(
                        (t) => (
                          <span
                            key={t}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200/85"
                          >
                            {t}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Request a demo <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-xs text-slate-300/70">
                    We’ll respond with a demo schedule and setup checklist.
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-200/70 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span>© {new Date().getFullYear()} Kosh</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <a className="hover:text-white" href="#features">
              Features
            </a>
            <a className="hover:text-white" href="#security">
              Security
            </a>
            <a className="hover:text-white" href="#pricing">
              Pricing
            </a>
            <a className="hover:text-white" href="/privacy">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
