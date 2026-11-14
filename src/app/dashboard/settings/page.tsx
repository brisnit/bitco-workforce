"use client";

import { useState } from "react";
import { ArrowRight, Check, ClipboardCheck, Database, Globe, Inbox, Minus, RotateCcw, ShieldAlert, Wrench } from "lucide-react";
import { can, type Permission } from "@/lib/auth/permissions";
import { authProvider } from "@/lib/auth/session";
import { ROLE_LABEL, WORK_TYPE_LABEL } from "@/lib/domain/constants";
import type { Role } from "@/lib/domain/types";
import { formatDayTime } from "@/lib/dates";
import { integrations } from "@/lib/integrations";
import { sampleIntakeRequests } from "@/lib/integrations/website-intake";
import { appStore, useData } from "@/lib/store/app-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { ResetDemoDialog } from "@/components/shared/demo-bar";

const PERMISSIONS: [Permission, string][] = [
  ["briefing.manage", "Create & publish daily briefings"],
  ["briefing.acknowledge", "Acknowledge briefings"],
  ["workOrder.create", "Create work orders"],
  ["workOrder.edit", "Edit work orders"],
  ["workOrder.assign", "Assign / reassign work"],
  ["workOrder.changePriority", "Change job priority"],
  ["production.move", "Move jobs on the production board"],
  ["workOrder.approveQuality", "Sign off Quality Check → Completed"],
  ["workOrder.cancel", "Cancel work orders"],
  ["blocker.report", "Report problems"],
  ["blocker.resolve", "Resolve problems"],
  ["announcement.send", "Post shop announcements"],
  ["team.manage", "Manage employees"],
  ["reports.view", "View reports"],
];
const ROLES: Role[] = ["admin", "supervisor", "worker"];

