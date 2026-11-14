"use client";

import { Database, MonitorSmartphone, ShieldAlert, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const POINTS = [
  {
    icon: ShieldAlert,
    title: "Roles are simulated",
    body: "The role switcher lets you see each interface instantly. There is no login, and it is not secure authorization — anyone can switch.",
  },
  {
    icon: Database,
    title: "Data lives in this browser",
    body: "Changes are saved to this browser's local storage so you can click through the full workflow. Use Reset demo data to start over.",
  },
  {
    icon: Users,
    title: "No real multi-user sync",
    body: "Updates do not reach other people, devices or browsers, and messages are not delivered to anyone. A shared database and real sign-in would be added for production.",
  },
  {
    icon: MonitorSmartphone,
    title: "Web app, not a native app",
    body: "The worker view is a mobile-first web app that can be added to a home screen. A native app (Expo / React Native) would be a separate later build.",
  },
];

export function AboutDemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold text-navy">About this prototype</DialogTitle>
          <DialogDescription>
            BITCO Workforce is an interactive concept demo with fictional sample data (people, customers and jobs are
            invented, except Eran).
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-4">
          {POINTS.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-navy text-orange">
                <p.icon className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-navy">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
