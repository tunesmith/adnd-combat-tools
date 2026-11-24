import type { CampaignSession } from './campaignSnapshots';

export function isSessionDate(value: string) {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function formatSessionDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function nextSessionNumber(sessions: CampaignSession[]) {
  const numbers = sessions.map((session) => session.sessionNumber ?? 0);
  const largest = Math.max(0, ...numbers);
  if (largest < Number.MAX_SAFE_INTEGER) return largest + 1;
  const used = new Set(numbers);
  let number = 1;
  while (used.has(number)) number++;
  return number;
}

export function sessionDetails(
  sessions: CampaignSession[],
  draft: { label: string; date: string; number: string },
  existing?: CampaignSession
): Pick<CampaignSession, 'label' | 'date' | 'sessionNumber'> {
  const label = draft.label.trim();
  if (!label || label.length > 1000)
    throw new Error('Enter a session name (up to 1000 characters).');
  const date = draft.date || undefined;
  if (date && !isSessionDate(date)) throw new Error('Enter a valid date.');
  const sessionNumber = draft.number ? Number(draft.number) : undefined;
  if (sessionNumber === undefined) {
    if (!existing || existing.sessionNumber !== undefined)
      throw new Error('Enter a positive whole session number.');
  } else if (!Number.isSafeInteger(sessionNumber) || sessionNumber < 1) {
    throw new Error('Enter a positive whole session number.');
  } else if (
    sessions.some(
      (s) => s.id !== existing?.id && s.sessionNumber === sessionNumber
    )
  ) {
    throw new Error(`Session number ${sessionNumber} is already in use.`);
  }
  return { label, date, sessionNumber };
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Only file loads call this. The document marker also covers sessions whose
// legacy labels were ambiguous and sessions whose dates have since been cleared.
export function upgradeCampaignSessionMetadata(doc: unknown) {
  if (
    !object(doc) ||
    doc['kind'] !== 'adnd-campaign' ||
    doc['schemaVersion'] !== 21 ||
    doc['sessionMetadataVersion'] !== undefined ||
    !Array.isArray(doc['sessions'])
  )
    return;

  const numberCounts = new Map<number, number>();
  const recognized: { session: Record<string, unknown>; number: number }[] = [];
  for (const session of doc['sessions'] as unknown[]) {
    if (!object(session) || typeof session['label'] !== 'string') continue;
    const match =
      /^((?:Act|Day|Session)\s*(\d+))(?:(?:\s*[—–-]\s*|\s+)(\d{4}-\d{2}-\d{2}))?$/i.exec(
        session['label'].trim()
      );
    if (!match) continue;
    const [, name, digits, date] = match;
    const number = Number(digits);
    if (!Number.isSafeInteger(number) || number < 1) continue;
    if (date && isSessionDate(date)) {
      session['label'] = name;
      session['date'] = date;
    }
    numberCounts.set(number, (numberCounts.get(number) ?? 0) + 1);
    recognized.push({ session, number });
  }
  for (const { session, number } of recognized) {
    if (numberCounts.get(number) === 1) session['sessionNumber'] = number;
  }
  doc['sessionMetadataVersion'] = 1;
}
