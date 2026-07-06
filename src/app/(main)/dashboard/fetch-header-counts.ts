"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getRpcResultNumber } from "@/lib/supabase/rpc-result";
import { createClient } from "@/lib/supabase/server";
import { getUntypedRpc } from "@/lib/supabase/untyped-rpc";

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
  const rpc = getUntypedRpc(supabase);
  const { data, error } = await rpc("get_header_counts");

  if (error) {
    return { unreadNotifications: 0, pendingApprovals: 0 };
  }

  return {
    unreadNotifications: getRpcResultNumber(data, "unreadNotifications"),
    pendingApprovals: getRpcResultNumber(data, "pendingApprovals"),
  };
}
