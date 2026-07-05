"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type UntypedRpc = (
  functionName: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message?: string } | null }>;

/**
 * Fetch notification + approval counts for the header badges.
 * Called from a client component via TanStack Query to avoid blocking layout
 * rendering on every navigation. The RPC scopes counts to the current actor.
 */
export async function fetchHeaderCounts(): Promise<{
  unreadNotifications: number;
  pendingApprovals: number;
}> {
  await getAuthenticatedUser();
  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as UntypedRpc;
  const { data, error } = await rpc("get_header_counts");

  if (error) {
    return { unreadNotifications: 0, pendingApprovals: 0 };
  }

  const counts = data as Partial<{
    unreadNotifications: number;
    pendingApprovals: number;
  }> | null;

  return {
    unreadNotifications: counts?.unreadNotifications ?? 0,
    pendingApprovals: counts?.pendingApprovals ?? 0,
  };
}
