import { deflate, deflateSync, unzip } from 'zlib';
import { formatCastingSegments } from './initiative/actionSegments';
import { ensureWeaponShortlist, getDefaultRoundLabel } from './trackerState';
import type {
  TrackerActionDeclaration,
  TrackerActionDirection,
  TrackerActionSide,
  TrackerCellState,
  TrackerCellStateV5,
  TrackerCombatant,
  TrackerCombatantRoundState,
  TrackerCombatantRoundStateV1,
  TrackerCombatantRoundStateV2,
  TrackerPersistedActionDeclaration,
  TrackerRound,
  TrackerRoundV6,
  TrackerRoundV5,
  TrackerRoundV1,
  TrackerRoundV2,
  TrackerRoundV8,
  TrackerSparseCellState,
  TrackerState,
  TrackerStateAnyVersion,
  TrackerStateV4,
  TrackerStateV1,
  TrackerStateV8,
} from '../types/tracker';

const createEmptyCell = (): TrackerCellState => ({
  enemyToParty: '',
  partyToEnemy: '',
  enemyToPartyVisible: false,
  partyToEnemyVisible: false,
});

const getActionDirection = (side: TrackerActionSide): TrackerActionDirection =>
  side === 'party' ? 'partyToEnemy' : 'enemyToParty';

const getActionTargetSide = (side: TrackerActionSide): TrackerActionSide =>
  side === 'party' ? 'enemy' : 'party';

const getRoundCombatants = (
  round: Pick<TrackerRound, 'enemies' | 'party'>,
  side: TrackerActionSide
): TrackerCombatant[] => (side === 'party' ? round.party : round.enemies);

const getRoundStates = (
  round: Pick<TrackerRound, 'enemyStates' | 'partyStates'>,
  side: TrackerActionSide
): TrackerCombatantRoundState[] =>
  side === 'party' ? round.partyStates : round.enemyStates;

const getActionCombatantIndex = (
  round: Pick<TrackerRound, 'enemies' | 'party'>,
  side: TrackerActionSide,
  combatantKey: number
): number =>
  getRoundCombatants(round, side).findIndex(
    (combatant) => combatant.key === combatantKey
  );

const getActionCombatant = (
  round: Pick<TrackerRound, 'enemies' | 'party'>,
  side: TrackerActionSide,
  combatantKey: number
): TrackerCombatant | undefined =>
  getRoundCombatants(round, side).find(
    (combatant) => combatant.key === combatantKey
  );

const getActionRoundState = (
  round: Pick<TrackerRound, 'enemyStates' | 'partyStates'>,
  side: TrackerActionSide,
  combatantIndex: number
): TrackerCombatantRoundState | undefined =>
  getRoundStates(round, side)[combatantIndex];

const formatDistanceInches = (distanceInches: number): string =>
  Number.isInteger(distanceInches)
    ? distanceInches.toString()
    : distanceInches.toFixed(1).replace(/\.0$/, '');

const formatDeclaredAction = (
  declaredAction: TrackerActionDeclaration['declaredAction']
): string => {
  switch (declaredAction) {
    case 'none':
      return 'No combat action';
    case 'open-melee':
      return 'Open melee';
    case 'close':
      return 'Move/Close';
    case 'charge':
      return 'Charge';
    case 'set-vs-charge':
      return 'Set vs charge';
    case 'missile':
      return 'Missile';
    case 'turn-undead':
      return 'Turn undead';
    case 'magical-device':
      return 'Magical device';
    case 'spell-casting':
      return 'Cast spell';
  }
};

const formatActivationSegments = (
  activationSegments: number | undefined
): string => {
  if (activationSegments === undefined) {
    return 'no activation time';
  }

  if (activationSegments >= 10) {
    return '10+ segments';
  }

  return `${activationSegments} ${
    activationSegments === 1 ? 'segment' : 'segments'
  }`;
};

