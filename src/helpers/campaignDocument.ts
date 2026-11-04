/** Deliberately small checkpoint-A envelope. Unknown fields are rejected, never lost. */
export interface CampaignDocument {
  kind: 'adnd-campaign';
  schemaVersion: 1;
  id: string;
  title: string;
  notes: string;
}

export function validateCampaign(value: unknown): CampaignDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a campaign document object.');
  }
  const record = value as Record<string, unknown>;
  if (record['kind'] !== 'adnd-campaign')
    throw new Error('Not an AD&D campaign document.');
  if (record['schemaVersion'] !== 1) {
    throw new Error(
      'Unsupported campaign schema version. This app supports version 1.'
    );
  }
  const keys = ['kind', 'schemaVersion', 'id', 'title', 'notes'];
  if (Object.keys(record).some((key) => !keys.includes(key))) {
    throw new Error(
      'Unrecognized document fields. Open with a compatible app to avoid losing content.'
    );
  }
  if (
    typeof record['id'] !== 'string' ||
    !record['id'].trim() ||
    typeof record['title'] !== 'string' ||
    typeof record['notes'] !== 'string'
  ) {
    throw new Error(
      'Campaign ID, title, and notes must be strings; ID must not be empty.'
    );
  }
  if (record['title'].length > 1000 || record['notes'].length > 1_000_000) {
    throw new Error('Campaign title or notes exceeds the supported size.');
  }
  return {
    kind: 'adnd-campaign',
    schemaVersion: 1,
    id: record['id'],
    title: record['title'],
    notes: record['notes'],
  };
}

export function parseCampaign(text: string): CampaignDocument {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON. The active campaign has not been replaced.');
  }
  return validateCampaign(value);
}

export function serializeCampaign(document: CampaignDocument): string {
  return JSON.stringify(validateCampaign(document), null, 2) + '\n';
}
