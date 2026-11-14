/**
 * Registry of planned integrations. All are inactive in the prototype; the
 * Settings → Future Integrations page renders this list.
 */
export interface IntegrationDescriptor {
  id: string;
  name: string;
  status: "concept" | "planned";
  summary: string;
}

export const integrations: IntegrationDescriptor[] = [
  {
    id: "website-intake",
    name: "BITCO website service requests",
    status: "planned",
    summary: "Customer repair, retipping and machining requests flow into a protected office review queue.",
  },
  {
    id: "database-auth",
    name: "Shared database & sign-in",
    status: "planned",
    summary: "Replace browser storage with a hosted database and real logins so updates sync across devices.",
  },
  {
    id: "native-app",
    name: "Native worker app (Expo / React Native)",
    status: "concept",
    summary: "Reuse the domain models and services in a native app with camera, offline mode and push notifications.",
  },
  {
    id: "notifications",
    name: "SMS / push notifications",
    status: "concept",
    summary: "Notify workers when a briefing is published or a job is assigned.",
  },
  {
    id: "erp",
    name: "Accounting / ERP export",
    status: "concept",
    summary: "Optional export of completed jobs and hours. Workforce will not replace accounting or payroll.",
  },
];
