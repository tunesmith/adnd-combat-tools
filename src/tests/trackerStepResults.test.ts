import {
  compactTrackerState,
  transformTrackerState,
} from '../helpers/trackerCodec';
import { getTrackerActionDeclarations } from '../helpers/trackerActionDeclarations';
import { resolveTrackerRoundInitiative } from '../helpers/initiative/trackerRoundResolution';
import {
  buildTrackerSteps,
  compileTrackerGridMarks,
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

test('three darts across two targets leave only the third result target unassigned', () => {
  const round = fixtureRound();
  const thrower = round.party[0],
    secondTarget = round.cells[1]?.[0],
    thirdTarget = round.cells[2]?.[0];
  if (!thrower || !secondTarget || !thirdTarget)
    throw Error('Missing dart matchup');
  thrower.weapon = 19;
  secondTarget.partyToEnemyVisible = true;
  const volley = steps(round);
  const shots = Array.from(volley.values()).filter(
    (step) => step.side === 'party' && step.actorKey === thrower.key
  );
  expect(shots.map((shot) => shot.targetKeys)).toEqual([[4], [5], []]);
  const third = volley.get('attack:party-1:3');
  if (!third) throw Error('Missing third dart');
  expect(third.targetLabel).toBe('Unassigned');
  expect(shots.slice(0, 2).every((shot) => !shot.resultTargetOptions)).toBe(
    true
  );
  expect(third.resultTargetOptions?.map((option) => option.key)).toEqual([
    4, 5,
  ]);
  const recorded = setTrackerStepResult(round, third, { targetKey: 5 });
  expect(recorded.stepResults?.[0]).toMatchObject({
    stepKey: third.stepKey,
    targetKeys: [5],
  });
  thirdTarget.partyToEnemyVisible = true;
  expect(steps(round).get('attack:party-1:3')).toMatchObject({
    targetKeys: [6],
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
  expect(
    steps(round).get('spell-completion:party-1')?.resultTargetOptions
  ).toBeUndefined();
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

test('ambiguous routine components keep independent, clearable result targets through serialization and revisions', () => {
  const round = fixtureRound();
  const firstCell = round.cells[0]?.[0],
    secondCell = round.cells[1]?.[0],
    actor = round.party[0];
  if (!firstCell || !secondCell || !actor) throw Error('Missing matchup');
  actor.attacksPerRoutine = 2;
  firstCell.enemyToPartyVisible = false;
  firstCell.enemyToParty = '';
  secondCell.partyToEnemyVisible = true;
  const first = steps(round).get('attack:party-1:1'),
    second = steps(round).get('attack:party-1:2');
  if (!first || !second) throw Error('Missing attacks');
  expect(first.resultTargetOptions?.map((option) => option.key)).toEqual([
    4, 5,
  ]);
  let edited = setTrackerStepResult(round, first, 'First hit');
  expect(edited.stepResults?.[0]?.targetKeys).toEqual([]);
  expect(setTrackerStepResult(edited, first, { targetKey: 6 })).toBe(edited);
  edited = setTrackerStepResult(edited, first, { targetKey: 4 });
  edited = setTrackerStepResult(edited, second, { targetKey: 5 });
  expect(edited.stepResults?.[1]).toMatchObject({ text: '', targetKeys: [5] });
  edited = setTrackerStepResult(edited, second, 'Second hit');
  edited = setTrackerStepResult(edited, first, 'Revised first hit');
  expect(edited.stepResults?.map((r) => [r.text, r.targetKeys])).toEqual([
    ['Revised first hit', [4]],
    ['Second hit', [5]],
  ]);
  expect(edited.stepResults?.[0]).not.toHaveProperty('resultTargetOptions');
  const reopened = transformTrackerState(
    compactTrackerState({ version: 7, activeRound: 0, rounds: [edited] })
  ).rounds[0];
  if (!reopened) throw Error('Missing reopened round');
  expect(reopened.stepResults).toEqual(edited.stepResults);
  const cleared = setTrackerStepResult(reopened, first, { targetKey: null });
  expect(cleared.stepResults?.[0]).toMatchObject({
    text: 'Revised first hit',
    targetKeys: [],
    targetLabel: 'Multiple targets',
  });
  const blank = setTrackerStepResult(cleared, second, '');
  expect(blank.stepResults?.[1]).toMatchObject({ text: '', targetKeys: [5] });
  expect(
    setTrackerStepResult(blank, second, { targetKey: null }).stepResults
  ).toHaveLength(1);
  const revised = retainPriorStepResults({
    ...edited,
    cells: edited.cells.map((row, i) =>
      i === 1
        ? row.map((cell) => ({ ...cell, partyToEnemyVisible: false }))
        : row
    ),
  });
  expect(revised.stepResults?.[0]).toMatchObject({
    stepKey: null,
    targetKeys: [4],
    targetLabel: 'Pillar Gnoll',
  });
  expect(
    steps(revised).get('attack:party-1:1')?.resultTargetOptions
  ).toBeUndefined();
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

function cellMarks(round: TrackerRound) {
  const resolved = resolveTrackerRoundInitiative(round);
  return compileTrackerGridMarks(
    resolved.attackGraph.layers,
    buildTrackerSteps(round, resolved),
    new Map(round.stepResults?.map((r) => [r.stepKey, r]))
  );
}

test('four melee marks compile in graph order independently of note and edit order', () => {
  let round = fixtureRound();
  const actions = getTrackerActionDeclarations(round);
  round.actions = actions.map((a) =>
    a.side === 'party' ? { ...a, attackRoutineCount: 4 } : a
  );
  const resolved = resolveTrackerRoundInitiative(round);
  const byId = buildTrackerSteps(round, resolved);
  const attacks = resolved.attackGraph.layers.flat().flatMap((id) => {
    const step = byId.get(id);
    return step?.side === 'party' ? [step] : [];
  });
  expect(attacks).toHaveLength(4);
  const marks = ['x', 'x', '5', '6'];
  for (let i = 3; i >= 0; i--) {
    const step = attacks[i],
      gridMark = marks[i];
    if (!step || !gridMark) throw Error('Missing blow');
    round = setTrackerStepResult(round, step, { gridMark });
  }
  const last = attacks[3];
  if (!last) throw Error('Missing last blow');
  round = setTrackerStepResult(round, last, 'Kills the gnoll.');
  expect(cellMarks(round).get('party:1:4')).toBe('x · x · 5 · 6');
  expect(cellMarks(round).has('enemy:4:1')).toBe(false);
  round = setTrackerStepResult(round, last, { gridMark: '' });
  expect(round.stepResults?.[0]?.text).toBe('Kills the gnoll.');
  expect(cellMarks(round).get('party:1:4')).toBe('x · x · 5');
});

test('marks follow each assigned target and archived marks stay available in review only', () => {
  let round = fixtureRound();
  const second = round.cells[1]?.[0],
    first = round.cells[0]?.[0];
  if (!first || !second) throw Error('Missing cells');
  first.enemyToParty = '';
  first.enemyToPartyVisible = false;
  second.partyToEnemyVisible = true;
  const step = steps(round).get('attack:party-1:1');
  if (!step) throw Error('Missing ambiguous step');
  round = setTrackerStepResult(round, step, { gridMark: '7' });
  expect(cellMarks(round).size).toBe(0);
  round = setTrackerStepResult(round, step, { targetKey: 4 });
  expect(Array.from(cellMarks(round))).toEqual([['party:1:4', '7']]);
  round = setTrackerStepResult(round, step, { targetKey: 5 });
  expect(Array.from(cellMarks(round))).toEqual([['party:1:5', '7']]);
  round = retainPriorStepResults({
    ...round,
    cells: round.cells.map((row, i) =>
      i === 1 ? row.map((c) => ({ ...c, partyToEnemyVisible: false })) : row
    ),
  });
  expect(round.stepResults?.[0]).toMatchObject({
    stepKey: null,
    gridMark: '7',
    targetKeys: [5],
  });
  expect(cellMarks(round).size).toBe(0);
});

test('shared tracker data preserves marks, freeform details and an intentionally empty handwritten direction', () => {
  let round = fixtureRound();
  const step = steps(round).get('attack:party-1:1');
  const cell = round.cells[0]?.[0];
  if (!cell || !step) throw Error('Missing matchup');
  cell.partyToEnemy = '';
  cell.partyToEnemyManualBlank = true;
  round = setTrackerStepResult(round, step, { gridMark: 'x' });
  round = setTrackerStepResult(round, step, 'Swing goes wide.');
  const compact = compactTrackerState({
    version: 7,
    activeRound: 0,
    rounds: [round],
  });
  const reopened = transformTrackerState(compact).rounds[0];
  expect(reopened?.stepResults).toEqual(round.stepResults);
  expect(reopened?.cells[0]?.[0]).toEqual(cell);
  const next = insertRoundAfterActive({
    version: 7,
    activeRound: 0,
    rounds: [round],
  }).rounds[1];
  expect(next?.cells[0]?.[0]).not.toHaveProperty('partyToEnemyManualBlank');
  expect(next?.stepResults).toBeUndefined();
});
