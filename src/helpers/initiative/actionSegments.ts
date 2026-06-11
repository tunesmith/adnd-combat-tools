interface InitiativeSegmentOption {
  value: string;
  label: string;
}

export const ACTIVATION_SEGMENT_OPTIONS: InitiativeSegmentOption[] = [
  { value: '', label: 'None' },
  { value: '1', label: '1 segment' },
  { value: '2', label: '2 segments' },
  { value: '3', label: '3 segments' },
  { value: '4', label: '4 segments' },
  { value: '5', label: '5 segments' },
  { value: '6', label: '6 segments' },
  { value: '7', label: '7 segments' },
  { value: '8', label: '8 segments' },
  { value: '9', label: '9 segments' },
  { value: '10', label: '10+ segments' },
];

export const SPELL_CASTING_TIME_OPTIONS: InitiativeSegmentOption[] = [
  { value: '0', label: 'Instant' },
  { value: '1', label: '1 segment' },
  { value: '2', label: '2 segments' },
  { value: '3', label: '3 segments' },
  { value: '4', label: '4 segments' },
  { value: '5', label: '5 segments' },
  { value: '6', label: '6 segments' },
  { value: '7', label: '7 segments' },
  { value: '8', label: '8 segments' },
  { value: '9', label: '9 segments' },
  { value: '10', label: '10+ segments' },
];

const parseOptionalSegmentNumber = (value: string): number | undefined => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseActivationSegments = (value: string): number | undefined => {
  const parsed = parseOptionalSegmentNumber(value);

  if (parsed === undefined) {
    return undefined;
  }

  return Math.max(1, Math.min(10, Math.floor(parsed)));
};

export const parseCastingSegments = (value: string): number | undefined => {
  const parsed = parseOptionalSegmentNumber(value);

  if (parsed === undefined) {
    return undefined;
  }

  return Math.max(0, Math.min(10, Math.floor(parsed)));
};

export const formatCastingSegments = (castingSegments: number): string => {
  if (castingSegments === 0) {
    return 'Instant';
  }

  if (castingSegments >= 10) {
    return '10+ segments';
  }

  return `${castingSegments} ${castingSegments === 1 ? 'segment' : 'segments'}`;
};
