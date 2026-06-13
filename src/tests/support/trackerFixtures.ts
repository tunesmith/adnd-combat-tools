import { encodeTrackerStateSync } from '../../helpers/trackerCodec';
import { createInitialTrackerState } from '../../helpers/trackerState';
import { buildTrackerShareHash } from '../../helpers/trackerUrl';
import type { TrackerState } from '../../types/tracker';

const requireFirstRound = (
  state: TrackerState
): TrackerState['rounds'][number] => {
  const round = state.rounds[0];

  if (!round) {
    throw new Error('Missing tracker fixture round');
  }

  return round;
};

export const createRegisterIntentionsFixtureState = (): TrackerState => {
  const state = createInitialTrackerState();
  const round = requireFirstRound(state);

  round.partyInitiative = '6';
  round.enemyInitiative = '3';

  const lodi = round.party[0];
  const azalia = round.party[1];
  const gnoll = round.enemies[0];

  if (!lodi || !azalia || !gnoll) {
    throw new Error('Missing tracker fixture combatants');
  }

  lodi.name = 'Lodi';
  lodi.weapon = 17;
  lodi.weaponShortlist = [9, 17, 18];
  lodi.movementRate = 12;

  azalia.name = 'Azalia';
  azalia.weapon = 22;
  azalia.movementRate = 12;

  gnoll.name = 'Pillar Gnoll';
  gnoll.weapon = 1;
  gnoll.movementRate = 9;

  const lodiState = round.partyStates[0];
  const gnollState = round.enemyStates[0];
  const firstCell = round.cells[0]?.[0];

  if (!lodiState || !gnollState || !firstCell || !round.cells[0]) {
    throw new Error('Missing tracker fixture round state');
  }

  lodiState.action = 'Backstab';
  gnollState.action = 'Attack Lodi';
  round.cells[0][0] = {
    ...firstCell,
    partyToEnemyVisible: true,
    partyToEnemy: 'x',
    enemyToPartyVisible: true,
    enemyToParty: 'x',
  };

  return state;
};

export const createRegisterIntentionsFixtureHash = (): string =>
  buildTrackerShareHash(
    encodeTrackerStateSync(createRegisterIntentionsFixtureState())
  );
