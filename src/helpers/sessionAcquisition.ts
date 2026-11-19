// The inventory format stores this number in "day" under either convention.
export function sessionAcquisition(label?: string) {
  const match = /^(Act|Day)\s*(\d+)(?:\s*[—–-]\s*\d{4}-\d{2}-\d{2})?$/i.exec(
    label?.trim() ?? ''
  );
  const number = match ? Number(match[2]) : undefined;
  return {
    label: match?.[1]?.toLowerCase() === 'act' ? 'Acquired in Act' : 'Day',
    number: Number.isSafeInteger(number) ? number : undefined,
  };
}
