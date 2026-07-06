export type UntypedRpc = (
  functionName: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message?: string } | null }>;

export function getUntypedRpc(client: { rpc: unknown }): UntypedRpc {
  if (typeof client.rpc !== "function") {
    throw new TypeError("Supabase client RPC method is unavailable.");
  }
  return client.rpc.bind(client) as UntypedRpc;
}