const getDefaultActionIntention = (
  action: Pick<
    TrackerActionDeclaration,
    | 'actionDistanceInches'
    | 'actionLabel'
    | 'activationSegments'
    | 'castingSegments'
    | 'declaredAction'
  >
): string => {
  const label = action.actionLabel?.trim() || '';

  if (
    (action.declaredAction === 'close' || action.declaredAction === 'charge') &&
    action.actionDistanceInches !== undefined
  ) {
    const distanceText = `${formatDistanceInches(
      action.actionDistanceInches
    )}"`;
    const actionLabel = formatDeclaredAction(action.declaredAction);
    return label
      ? `${label} (${distanceText})`
      : `${actionLabel} ${distanceText}`;
  }

  if (
    action.declaredAction === 'spell-casting' &&
    action.castingSegments !== undefined
  ) {
    const timingText = formatCastingSegments(action.castingSegments);
    return label ? `${label} (${timingText})` : `Cast spell (${timingText})`;
  }

  if (action.declaredAction === 'magical-device') {
    const timingText = formatActivationSegments(action.activationSegments);
    return label
      ? `${label} (${timingText})`
      : `Magical device (${timingText})`;
  }

  return label || formatDeclaredAction(action.declaredAction);
};

const cloneCombatants = (combatants: TrackerCombatant[]): TrackerCombatant[] =>
  combatants.map((combatant) =>
    ensureWeaponShortlist({
      ...combatant,
    })
  );

const normalizeTrackerRound = (round: TrackerRound): TrackerRound => ({
  ...round,
  party: cloneCombatants(round.party),
  enemies: cloneCombatants(round.enemies),
});

const normalizeTrackerState = (state: TrackerState): TrackerState => ({
  ...state,
  rounds: state.rounds.map((round) => normalizeTrackerRound(round)),
});

const migrateRoundState = (
  oldState: TrackerCombatantRoundStateV1,
  combatantMaxHp?: string
): TrackerCombatantRoundState => ({
  hp: oldState.hp || combatantMaxHp || '',
  effect: oldState.effect,
  action: oldState.action,
  result: oldState.result,
  notes: oldState.notes,
});

const migrateRoundStateV2 = (
  oldState: TrackerCombatantRoundStateV2,
  combatantMaxHp?: string
): TrackerCombatantRoundState => ({
  hp: oldState.hp || combatantMaxHp || oldState.maxHp || '',
  effect: oldState.effect,
  action: oldState.action,
  result: oldState.result,
  notes: oldState.notes,
});

const migrateCell = (value: string): TrackerCellState => ({
  enemyToParty: value,
  partyToEnemy: '',
  enemyToPartyVisible: true,
  partyToEnemyVisible: true,
});

const migrateCellV5 = (cell: TrackerCellStateV5): TrackerCellState => ({
  enemyToParty: cell.enemyToParty,
  partyToEnemy: cell.partyToEnemy,
  enemyToPartyVisible: cell.isVisible,
  partyToEnemyVisible: cell.isVisible,
});

const compactCell = (
  cell: TrackerCellState,
  rowIndex: number,
  columnIndex: number
): TrackerSparseCellState | undefined => {
  const compactedCell: TrackerSparseCellState = {
    rowIndex,
    columnIndex,
  };

  if (cell.enemyToParty) {
    compactedCell.enemyToParty = cell.enemyToParty;
  }

  if (cell.partyToEnemy) {
    compactedCell.partyToEnemy = cell.partyToEnemy;
  }

  if (cell.enemyToPartyVisible) {
    compactedCell.enemyToPartyVisible = true;
  }

  if (cell.partyToEnemyVisible) {
    compactedCell.partyToEnemyVisible = true;
  }

  if (cell.enemyToPartyActionIds && cell.enemyToPartyActionIds.length > 0) {
    compactedCell.enemyToPartyActionIds = cell.enemyToPartyActionIds;
  }

  if (cell.partyToEnemyActionIds && cell.partyToEnemyActionIds.length > 0) {
    compactedCell.partyToEnemyActionIds = cell.partyToEnemyActionIds;
  }

  return compactedCell.enemyToParty ||
    compactedCell.partyToEnemy ||
    compactedCell.enemyToPartyVisible ||
    compactedCell.partyToEnemyVisible ||
    compactedCell.enemyToPartyActionIds ||
    compactedCell.partyToEnemyActionIds
    ? compactedCell
    : undefined;
};

