export function getRpcResultObject(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return Object.fromEntries(Object.entries(data));
  }
  return {};
}

export function getRpcResultString(data: unknown, key: string): string {
  const value = getRpcResultObject(data)[key];
  return typeof value === "string" ? value : "";
}

export function getRpcResultNullableString(data: unknown, key: string): string | null {
  const value = getRpcResultObject(data)[key];
  return typeof value === "string" ? value : null;
}

export function getRpcResultNumber(data: unknown, key: string): number {
  const value = getRpcResultObject(data)[key];
  return typeof value === "number" ? value : 0;
}

export function getRpcResultBoolean(data: unknown, key: string): boolean {
  const value = getRpcResultObject(data)[key];
  return typeof value === "boolean" ? value : false;
}

export function hasRpcResultFields(data: unknown): boolean {
  return Object.keys(getRpcResultObject(data)).length > 0;
}
