import type {
  EncumbranceDocument,
  EncumbranceDocumentKind,
  EncumbranceInventoryItem,
  ExceptionalStrengthTier,
  StrengthScore,
} from '../types/encumbrance';

const DOCUMENT_VERSION = 1;

const exceptionalStrengthTiers = new Set<ExceptionalStrengthTier>([
  'none',
  '01-50',
  '51-75',
  '76-90',
  '91-99',
  '00',
]);

const isStrengthScore = (value: unknown): value is StrengthScore => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StrengthScore>;
  return (
    typeof candidate.score === 'number' &&
    candidate.score >= 3 &&
    candidate.score <= 18 &&
    typeof candidate.exceptional === 'string' &&
    exceptionalStrengthTiers.has(candidate.exceptional)
  );
};

const isInventoryItem = (
  value: unknown
): value is EncumbranceInventoryItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncumbranceInventoryItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.catalogId === 'string' &&
    typeof candidate.quantity === 'number' &&
    Number.isFinite(candidate.quantity) &&
    candidate.quantity >= 1 &&
    Number.isInteger(candidate.quantity) &&
    (candidate.containerId === null || typeof candidate.containerId === 'string')
  );
};

const isDocumentKind = (
  value: unknown
): value is EncumbranceDocumentKind =>
  value === 'adnd-encumbrance-dm' || value === 'adnd-encumbrance-player';

const sanitizeDocument = (candidate: EncumbranceDocument): EncumbranceDocument => ({
  kind: candidate.kind,
  version: DOCUMENT_VERSION,
  character: {
    name: candidate.character.name,
    strength: candidate.character.strength,
  },
  inventory: candidate.inventory.map((item) => ({
    id: item.id,
    catalogId: item.catalogId,
    quantity: item.quantity,
    containerId: item.containerId,
  })),
  ...(candidate.kind === 'adnd-encumbrance-dm'
    ? {
        dm: {
          privateNotes: candidate.dm?.privateNotes || '',
        },
      }
    : {}),
});

export const createEmptyEncumbranceDocument = (
  kind: EncumbranceDocumentKind = 'adnd-encumbrance-dm'
): EncumbranceDocument => ({
  kind,
  version: DOCUMENT_VERSION,
  character: {
    name: '',
    strength: {
      score: 8,
      exceptional: 'none',
    },
  },
  inventory: [],
  ...(kind === 'adnd-encumbrance-dm'
    ? {
        dm: {
          privateNotes: '',
        },
      }
    : {}),
});

export const redactEncumbranceDocument = (
  document: EncumbranceDocument
): EncumbranceDocument => ({
  kind: 'adnd-encumbrance-player',
  version: DOCUMENT_VERSION,
  character: {
    name: document.character.name,
    strength: document.character.strength,
  },
  inventory: document.inventory.map((item) => ({
    id: item.id,
    catalogId: item.catalogId,
    quantity: item.quantity,
    containerId: item.containerId,
  })),
});

export const parseEncumbranceDocument = (text: string): EncumbranceDocument => {
  const rawValue = JSON.parse(text) as Partial<EncumbranceDocument>;

  if (
    !isDocumentKind(rawValue.kind) ||
    rawValue.version !== DOCUMENT_VERSION ||
    !rawValue.character ||
    typeof rawValue.character.name !== 'string' ||
    !isStrengthScore(rawValue.character.strength) ||
    !Array.isArray(rawValue.inventory) ||
    !rawValue.inventory.every((item) => isInventoryItem(item))
  ) {
    throw new Error('File is not a supported encumbrance document.');
  }

  if (
    rawValue.kind === 'adnd-encumbrance-dm' &&
    rawValue.dm &&
    (typeof rawValue.dm !== 'object' ||
      typeof rawValue.dm.privateNotes !== 'string')
  ) {
    throw new Error('DM notes are not valid.');
  }

  return sanitizeDocument(rawValue as EncumbranceDocument);
};
