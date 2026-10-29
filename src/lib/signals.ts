/** Discord IDs are snowflakes; the account creation time is encoded in the ID. Returns null for non-Discord IDs. */
export function discordAccountCreatedAt(id: string): Date | null {
  if (!/^\d{17,20}$/.test(id)) return null;
  try {
    const ms = Number((BigInt(id) >> BigInt(22)) + BigInt(1420070400000));
    return new Date(ms);
  } catch {
    return null;
  }
}
