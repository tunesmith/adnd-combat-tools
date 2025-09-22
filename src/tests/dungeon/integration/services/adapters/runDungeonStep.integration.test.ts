import { runDungeonStep } from '../../../../../dungeon/services/adapters';

describe('adapters', () => {
  it('returns a message for passage', () => {
    const step = runDungeonStep('passage', { roll: 10 });
    expect(step.action).toBe('passage');
    expect(step.outcome).toBeDefined();
    expect(step.outcome?.type).toBe('event');
    expect(Array.isArray(step.messages)).toBe(true);
    expect(step.messages.length).toBeGreaterThan(0);
    expect(step.messages.some((m) => m.kind === 'paragraph')).toBe(true);
  });

  it('returns a message for door', () => {
    const step = runDungeonStep('door', { roll: 12, doorAhead: true });
    expect(step.action).toBe('door');
    expect(step.outcome).toBeDefined();
    expect(step.outcome?.type).toBe('event');
    expect(step.messages.length).toBeGreaterThan(0);
  });
});
