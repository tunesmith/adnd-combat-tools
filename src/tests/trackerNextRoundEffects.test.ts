import type { TrackerCombatantRoundState } from '../types/tracker';
import {
  createInitialTrackerState,
  editCombatantRoundField,
  getNextRoundEffect,
  insertRoundAfterActive,
} from '../helpers/trackerState';
import {
  decodeTrackerState,
  encodeTrackerStateSync,
} from '../helpers/trackerCodec';

const warm = 'Very warm (Heat Metal 1/7)';
const hot = 'Hot (Heat Metal 2/7)';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw Error('Missing combat fixture');
  return value;
}

test('each creature mirrors corrections until edited, then advances with a fresh mirror', async () => {
  let combat = createInitialTrackerState();
  const opening = required(combat.rounds[0]);
  const effectLines = 'Bless\n' + warm;
  for (const i of [0, 1]) {
    opening.enemyStates[i] = editCombatantRoundField(
      required(opening.enemyStates[i]),
      'nextRoundEffectOverride',
      warm
    );
  }
  opening.partyStates[0] = editCombatantRoundField(
    required(opening.partyStates[0]),
    'effect',
    effectLines
  );

  combat = insertRoundAfterActive(combat);
  const round = required(combat.rounds[1]);
  const first = required(round.enemyStates[0]),
    second = required(round.enemyStates[1]);
  expect([
    first.effect,
    getNextRoundEffect(first),
    second.effect,
    getNextRoundEffect(second),
  ]).toEqual([warm, warm, warm, warm]);
  expect(first.nextRoundEffectOverride).toBeUndefined();
  round.enemyStates[0] = editCombatantRoundField(
    first,
    'nextRoundEffectOverride',
    hot
  );
  const corrected = editCombatantRoundField(second, 'effect', 'Corrected');
  expect(getNextRoundEffect(corrected)).toBe('Corrected');
  round.enemyStates[1] = editCombatantRoundField(corrected, 'effect', warm);

  const actor = required(round.partyStates[0]);
  const edited = editCombatantRoundField(
    actor,
    'nextRoundEffectOverride',
    effectLines.replace(warm, hot)
  );
  round.partyStates[0] = editCombatantRoundField(
    edited,
    'effect',
    'Changed opening text'
  );

  const reopened = await decodeTrackerState(encodeTrackerStateSync(combat));
  expect(reopened.rounds[1]).toEqual(round);
  const advanced = insertRoundAfterActive(reopened);
  const third = required(advanced.rounds[2]);
  expect(
    third.enemyStates
      .slice(0, 2)
      .map((s) => [s.effect, getNextRoundEffect(s), s.nextRoundEffectOverride])
  ).toEqual([
    [hot, hot, undefined],
    [warm, warm, undefined],
  ]);
  expect(third.partyStates[0]?.effect).toBe('Bless\n' + hot);
  expect(
    advanced.rounds[1]?.enemyStates.slice(0, 2).map((s) => s.effect)
  ).toEqual([warm, warm]);
  expect(opening.enemyStates[0]?.effect).toBe('');
});

test.each([warm, '', '  ', ' Bless  \n\n Slowed '])(
  'an explicit preview %j survives reopening and wins over subsequent edits',
  async (preview) => {
    const combat = createInitialTrackerState(),
      round = required(combat.rounds[0]);
    const actor = editCombatantRoundField(
      required(round.partyStates[0]),
      'effect',
      warm
    );
    const override = editCombatantRoundField(
      actor,
      'nextRoundEffectOverride',
      preview
    );
    round.partyStates[0] = editCombatantRoundField(
      override,
      'effect',
      'Later correction'
    );
    const reopened = await decodeTrackerState(encodeTrackerStateSync(combat));
    expect(
      getNextRoundEffect(required(reopened.rounds[0]?.partyStates[0]))
    ).toBe(preview);
    const next = required(
      insertRoundAfterActive(reopened).rounds[1]?.partyStates[0]
    );
    expect(next.effect).toBe(preview);
    expect(next.nextRoundEffectOverride).toBeUndefined();
  }
);

test.each([
  [' Bless ', ' Slowed ', ' Bless \n Slowed '],
  ['', '  Slowed', '  Slowed'],
  ['Bless', '', 'Bless'],
  ['Bless', ' \n ', 'Bless'],
])(
  'legacy opening %j and queued addition %j produce the original carry',
  (effect, queue, expected) => {
    const combat = createInitialTrackerState(),
      round = required(combat.rounds[0]);
    const actor: TrackerCombatantRoundState = {
      ...required(round.partyStates[0]),
      effect,
      nextRoundEffect: queue,
    };
    round.partyStates[0] = actor;
    expect(getNextRoundEffect(actor)).toBe(expected);
    expect(
      insertRoundAfterActive(combat).rounds[1]?.partyStates[0]?.effect
    ).toBe(expected);
    const corrected = editCombatantRoundField(
      actor,
      'effect',
      'Edited opening'
    );
    expect(getNextRoundEffect(corrected)).toBe(
      queue.trim() ? expected : 'Edited opening'
    );
    expect(
      getNextRoundEffect(
        editCombatantRoundField(actor, 'nextRoundEffectOverride', '')
      )
    ).toBe('');
    expect(actor.nextRoundEffect).toBe(queue);
  }
);
