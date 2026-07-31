/**
 * Route guard utilities for TanStack Router.
 *
 * Usage in a layout route:
 *   beforeLoad: ({ context }) => requireAuth(context),
 *   beforeLoad: ({ context }) => requireRole(context, "admin"),
 */

import { redirect } from "@tanstack/react-router";
import { getAccessToken } from "@/lib/api-client";
import { authService } from "@/lib/services/auth-service";

type AccountType = "guest" | "lender" | "employee" | "admin";

/** Fetch the current user's profile (cached in module scope for the lifetime of a navigation). */
let _cachedProfile: { account_type: AccountType } | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 s — re-fetch after navigation or 30 s

async function getProfile() {
  const now = Date.now();
  if (_cachedProfile && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedProfile;
  }
  const me = await authService.getMe();
  _cachedProfile = me;
  _cacheTimestamp = now;
  return me;
}

/** Invalidate the profile cache (call after login / logout). */
export function invalidateProfileCache() {
  _cachedProfile = null;
  _cacheTimestamp = 0;
}

/**
 * Redirect unauthenticated users to /login.
 * Returns the user profile so downstream loaders can use it.
 */
export async function requireAuth() {
  const token = getAccessToken();
  if (!token) {
    throw redirect({ to: "/login" });
  }
  try {
    return await getProfile();
  } catch {
    throw redirect({ to: "/login" });
  }
}

/**
 * Redirect to /login if not authenticated, or to /login with a
 * "forbidden" message if the user's account_type does not match.
 *
 * @param allowedType  The account_type required to access this section.
 * @param redirectTo   Where to send the user if they are the wrong type.
 *                     Defaults to "/login".
 */
export async function requireRole(
  allowedType: AccountType,
  redirectTo: string = "/login",
) {
  const user = await requireAuth();
  if (user.account_type !== allowedType) {
    // Send them to their own portal instead of a blank /login
    const portalMap: Record<AccountType, string> = {
      guest: "/app",
      lender: "/erp",
      employee: "/field",
      admin: "/admin",
    };
    const dest = portalMap[user.account_type] ?? redirectTo;
    throw redirect({ to: dest });
  }
  return user;
}
