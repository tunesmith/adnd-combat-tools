const TRACKER_STATE_PARAM = 's';

interface TrackerLocationParts {
  hash: string;
  search: string;
}

const decodeParamKey = (value: string): string => {
  try {
    return decodeURIComponent(value.replace(/\+/g, '%20'));
  } catch {
    return value;
  }
};

const getTrackerEncodedStateFromParamString = (
  value: string
): string | undefined => {
  const normalized = value.replace(/^[?#]/, '');
  if (!normalized) {
    return undefined;
  }

  for (const parameter of normalized.split('&')) {
    if (!parameter) {
      continue;
    }

    const separatorIndex = parameter.indexOf('=');
    const key =
      separatorIndex >= 0 ? parameter.slice(0, separatorIndex) : parameter;

    if (decodeParamKey(key) !== TRACKER_STATE_PARAM) {
      continue;
    }

    const rawValue =
      separatorIndex >= 0 ? parameter.slice(separatorIndex + 1) : '';
    return rawValue || undefined;
  }

  return undefined;
};

export const buildTrackerShareHash = (encodedState: string): string =>
  `#${TRACKER_STATE_PARAM}=${encodedState}`;

export const buildTrackerSharePath = (
  pathname: string,
  encodedState: string
): string => `${pathname}${buildTrackerShareHash(encodedState)}`;

export const buildTrackerShareUrl = (
  origin: string,
  pathname: string,
  encodedState: string
): string =>
  new URL(buildTrackerSharePath(pathname, encodedState), origin).toString();

const getTrackerEncodedStateFromSearch = (search: string): string | undefined =>
  getTrackerEncodedStateFromParamString(search);

const getTrackerEncodedStateFromHash = (hash: string): string | undefined => {
  const normalizedHash = hash.replace(/^#/, '');
  const queryLikeHash = normalizedHash.startsWith('?')
    ? normalizedHash.slice(1)
    : normalizedHash;

  return getTrackerEncodedStateFromParamString(queryLikeHash);
};

export const getTrackerEncodedStateFromLocationParts = ({
  hash,
  search,
}: TrackerLocationParts): string | undefined =>
  getTrackerEncodedStateFromHash(hash) ||
  getTrackerEncodedStateFromSearch(search);

const getTrackerEncodedStateFromUrl = (
  value: string,
  base?: string
): string | undefined => {
  try {
    const url = base ? new URL(value, base) : new URL(value);
    return getTrackerEncodedStateFromLocationParts({
      hash: url.hash,
      search: url.search,
    });
  } catch {
    return undefined;
  }
};

export const getTrackerEncodedStateFromUrlText = (
  value: string
): string | undefined => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const absoluteUrlState = getTrackerEncodedStateFromUrl(trimmedValue);
  if (absoluteUrlState) {
    return absoluteUrlState;
  }

  const relativeUrlState = getTrackerEncodedStateFromUrl(
    trimmedValue,
    'https://tracker.local'
  );
  if (relativeUrlState) {
    return relativeUrlState;
  }

  const hashIndex = trimmedValue.indexOf('#');
  if (hashIndex >= 0) {
    const hashState = getTrackerEncodedStateFromHash(
      trimmedValue.slice(hashIndex)
    );
    if (hashState) {
      return hashState;
    }
  }

  const queryIndex = trimmedValue.indexOf('?');
  if (queryIndex >= 0) {
    const queryEndIndex =
      hashIndex > queryIndex ? hashIndex : trimmedValue.length;
    const searchState = getTrackerEncodedStateFromSearch(
      trimmedValue.slice(queryIndex, queryEndIndex)
    );
    if (searchState) {
      return searchState;
    }
  }

  return trimmedValue;
};
