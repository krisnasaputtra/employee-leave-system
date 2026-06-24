import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Check if an actor has an active delegation from a manager.
 * Returns true if the actor is a delegate of the given manager for today.
 */
export async function hasActiveDelegation(
  delegateId: string,
  delegatorId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  
  const { count } = await supabase
    .from("approval_delegations")
    .select("id", { count: "exact", head: true })
    .eq("delegate_id", delegateId)
    .eq("delegator_id", delegatorId)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today);
  
  return (count ?? 0) > 0;
}
