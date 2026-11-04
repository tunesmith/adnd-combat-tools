import { createInitialTrackerState } from '../../helpers/trackerState';
import {
  createEmptyEncumbranceDocument,
  createEmptyEncumbranceDmCharacter,
} from '../../helpers/encumbranceDocument';
import type { TrackerState } from '../../types/tracker';
export function syntheticCombat(): TrackerState {
  const state = createInitialTrackerState();
  state.title = 'Synthetic lantern skirmish';
  const first = state.rounds[0];
  if (!first) throw new Error('Missing default round');
  first.label = 'Arrival';
  first.summary = 'An invented encounter at Lantern Gate.';
  first.party.forEach((c, i) => {
    c.name = ['Mira', 'Tal', 'Oren'][i] || `Adventurer ${i}`;
  });
  const second: typeof first = JSON.parse(JSON.stringify(first));
  second.label = 'Moonrise';
  second.summary = 'The invented second round.';
  const member = second.partyStates[0];
  if (member) {
    member.hp = '';
    member.notes = 'Unknown HP, not zero';
    member.effect = 'Synthetic dazzle';
    member.action = 'Raise lantern';
    member.result = 'Gate illuminated';
  }
  state.rounds.push(second);
  state.activeRound = 1;
  return state;
}
export function syntheticInventory() {
  const doc = createEmptyEncumbranceDocument();
  if (doc.kind !== 'adnd-encumbrance-dm') throw new Error('Expected DM');
  const mira = createEmptyEncumbranceDmCharacter('Mira');
  mira.id = 'synthetic-mira';
  mira.dmNotes = 'Invented test party only.';
  const common = {
    day: 1,
    playerNotes: 'Synthetic item',
    playerMagicKnowledge: 'known-magical' as const,
    playerKnowsValue: true,
    dmNotes: 'DM-only synthetic note',
    isMagical: true,
    fullyIdentified: true,
  };
  mira.inventory = [
    {
      ...common,
      id: 'pack',
      catalogId: 'synthetic-pack',
      name: 'Lantern pack',
      quantity: 1,
      containerId: null,
      customItem: {
        id: 'synthetic-pack',
        name: 'Lantern pack',
        category: 'containers',
        encumbranceGp: 10,
        valueGp: 2,
        isContainer: true,
        capacityGp: 500,
      },
    },
    {
      ...common,
      id: 'case',
      catalogId: 'synthetic-case',
      name: 'Inner case',
      quantity: 1,
      containerId: 'pack',
      customItem: {
        id: 'synthetic-case',
        name: 'Inner case',
        category: 'containers',
        encumbranceGp: 5,
        valueGp: 3,
        isContainer: true,
        capacityGp: 100,
      },
    },
    {
      ...common,
      id: 'gem',
      catalogId: 'synthetic-gem',
      name: 'Blue lantern stones',
      quantity: 2,
      containerId: 'case',
      valueGpOverride: 17,
      customItem: {
        id: 'synthetic-gem',
        name: 'Blue stone',
        category: 'treasure',
        encumbranceGp: 1,
        valueGp: 12,
      },
    },
  ];
  const tal = createEmptyEncumbranceDmCharacter('Tal');
  tal.id = 'synthetic-tal';
  tal.dmNotes = 'Another invented character';
  return { ...doc, activeCharacterId: mira.id, characters: [mira, tal] };
}
