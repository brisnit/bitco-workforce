"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, HardHat, LayoutDashboard, Megaphone, ShieldAlert, Smartphone, Users } from "lucide-react";
import { actions } from "@/lib/store/app-store";
import { WorkforceLogo } from "@/components/brand/logo";

const ROLES = [
  {
    id: "emp-eran",
    href: "/dashboard",
    name: "Eran",
    role: "Admin / Owner",
    icon: LayoutDashboard,
    blurb: "Command center: publish the morning briefing, create and assign jobs, review problems and reports.",
  },
  {
    id: "emp-dale",
    href: "/dashboard",
    name: "Dale Whitaker",
    role: "Shop Supervisor",
    icon: Users,
    blurb: "Run the floor: move jobs on the production board, reassign work, resolve blockers, sign off QC.",
  },
  {
    id: "emp-marcus",
    href: "/worker",
    name: "Marcus Reyes",
    role: "Shop Worker · Machinist",
    icon: HardHat,
    blurb: "Mobile app: read and acknowledge the briefing, start jobs, post progress and photos, report problems.",
  },
];

export default function Home() {
  const router = useRouter();
  return (
    <div className="steel-texture flex min-h-dvh flex-col bg-navy text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <WorkforceLogo />
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-orange px-2 py-1 font-display text-[0.7rem] font-extrabold tracking-[0.12em] text-ink uppercase">
          Interactive prototype
        </span>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12">
        <section className="py-10 sm:py-16">
          <p className="eyebrow text-orange">BITCO Drilling Tools · Machine shop operations</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.02] font-black tracking-[-0.03em] sm:text-6xl">
            Shop operations. <span className="text-orange">Connected.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/75">
            One place for the office, supervisors and the shop floor to answer: what needs to get done today, who&apos;s on it,
            where each job stands, and what&apos;s slowing production down.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            <span className="inline-flex items-center gap-2"><Megaphone className="size-4 text-cyan" /> Daily shop briefing</span>
            <span className="inline-flex items-center gap-2"><ClipboardList className="size-4 text-cyan" /> Work orders & production board</span>
            <span className="inline-flex items-center gap-2"><Smartphone className="size-4 text-cyan" /> Mobile worker app</span>
          </div>
        </section>

        <section>
          <h2 className="eyebrow mb-4 text-cyan">Choose a demo role</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  actions.switchUser(r.id);
                  router.push(r.href);
                }}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition hover:-translate-y-0.5 hover:border-orange hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-orange text-ink">
                  <r.icon className="size-6" />
                </span>
                <span className="eyebrow mt-5 text-cyan">{r.role}</span>
                <span className="mt-1 font-display text-2xl font-extrabold">{r.name}</span>
                <span className="mt-2 flex-1 text-sm text-white/70">{r.blurb}</span>
                <span className="mt-5 inline-flex items-center gap-2 font-display text-sm font-bold tracking-wide text-orange uppercase">
                  Enter as {r.name.split(" ")[0]} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm text-white/85">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber" />
          <p>
            <strong>Prototype notice.</strong> Roles are simulated — there is no login and the role switcher is not secure
            authorization. All people, customers and jobs are fictional (except Eran). Changes are saved in this browser only and
            do not sync between users, devices or browsers. Use &ldquo;Reset demo data&rdquo; in the demo bar to start over.
          </p>
        </section>
      </main>
      <footer className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        BITCO Workforce concept · prepared by Artifact Digital
      </footer>
    </div>
  );
}
