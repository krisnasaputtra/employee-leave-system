export function toActionInput<T extends object>(data: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data));
}