export default function SettingsPage() {
  const data = useData();
  const [resetOpen, setResetOpen] = useState(false);
  const counts: [string, number][] = [
    ["Employees", data.employees.length],
    ["Work orders", data.workOrders.length],
    ["Daily briefings", data.briefings.length],
    ["Message threads", data.threads.length],
    ["Messages", data.messages.length],
    ["Problem reports", data.blockers.length],
    ["Activity entries", data.activities.length],
    ["Photos & attachments", data.attachments.length],
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
      <PageHeader eyebrow="Configuration" title="Settings" description="Demo controls, access rules and where the platform could go next." />
      <Tabs defaultValue="demo">
        <TabsList>
          <TabsTrigger value="demo">Demo & data</TabsTrigger>
          <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
          <TabsTrigger value="integrations">Future integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel title="Prototype data" bodyClassName="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-navy text-orange">
                <Database className="size-4" />
              </span>
              <div className="text-sm">
                <p className="font-semibold text-navy">{appStore.repositoryLabel}</p>
                <p className="text-muted-foreground">
                  Changes are saved in this browser only. They do not sync to other users, devices or browsers, and nothing is
                  sent to a server. Sample data generated {formatDayTime(data.seededAt)}.
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2">
              {counts.map(([l, n]) => (
                <div key={l} className="flex justify-between rounded-md bg-steel-50 px-3 py-2 text-sm">
                  <dt className="text-muted-foreground">{l}</dt>
                  <dd className="tabular font-mono font-semibold">{n}</dd>
                </div>
              ))}
            </dl>
            <Button variant="destructive" onClick={() => setResetOpen(true)}>
              <RotateCcw className="size-4" /> Reset demo data
            </Button>
          </Panel>
          <Panel title="Sign-in & security" bodyClassName="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <p>
                Auth provider: <strong>{authProvider.kind === "demo" ? "Demo role switcher" : "Production"}</strong> · verified sessions:{" "}
                <strong>{authProvider.isVerified ? "yes" : "no"}</strong>. Anyone can switch roles. Permission checks only shape the
                interface and are not a security boundary.
              </p>
            </div>
            <p className="text-muted-foreground">
              For production: real sign-in for each employee, a hosted database, and the same permission rules enforced on the
              server (for example with row-level security). The code keeps these behind a repository interface and an auth
              provider interface so the UI does not need to be rewritten.
            </p>
          </Panel>
        </TabsContent>

        <TabsContent value="roles" className="mt-5">
          <Panel title="Permission matrix (simulated)" bodyClassName="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-steel-50 text-left">
                  <th className="px-4 py-2.5 font-semibold">Capability</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-4 py-2.5 text-center font-semibold">{ROLE_LABEL[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(([p, label]) => (
                  <tr key={p} className="border-b last:border-0">
                    <td className="px-4 py-2.5">{label}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="px-4 py-2.5 text-center">
                        {can(r, p) ? (
                          <Check className="mx-auto size-4 text-emerald-600" aria-label="Allowed" />
                        ) : (
                          <Minus className="mx-auto size-4 text-steel-300" aria-label="Not allowed" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-steel-50/60">
                  <td className="px-4 py-2.5" colSpan={4}>
                    <strong>Workers</strong> can start their assigned jobs, post progress, add photos and mark work Ready for QC — but
                    cannot mark a job Completed. A supervisor or the owner signs off after Quality Check.
                  </td>
                </tr>
              </tbody>
            </table>
          </Panel>
        </TabsContent>

        <TabsContent value="integrations" className="mt-5 space-y-5">
          <div className="rounded-lg border border-dashed border-orange-700/40 bg-orange/5 p-3 text-sm text-steel-700">
            <strong>Concept only — not connected.</strong> This page shows how BITCO Workforce could connect to the BITCO website later.
            The website is not modified and no requests are received.
          </div>
          <Panel title="Customer request → office review → shop work order">
            <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <FlowStep icon={Globe} title="Customer request" body="Customer submits a repair, retipping or machining request with photos on the BITCO website." />
              <ArrowRight className="hidden size-5 self-center text-steel-400 md:block" />
              <FlowStep
                icon={Inbox}
                title="Office review"
                body="Request lands in a protected intake queue. An authorized admin confirms scope, pricing and dates."
                highlight
              />
              <ArrowRight className="hidden size-5 self-center text-steel-400 md:block" />
              <FlowStep icon={Wrench} title="Shop work order" body="Only after approval: a work order is created, prioritized and assigned. Status is tracked internally." />
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-steel-700">
              <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              Customer submissions never become shop-floor instructions automatically. Only approved, customer-safe status updates
              (received, in shop, quality check, ready for pickup) would ever be shared back.
            </p>
          </Panel>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Example intake queue (illustrative)" bodyClassName="space-y-2">
              {sampleIntakeRequests.map((r) => (
                <div key={r.id} className="rounded-lg border bg-white p-3 opacity-80">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-ocean">{r.id.toUpperCase()}</span>
                    <span className="rounded bg-steel-100 px-1.5 py-0.5 font-semibold uppercase">{r.status.replace("_", " ")}</span>
                    <span className="ml-auto text-muted-foreground">{WORK_TYPE_LABEL[r.requestedService]}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-navy">{r.company}</p>
                  <p className="text-sm text-steel-600">{r.toolDescription}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" disabled>Review</Button>
                    <Button size="sm" disabled>Approve → create work order</Button>
                  </div>
                </div>
              ))}
            </Panel>
            <Panel title="Integration roadmap" bodyClassName="space-y-3">
              {integrations.map((i) => (
                <div key={i.id} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded bg-steel-100 px-1.5 py-0.5 font-display text-[0.6rem] font-extrabold tracking-wider text-steel-600 uppercase">
                    {i.status}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy">{i.name}</p>
                    <p className="text-sm text-muted-foreground">{i.summary}</p>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </div>
  );
}

function FlowStep({ icon: Icon, title, body, highlight }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-navy bg-navy text-white" : "bg-white"}`}>
      <Icon className={`size-5 ${highlight ? "text-orange" : "text-ocean"}`} />
      <p className={`mt-2 font-display font-bold ${highlight ? "text-white" : "text-navy"}`}>{title}</p>
      <p className={`mt-1 text-sm ${highlight ? "text-white/75" : "text-muted-foreground"}`}>{body}</p>
    </div>
  );
}
