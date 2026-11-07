/** Menu availability only. Names never establish campaign identity. */
export function partyHasName(
  party: readonly { name?: string }[],
  name: string | undefined
): boolean {
  const normalized = name?.trim().toLowerCase();
  return Boolean(
    normalized &&
      party.some((member) => member.name?.trim().toLowerCase() === normalized)
  );
}