const compactCells = (cells: TrackerCellState[][]): TrackerSparseCellState[] =>
  cells.flatMap((row, rowIndex) =>
    row.flatMap((cell, columnIndex) => {
      const compactedCell = compactCell(cell, rowIndex, columnIndex);

      return compactedCell ? [compactedCell] : [];
    })
  );

const hydrateSparseCells = (
  cells: TrackerSparseCellState[],
  enemyCount: number,
  partyCount: number
): TrackerCellState[][] => {
  const hydratedCells = Array.from({ length: enemyCount }, () =>
    Array.from({ length: partyCount }, () => createEmptyCell())
  );

  cells.forEach((cell) => {
    if (
      !Number.isInteger(cell.rowIndex) ||
      !Number.isInteger(cell.columnIndex) ||
      cell.rowIndex < 0 ||
      cell.columnIndex < 0 ||
      cell.rowIndex >= enemyCount ||
      cell.columnIndex >= partyCount
    ) {
      return;
    }

    const hydratedRow = hydratedCells[cell.rowIndex];
    if (!hydratedRow) {
      return;
    }

    hydratedRow[cell.columnIndex] = {
      enemyToParty: cell.enemyToParty || '',
      partyToEnemy: cell.partyToEnemy || '',
      enemyToPartyVisible: cell.enemyToPartyVisible === true,
      partyToEnemyVisible: cell.partyToEnemyVisible === true,
      ...(cell.enemyToPartyActionIds && cell.enemyToPartyActionIds.length > 0
        ? { enemyToPartyActionIds: cell.enemyToPartyActionIds }
        : {}),
      ...(cell.partyToEnemyActionIds && cell.partyToEnemyActionIds.length > 0
        ? { partyToEnemyActionIds: cell.partyToEnemyActionIds }
        : {}),
    };
  });

  return hydratedCells;
};

const getCellResultText = (
  cell: TrackerCellState | undefined,
  direction: TrackerActionDirection
): string => {
  if (!cell) {
    return '';
  }

  return direction === 'partyToEnemy' ? cell.partyToEnemy : cell.enemyToParty;
};

const compactAction = (
  action: TrackerActionDeclaration,
  round: TrackerRound
): TrackerPersistedActionDeclaration => {
  const combatant = getActionCombatant(round, action.side, action.combatantKey);
  const defaultIntention = getDefaultActionIntention(action);
  const roundState = getActionRoundState(
    round,
    action.side,
    action.combatantIndex
  );
  const targetCombatantKeys = action.targetDeclarations.map(
    (targetDeclaration) => targetDeclaration.targetCombatantKey
  );

  return {
    id: action.id,
    ...(action.source !== 'intention' ? { source: action.source } : {}),
    side: action.side,
    combatantKey: action.combatantKey,
    declaredAction: action.declaredAction,
    ...(action.actionLabel ? { actionLabel: action.actionLabel } : {}),
    ...(action.initiativeTiming && action.initiativeTiming !== 'normal'
      ? { initiativeTiming: action.initiativeTiming }
      : {}),
    ...(action.usesGridTargets === false ? { usesGridTargets: false } : {}),
    ...(action.actionDistanceInches !== undefined
      ? { actionDistanceInches: action.actionDistanceInches }
      : {}),
    ...(action.activationSegments !== undefined
      ? { activationSegments: action.activationSegments }
      : {}),
    ...(action.castingSegments !== undefined
      ? { castingSegments: action.castingSegments }
      : {}),
    ...(action.attackRoutineCount !== undefined
      ? { attackRoutineCount: action.attackRoutineCount }
      : {}),
    ...(combatant?.weapon !== action.weaponId
      ? { weaponId: action.weaponId }
      : {}),
    ...(action.intention !== defaultIntention
      ? { intention: action.intention }
      : {}),
    ...((roundState?.result || '') !== action.result
      ? { result: action.result }
      : {}),
    ...(targetCombatantKeys.length > 0 ? { targetCombatantKeys } : {}),
  };
};

const compactActions = (
  round: TrackerRound
): TrackerPersistedActionDeclaration[] | undefined => {
  if (!round.actions || round.actions.length === 0) {
    return undefined;
  }

  return round.actions.map((action) => compactAction(action, round));
};

