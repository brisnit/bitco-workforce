/**
 * Authentication abstraction.
 *
 * The prototype uses `DemoAuthProvider`: the "current user" is whoever was
 * picked in the demo role switcher, stored in the browser. There is NO login,
 * no password and no server-side check — anyone can switch roles.
 *
 * A production `AuthProvider` (e.g. Supabase Auth, Clerk, Auth0) would return
 * a verified session from a signed token, and the server would enforce
 * permissions from `permissions.ts` on every request.
 */
import type { AppData, DemoSession } from "@/lib/domain/types";

export interface AuthProvider {
  readonly kind: "demo" | "production";
  getSession(data: AppData): DemoSession;
  /** Whether the session is cryptographically verified. Always false in the demo. */
  readonly isVerified: boolean;
}

export const DemoAuthProvider: AuthProvider = {
  kind: "demo",
  isVerified: false,
  getSession: (data) => data.session,
};

export const authProvider: AuthProvider = DemoAuthProvider;
