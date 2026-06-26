/**
 * Generate a strong temporary password (10 chars).
 * Guaranteed: 1+ uppercase, 2+ lowercase, 2+ digits, 1+ special.
 * Ambiguous chars excluded (0/O/1/l/I).
 */
export function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%";
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

  const required = [pick(upper), pick(lower), pick(lower), pick(digits), pick(digits), pick(special)];
  const all = upper + lower + digits + special;
  for (let i = 0; i < 4; i++) required.push(pick(all));

  return required.sort(() => Math.random() - 0.5).join("");
}
