import {
  compactTrackerState,
  transformTrackerState,
} from '../helpers/trackerCodec';
import { getTrackerActionDeclarations } from '../helpers/trackerActionDeclarations';
import { resolveTrackerRoundInitiative } from '../helpers/initiative/trackerRoundResolution';
import {
  buildTrackerSteps,
  retainPriorStepResults,
  setTrackerStepResult,
} from '../helpers/trackerStepResults';
import {
  insertRoundAfterActive,
  startNewCombatFromActiveRound,
} from '../helpers/trackerState';
import { createRegisterIntentionsFixtureState } from './support/trackerFixtures';
import type { TrackerRound } from '../types/tracker';

function fixtureRound() {
  const state = createRegisterIntentionsFixtureState();
  const round = state.rounds[0];
  if (!round) throw Error('Missing fixture round');
  return round;
}

const steps = (round: TrackerRound) =>
  buildTrackerSteps(round, resolveTrackerRoundInitiative(round));

test('a reordered declaration keeps both spell occurrences and a replaced step remains historical', () => {
  const round = fixtureRound();
  const main = getTrackerActionDeclarations(round)[0];
  if (!main) throw Error('Missing party action');
  const spell = {
    ...main,
    id: 'spell',
    declaredAction: 'spell-casting' as const,
    actionLabel: 'Silence',
    castingSegments: 2,
  };
  round.actions = [main, spell];
  const original = steps(round);
  const start = original.get('spell-start:party-action-1001');
  const completion = original.get('spell-completion:party-action-1001');
  if (!start || !completion) throw Error('Missing spell steps');
  expect(start.stepKey).not.toBe(completion.stepKey);
  const text = '  Interrupted\nbefore completion.';
  const recorded = setTrackerStepResult(round, completion, text);
  const reordered = retainPriorStepResults({
    ...recorded,
    actions: [spell, main],
    partyInitiative: '4',
  });
  expect(steps(reordered).get('spell-completion:party-1')?.stepKey).toBe(
    completion.stepKey
  );
  expect(reordered.stepResults).toEqual([{ ...completion, text }]);
  const revised = retainPriorStepResults({
    ...reordered,
    actions: [{ ...spell, actionLabel: 'Light' }, main],
  });
  expect(revised.stepResults).toEqual([{ ...completion, stepKey: null, text }]);
  const restored = retainPriorStepResults({
    ...revised,
    actions: [spell, main],
  });
  expect(
    setTrackerStepResult(restored, completion, 'Cast again').stepResults
  ).toEqual([
    { ...completion, stepKey: null, text },
    { ...completion, text: 'Cast again' },
  ]);
});

test('each missile occurrence keeps its own target when a volley is split', () => {
  const round = fixtureRound();
  const archer = round.party[0];
  const secondTarget = round.cells[1]?.[0];
  if (!archer || !secondTarget) throw Error('Missing archer or target');
  archer.weapon = 11;
  const first = steps(round).get('attack:party-1:1');
  const second = steps(round).get('attack:party-1:2');
  if (!first || !second) throw Error('Missing shots');
  expect(first.stepKey).not.toBe(second.stepKey);
  expect(first.targetKeys).toEqual([4]);
  expect(second.targetKeys).toEqual([4]);
  const recorded = setTrackerStepResult(round, second, 'Miss');
  secondTarget.partyToEnemyVisible = true;
  const split = retainPriorStepResults(recorded);
  expect(steps(split).get('attack:party-1:2')?.targetKeys).toEqual([5]);
  expect(split.stepResults?.[0]).toMatchObject({
    stepKey: null,
    targetKeys: [4],
  });
});

test('one completion can identify an explicit set, while a routine with the same candidates has no confirmed recipients', () => {
  const round = fixtureRound();
  const second = round.cells[1]?.[0];
  if (!second) throw Error('Missing second target');
  second.partyToEnemyVisible = true;
  const main = getTrackerActionDeclarations(round)[0];
  if (!main) throw Error('Missing party action');
  // Remove mutual melee to keep both opponents candidates for this blow.
  const first = round.cells[0]?.[0];
  if (!first) throw Error('Missing cell');
  first.enemyToParty = '';
  first.enemyToPartyVisible = false;
  round.actions = [main];
  expect(steps(round).get('attack:party-1:1')).toMatchObject({
    targetKeys: [],
    targetLabel: 'Multiple targets',
  });
  round.actions = [
    { ...main, declaredAction: 'spell-casting', castingSegments: 2 },
  ];
  expect(steps(round).get('spell-completion:party-1')?.targetKeys).toEqual([
    4, 5,
  ]);
  round.actions = [
    {
      ...main,
      declaredAction: 'spell-casting',
      castingSegments: 2,
      targetDeclarations: [],
    },
    { ...main, id: 'another', targetDeclarations: [] },
  ];
  expect(steps(round).get('spell-completion:party-1')?.targetKeys).toEqual([]);
});

test('compact tracker storage and round creation preserve the source queue without replaying it', () => {
  const round = fixtureRound();
  const target = round.enemyStates[0];
  const caster = round.partyStates[0];
  if (!target || !caster) throw Error('Missing combatants');
  target.effect = 'Slowed';
  target.nextRoundEffect = 'Silence 1/7';
  caster.nextRoundEffect = 'Bless';
  const step = steps(round).get('attack:party-1:1');
  if (!step) throw Error('Missing attack');
  const state = transformTrackerState(
    compactTrackerState({
      version: 7,
      activeRound: 0,
      rounds: [setTrackerStepResult(round, step, '  Hit\nfor six.')],
    })
  );
  expect(state.rounds[0]?.stepResults).toEqual([
    { ...step, text: '  Hit\nfor six.' },
  ]);
  const advanced = insertRoundAfterActive(state);
  expect(advanced.rounds[0]?.enemyStates[0]).toEqual(target);
  expect(advanced.rounds[1]?.enemyStates[0]?.effect).toBe(
    'Slowed\nSilence 1/7'
  );
  expect(advanced.rounds[1]?.enemyStates[0]?.nextRoundEffect || '').toBe('');
  expect(advanced.rounds[1]?.partyStates[0]?.effect).toBe('Bless');
  expect(advanced.rounds[1]?.stepResults || []).toEqual([]);
  expect(
    insertRoundAfterActive(advanced).rounds[2]?.enemyStates[0]?.effect
  ).toBe('Slowed\nSilence 1/7');
  const fresh = startNewCombatFromActiveRound(state, 'carry-current').rounds[0];
  expect(fresh?.partyStates[0]?.effect).toBe('');
  expect(fresh?.partyStates[0]?.nextRoundEffect || '').toBe('');
  expect(fresh?.stepResults || []).toEqual([]);
});