const hydrateTargetDeclarations = (
  action: TrackerPersistedActionDeclaration,
  round: TrackerRound,
  combatantIndex: number
): TrackerActionDeclaration['targetDeclarations'] => {
  const targetCombatantKeys =
    action.targetCombatantKeys ||
    action.targetDeclarations?.map(
      (targetDeclaration) => targetDeclaration.targetCombatantKey
    );

  if (!targetCombatantKeys || combatantIndex < 0) {
    return [];
  }

  const direction = getActionDirection(action.side);
  const targetSide = getActionTargetSide(action.side);
  const targetCombatants = getRoundCombatants(round, targetSide);

  return targetCombatantKeys.flatMap((targetCombatantKey) => {
    const targetCombatantIndex = targetCombatants.findIndex(
      (targetCombatant) => targetCombatant.key === targetCombatantKey
    );

    if (targetCombatantIndex < 0) {
      return [];
    }

    const cellRowIndex =
      action.side === 'party' ? targetCombatantIndex : combatantIndex;
    const cellColumnIndex =
      action.side === 'party' ? combatantIndex : targetCombatantIndex;

    return [
      {
        targetCombatantKey,
        targetCombatantIndex,
        cellRowIndex,
        cellColumnIndex,
        cellResultText: getCellResultText(
          round.cells[cellRowIndex]?.[cellColumnIndex],
          direction
        ),
      },
    ];
  });
};

const hydrateAction = (
  action: TrackerPersistedActionDeclaration,
  round: TrackerRound
): TrackerActionDeclaration => {
  const combatantIndex = getActionCombatantIndex(
    round,
    action.side,
    action.combatantKey
  );
  const combatant = getActionCombatant(round, action.side, action.combatantKey);
  const roundState = getActionRoundState(round, action.side, combatantIndex);

  return {
    id: action.id,
    source: action.source || 'intention',
    side: action.side,
    direction: getActionDirection(action.side),
    combatantKey: action.combatantKey,
    combatantIndex,
    targetSide: getActionTargetSide(action.side),
    declaredAction: action.declaredAction,
    ...(action.actionLabel ? { actionLabel: action.actionLabel } : {}),
    ...(action.initiativeTiming
      ? { initiativeTiming: action.initiativeTiming }
      : {}),
    ...(action.usesGridTargets === false ? { usesGridTargets: false } : {}),
    ...(action.actionDistanceInches !== undefined
      ? { actionDistanceInches: action.actionDistanceInches }
      : {}),
    ...(action.activationSegments !== undefined
      ? { activationSegments: action.activationSegments }
      : {}),
    ...(action.castingSegments !== undefined
      ? { castingSegments: action.castingSegments }
      : {}),
    ...(action.attackRoutineCount !== undefined
      ? { attackRoutineCount: action.attackRoutineCount }
      : {}),
    weaponId: action.weaponId ?? combatant?.weapon ?? 0,
    intention:
      action.intention !== undefined
        ? action.intention
        : getDefaultActionIntention(action),
    result: action.result ?? roundState?.result ?? '',
    targetDeclarations: hydrateTargetDeclarations(
      action,
      round,
      combatantIndex
    ),
  };
};

const compactRound = (round: TrackerRound): TrackerRoundV8 => {
  const actions = compactActions(round);

  return {
    label: round.label,
    party: round.party,
    enemies: round.enemies,
    partyInitiative: round.partyInitiative,
    enemyInitiative: round.enemyInitiative,
    summary: round.summary,
    cells: compactCells(round.cells),
    partyStates: round.partyStates,
    enemyStates: round.enemyStates,
    ...(actions ? { actions } : {}),
  };
};

const compactTrackerState = (state: TrackerState): TrackerStateV8 => ({
  version: 8,
  ...(state.title !== undefined ? { title: state.title } : {}),
  rounds: state.rounds.map((round) => compactRound(round)),
  activeRound: state.activeRound,
});

