"use client";

/**
 * Central application store.
 *
 * - One in-memory `AppData` snapshot, shared by every view.
 * - Persisted through a `DataRepository` (browser storage today).
 * - All mutations go through `lib/services/commands.ts`.
 *
 * React reads it with `useSyncExternalStore`, so the server render and first
 * client render both see `null` (no hydration mismatch) and the UI shows a
 * loading state until browser data is available.
 */
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { LocalStorageRepository, type DataRepository } from "@/lib/data/repository";
import type { AppData } from "@/lib/domain/types";
import { buildSeedData } from "@/lib/seed/build-seed";
import * as cmd from "@/lib/services/commands";
import { CommandError, type Actor } from "@/lib/services/commands";

type Listener = () => void;

class AppStore {
  private data: AppData | null = null;
  private loaded = false;
  private listeners = new Set<Listener>();
  private unsubscribeExternal: (() => void) | null = null;

  constructor(private readonly repo: DataRepository) {}

  get repositoryLabel() {
    return this.repo.label;
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    if (!this.unsubscribeExternal && typeof window !== "undefined") {
      this.unsubscribeExternal = this.repo.subscribeExternal((next) => {
        // Another tab in this same browser changed the data.
        this.data = next ?? buildSeedData();
        this.emit();
      });
    }
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): AppData | null => {
    if (!this.loaded && typeof window !== "undefined") {
      this.loaded = true;
      const stored = this.repo.load();
      if (stored) {
        this.data = stored;
      } else {
        this.data = buildSeedData();
        this.repo.save(this.data);
      }
    }
    return this.data;
  };

  getServerSnapshot = (): AppData | null => null;

  private emit() {
    for (const l of this.listeners) l();
  }

  private commit(next: AppData) {
    this.data = next;
    const res = this.repo.save(next);
    if (!res.ok) toast.error(res.error);
    this.emit();
  }

  /** Runs a command against current data with the current demo actor. */
  run<T>(fn: (data: AppData, actor: Actor) => { data: AppData; result: T }): T | undefined {
    const data = this.getSnapshot();
    if (!data) return undefined;
    try {
      const { data: next, result } = fn(data, { id: data.session.employeeId, role: data.session.role });
      if (next !== data) this.commit(next);
      return result;
    } catch (e) {
      if (e instanceof CommandError) {
        toast.error(e.message);
        return undefined;
      }
      throw e;
    }
  }

  update(fn: (data: AppData) => AppData) {
    const data = this.getSnapshot();
    if (!data) return;
    try {
      const next = fn(data);
      if (next !== data) this.commit(next);
    } catch (e) {
      if (e instanceof CommandError) toast.error(e.message);
      else throw e;
    }
  }

  reset() {
    this.repo.clear();
    this.commit(buildSeedData());
  }
}

export const appStore = new AppStore(new LocalStorageRepository());

/** Returns the full data snapshot, or `null` before browser data is loaded. */
export function useAppData(): AppData | null {
  return useSyncExternalStore(appStore.subscribe, appStore.getSnapshot, appStore.getServerSnapshot);
}

/** Use inside `<DataGate>` where data is guaranteed to be loaded. */
export function useData(): AppData {
  const data = useAppData();
  if (!data) throw new Error("useData() called before data loaded — wrap the tree in <DataGate>.");
  return data;
}

/**
 * Typed action surface for components. Each returns the command result
 * (or `undefined` if it failed — a toast has already been shown).
 */
export const actions = {
  switchUser: (employeeId: string) => appStore.update((d) => cmd.setSession(d, employeeId)),
  resetDemo: () => appStore.reset(),

  addAttachment: (input: { url: string; name: string; caption?: string }) =>
    appStore.run((d, a) => cmd.addAttachment(d, a, input)),

  createWorkOrder: (input: cmd.WorkOrderInput) => appStore.run((d, a) => cmd.createWorkOrder(d, a, input)),
  updateWorkOrder: (id: string, input: Parameters<typeof cmd.updateWorkOrder>[3]) =>
    appStore.run((d, a) => ({ data: cmd.updateWorkOrder(d, a, id, input).data, result: true as const })),
  assignWorkOrder: (id: string, assigneeId: string | null) =>
    appStore.run((d, a) => ({ data: cmd.assignWorkOrder(d, a, id, assigneeId).data, result: true as const })),
  changePriority: (id: string, p: Parameters<typeof cmd.changePriority>[3]) =>
    appStore.run((d, a) => ({ data: cmd.changePriority(d, a, id, p).data, result: true as const })),
  changeStatus: (id: string, to: Parameters<typeof cmd.changeStatus>[3], note?: string) =>
    appStore.run((d, a) => {
      const r = cmd.changeStatus(d, a, id, to, note);
      return { data: r.data, result: true as const };
    }),
  submitProgress: (id: string, input: cmd.ProgressInput) =>
    appStore.run((d, a) => {
      const r = cmd.submitProgress(d, a, id, input);
      return { data: r.data, result: true as const };
    }),
  addNote: (id: string, text: string) =>
    appStore.run((d, a) => {
      const r = cmd.addNote(d, a, id, text);
      return { data: r.data, result: true as const };
    }),

  reportBlocker: (input: cmd.BlockerInput) => appStore.run((d, a) => cmd.reportBlocker(d, a, input)),
  resolveBlocker: (id: string, note: string, resume = true) =>
    appStore.run((d, a) => {
      const r = cmd.resolveBlocker(d, a, id, note, resume);
      return { data: r.data, result: true as const };
    }),

  saveBriefing: (input: cmd.BriefingInput, opts: { id?: string; publish: boolean }) =>
    appStore.run((d, a) => cmd.saveBriefing(d, a, input, opts)),
  deleteBriefing: (id: string) =>
    appStore.run((d, a) => {
      const r = cmd.deleteBriefing(d, a, id);
      return { data: r.data, result: true as const };
    }),
  acknowledgeBriefing: (id: string) =>
    appStore.run((d, a) => {
      const r = cmd.acknowledgeBriefing(d, a, id);
      return { data: r.data, result: true as const };
    }),

  sendMessage: (threadId: string, input: { body: string; workOrderId?: string; attachmentIds?: string[] }) =>
    appStore.run((d, a) => cmd.sendMessage(d, a, threadId, input)),
  openDirectThread: (otherId: string) => appStore.run((d, a) => cmd.openDirectThread(d, a, otherId)),
  openWorkOrderThread: (workOrderId: string) => appStore.run((d, a) => cmd.openWorkOrderThread(d, a, workOrderId)),
  /** Idempotent: marks read up to the latest message, so it's safe in effects. */
  markThreadRead: (threadId: string) =>
    appStore.update((d) => {
      const last = d.messages.filter((m) => m.threadId === threadId).reduce((t, m) => (m.createdAt > t ? m.createdAt : t), "");
      return last ? cmd.markThreadRead(d, d.session.employeeId, threadId, last) : d;
    }),

  addEmployee: (input: cmd.EmployeeInput) => appStore.run((d, a) => cmd.addEmployee(d, a, input)),
  updateEmployee: (id: string, patch: Parameters<typeof cmd.updateEmployee>[3]) =>
    appStore.run((d, a) => {
      const r = cmd.updateEmployee(d, a, id, patch);
      return { data: r.data, result: true as const };
    }),
};
