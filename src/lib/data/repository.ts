import { SCHEMA_VERSION, STORAGE_KEY } from "@/lib/domain/constants";
import type { AppData } from "@/lib/domain/types";

/**
 * Persistence boundary. UI code never touches storage directly — it goes
 * through the app store, which uses a `DataRepository`.
 *
 * Today: `LocalStorageRepository` (single browser, no sync).
 * Later: a `SupabaseRepository` (or REST/GraphQL client) implementing the same
 * shape with async, per-entity calls and real authentication.
 */
export interface DataRepository {
  /** Human-readable name shown in Settings. */
  readonly label: string;
  load(): AppData | null;
  save(data: AppData): SaveResult;
  clear(): void;
  /** Notifies when data changes outside this tab (same browser only). */
  subscribeExternal(onChange: (data: AppData | null) => void): () => void;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export class LocalStorageRepository implements DataRepository {
  readonly label = "Browser local storage (this device only)";

  constructor(private readonly key: string = STORAGE_KEY) {}

  load(): AppData | null {
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  save(data: AppData): SaveResult {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(data));
      return { ok: true };
    } catch (e) {
      const quota = e instanceof DOMException && /quota/i.test(e.name + e.message);
      return {
        ok: false,
        error: quota
          ? "Browser storage is full — try removing photos or resetting the demo data."
          : "Could not save to browser storage. Changes will be lost on reload.",
      };
    }
  }

  clear(): void {
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      /* storage unavailable — nothing to clear */
    }
  }

  subscribeExternal(onChange: (data: AppData | null) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === this.key) onChange(this.load());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}