const migrateRound = (
  round: TrackerRoundV1,
  oldState: TrackerStateV1,
  roundIndex: number
): TrackerRound => ({
  label: getDefaultRoundLabel(roundIndex + 1),
  party: cloneCombatants(oldState.party),
  enemies: cloneCombatants(oldState.enemies),
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) => row.map((value) => migrateCell(value))),
  partyStates: round.partyStates.map((state, index) =>
    migrateRoundState(state, oldState.party[index]?.maxHp)
  ),
  enemyStates: round.enemyStates.map((state, index) =>
    migrateRoundState(state, oldState.enemies[index]?.maxHp)
  ),
});

const resolveCombatantMaxHpFromV2 = (
  currentMaxHp: string | undefined,
  rounds: TrackerRoundV2[],
  side: 'party' | 'enemy',
  index: number
): string => {
  if (currentMaxHp) {
    return currentMaxHp;
  }

  for (const round of rounds) {
    const roundState =
      side === 'party' ? round.partyStates[index] : round.enemyStates[index];
    if (roundState?.maxHp) {
      return roundState.maxHp;
    }
  }

  return '';
};

const migrateRoundV2 = (
  round: TrackerRoundV2,
  party: TrackerCombatant[],
  enemies: TrackerCombatant[],
  partyMaxHp: string[],
  enemyMaxHp: string[],
  roundIndex: number
): TrackerRound => ({
  label: getDefaultRoundLabel(roundIndex + 1),
  party: cloneCombatants(
    party.map((combatant, index) => ({
      ...combatant,
      maxHp: partyMaxHp[index],
    }))
  ),
  enemies: cloneCombatants(
    enemies.map((combatant, index) => ({
      ...combatant,
      maxHp: enemyMaxHp[index],
    }))
  ),
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) =>
    row.map((cell) => ({
      enemyToParty: cell.enemyToParty,
      partyToEnemy: cell.partyToEnemy,
      enemyToPartyVisible: true,
      partyToEnemyVisible: true,
    }))
  ),
  partyStates: round.partyStates.map((state, index) =>
    migrateRoundStateV2(state, partyMaxHp[index])
  ),
  enemyStates: round.enemyStates.map((state, index) =>
    migrateRoundStateV2(state, enemyMaxHp[index])
  ),
});

const attachRoundRoster = (
  state: TrackerStateV4,
  round: TrackerStateV4['rounds'][number],
  roundIndex: number
): TrackerRound => ({
  label: getDefaultRoundLabel(roundIndex + 1),
  party: cloneCombatants(state.party),
  enemies: cloneCombatants(state.enemies),
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) => row.map((cell) => migrateCellV5(cell))),
  partyStates: round.partyStates.map((partyState) => ({
    ...partyState,
  })),
  enemyStates: round.enemyStates.map((enemyState) => ({
    ...enemyState,
  })),
});

const migrateRoundV5 = (
  round: TrackerRoundV5,
  roundIndex: number
): TrackerRound => ({
  label: getDefaultRoundLabel(roundIndex + 1),
  party: cloneCombatants(round.party),
  enemies: cloneCombatants(round.enemies),
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) => row.map((cell) => migrateCellV5(cell))),
  partyStates: round.partyStates.map((partyState) => ({
    ...partyState,
  })),
  enemyStates: round.enemyStates.map((enemyState) => ({
    ...enemyState,
  })),
});

const migrateRoundV6 = (
  round: TrackerRoundV6,
  roundIndex: number
): TrackerRound => ({
  label: getDefaultRoundLabel(roundIndex + 1),
  party: cloneCombatants(round.party),
  enemies: cloneCombatants(round.enemies),
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
    }))
  ),
  partyStates: round.partyStates.map((partyState) => ({
    ...partyState,
  })),
  enemyStates: round.enemyStates.map((enemyState) => ({
    ...enemyState,
  })),
});

