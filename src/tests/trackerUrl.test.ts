import {
  buildTrackerSharePath,
  buildTrackerShareUrl,
  getTrackerEncodedStateFromLocationParts,
  getTrackerEncodedStateFromUrlText,
} from '../helpers/trackerUrl';

describe('tracker URL helpers', () => {
  test('builds hash-based tracker share URLs', () => {
    const encodedState = 'eJx%2Babc%2Fdef%3D';

    expect(buildTrackerSharePath('/tracker', encodedState)).toBe(
      '/tracker#s=eJx%2Babc%2Fdef%3D'
    );
    expect(
      buildTrackerShareUrl('https://example.com', '/tracker', encodedState)
    ).toBe('https://example.com/tracker#s=eJx%2Babc%2Fdef%3D');
  });

  test('prefers hash state over legacy query state', () => {
    expect(
      getTrackerEncodedStateFromLocationParts({
        hash: '#s=hash-state',
        search: '?s=query-state',
      })
    ).toBe('hash-state');
  });

  test('reads legacy query share URLs', () => {
    expect(
      getTrackerEncodedStateFromLocationParts({
        hash: '',
        search: '?s=eJx%2Babc%2Fdef%3D',
      })
    ).toBe('eJx%2Babc%2Fdef%3D');
  });

  test('extracts state from pasted full or relative URLs', () => {
    expect(
      getTrackerEncodedStateFromUrlText(
        'https://example.com/tracker?s=legacy-state'
      )
    ).toBe('legacy-state');
    expect(getTrackerEncodedStateFromUrlText('/tracker#s=hash-state')).toBe(
      'hash-state'
    );
  });

  test('accepts a pasted encoded state token', () => {
    expect(getTrackerEncodedStateFromUrlText(' eJx%2Babc%2Fdef%3D ')).toBe(
      'eJx%2Babc%2Fdef%3D'
    );
  });
});