const migrateRoundV8 = (round: TrackerRoundV8): TrackerRound => {
  const hydratedRound: TrackerRound = {
    label: round.label,
    party: cloneCombatants(round.party),
    enemies: cloneCombatants(round.enemies),
    partyInitiative: round.partyInitiative,
    enemyInitiative: round.enemyInitiative,
    summary: round.summary,
    cells: hydrateSparseCells(
      round.cells,
      round.enemies.length,
      round.party.length
    ),
    partyStates: round.partyStates.map((partyState) => ({
      ...partyState,
    })),
    enemyStates: round.enemyStates.map((enemyState) => ({
      ...enemyState,
    })),
  };
  const actions = round.actions?.map((action) =>
    hydrateAction(action, hydratedRound)
  );

  return {
    ...hydratedRound,
    ...(actions && actions.length > 0 ? { actions } : {}),
  };
};

export const transformTrackerState = (
  state: TrackerStateAnyVersion
): TrackerState => {
  if (state.version === 8) {
    return normalizeTrackerState({
      version: 7,
      title: state.title,
      rounds: state.rounds.map((round) => migrateRoundV8(round)),
      activeRound: state.activeRound,
    });
  }

  if (state.version === 7) {
    return normalizeTrackerState(state);
  }

  if (state.version === 6) {
    return normalizeTrackerState({
      version: 7,
      title: state.title,
      rounds: state.rounds.map((round, roundIndex) =>
        migrateRoundV6(round, roundIndex)
      ),
      activeRound: state.activeRound,
    });
  }

  if (state.version === 5) {
    return normalizeTrackerState({
      version: 7,
      rounds: state.rounds.map((round, roundIndex) =>
        migrateRoundV5(round, roundIndex)
      ),
      activeRound: state.activeRound,
    });
  }

  if (state.version === 4) {
    return normalizeTrackerState({
      version: 7,
      rounds: state.rounds.map((round, roundIndex) =>
        attachRoundRoster(state, round, roundIndex)
      ),
      activeRound: state.activeRound,
    });
  }

  if (state.version === 3) {
    return normalizeTrackerState({
      version: 7,
      rounds: state.rounds.map((round, roundIndex) => ({
        label: getDefaultRoundLabel(roundIndex + 1),
        party: cloneCombatants(state.party),
        enemies: cloneCombatants(state.enemies),
        ...round,
        cells: round.cells.map((row) =>
          row.map((cell) => ({
            enemyToParty: cell.enemyToParty,
            partyToEnemy: cell.partyToEnemy,
            enemyToPartyVisible: true,
            partyToEnemyVisible: true,
          }))
        ),
      })),
      activeRound: state.activeRound,
    });
  }

  if (state.version === 2) {
    const partyMaxHp = state.party.map((combatant, index) =>
      resolveCombatantMaxHpFromV2(combatant.maxHp, state.rounds, 'party', index)
    );
    const enemyMaxHp = state.enemies.map((combatant, index) =>
      resolveCombatantMaxHpFromV2(combatant.maxHp, state.rounds, 'enemy', index)
    );

    return normalizeTrackerState({
      version: 7,
      rounds: state.rounds.map((round, roundIndex) =>
        migrateRoundV2(
          round,
          state.party,
          state.enemies,
          partyMaxHp,
          enemyMaxHp,
          roundIndex
        )
      ),
      activeRound: state.activeRound,
    });
  }

  return normalizeTrackerState({
    version: 7,
    rounds: state.rounds.map((round, roundIndex) =>
      migrateRound(round, state, roundIndex)
    ),
    activeRound: state.activeRound,
  });
};

export const encodeTrackerState = (state: TrackerState): Promise<string> =>
  new Promise((resolve, reject) => {
    deflate(JSON.stringify(compactTrackerState(state)), (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(encodeURIComponent(buffer.toString('base64')));
    });
  });

export const encodeTrackerStateSync = (state: TrackerState): string =>
  encodeURIComponent(
    deflateSync(JSON.stringify(compactTrackerState(state))).toString('base64')
  );

export const decodeTrackerState = (
  encodedState: string
): Promise<TrackerState> =>
  new Promise((resolve, reject) => {
    let buffer: Buffer;

    try {
      buffer = Buffer.from(decodeURIComponent(encodedState), 'base64');
    } catch (error) {
      reject(error);
      return;
    }

    unzip(buffer, (err, inflated) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        resolve(
          transformTrackerState(
            JSON.parse(inflated.toString()) as TrackerStateAnyVersion
          )
        );
      } catch (error) {
        reject(error);
      }
    });
  });
