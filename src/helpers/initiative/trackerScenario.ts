import { resolveOpenMeleeExchange, type OpenMeleeCombatant } from './openMelee';
import { getWeaponInfo } from '../../tables/weapon';
import type {
  DirectMeleeEngagement,
  DirectMeleePair,
  InitiativeScenario,
  InitiativeScenarioCombatant,
  InitiativeScenarioOrder,
  InitiativeScenarioSide,
  InitiativeWeaponType,
} from '../../types/initiative';
import type { TrackerRound } from '../../types/tracker';

const parseInitiative = (value: string): number => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCombatantId = (
  side: InitiativeScenarioSide,
  combatantKey: number
): string => `${side}-${combatantKey}`;

const getCombatantName = (
  name: string | undefined,
  side: InitiativeScenarioSide,
  index: number
): string => name || `${side === 'party' ? 'Party' : 'Enemy'} ${index + 1}`;

const getTargetIndicesForPartyCombatant = (
  round: TrackerRound,
  partyIndex: number
): number[] =>
  round.enemies.flatMap((_, enemyIndex) => {
    const cell = round.cells[enemyIndex]?.[partyIndex];
    return cell &&
      (cell.partyToEnemyVisible || Boolean(cell.partyToEnemy.trim()))
      ? [enemyIndex]
      : [];
  });

const getTargetIndicesForEnemyCombatant = (
  round: TrackerRound,
  enemyIndex: number
): number[] =>
  round.party.flatMap((_, partyIndex) => {
    const cell = round.cells[enemyIndex]?.[partyIndex];
    return cell &&
      (cell.enemyToPartyVisible || Boolean(cell.enemyToParty.trim()))
      ? [partyIndex]
      : [];
  });

const getSimpleOrder = (
  partyInitiative: number,
  enemyInitiative: number
): InitiativeScenarioOrder => {
  if (partyInitiative > enemyInitiative) {
    return 'party-first';
  }

  if (enemyInitiative > partyInitiative) {
    return 'enemy-first';
  }

  return 'simultaneous';
};

const isNonMissileCombatant = (
  combatant: InitiativeScenarioCombatant
): boolean => combatant.weaponType !== 'missile';

const getInitiativeWeaponType = (
  weaponType: InitiativeWeaponType | undefined
): InitiativeWeaponType => weaponType || 'natural';

const toOpenMeleeCombatant = (
  combatant: InitiativeScenarioCombatant
): OpenMeleeCombatant => ({
  id: combatant.id,
  initiative: combatant.initiative,
  weaponKind: combatant.weaponType === 'melee' ? 'weapon' : 'natural',
  weaponSpeedFactor:
    combatant.weaponType === 'melee' ? combatant.weaponSpeedFactor : undefined,
});

export const buildInitiativeScenarioFromTrackerRound = (
  round: TrackerRound
): InitiativeScenario => {
  const partyInitiative = parseInitiative(round.partyInitiative);
  const enemyInitiative = parseInitiative(round.enemyInitiative);

  const party: InitiativeScenarioCombatant[] = round.party.map(
    (combatant, index) => {
      const weaponInfo = getWeaponInfo(combatant.weapon);

      return {
        id: getCombatantId('party', combatant.key),
        side: 'party',
        index,
        combatantKey: combatant.key,
        name: getCombatantName(combatant.name, 'party', index),
        initiative: partyInitiative,
        weaponId: combatant.weapon,
        weaponName: weaponInfo?.name || `Weapon ${combatant.weapon}`,
        weaponType: getInitiativeWeaponType(weaponInfo?.weaponType),
        weaponSpeedFactor:
          weaponInfo?.weaponType === 'melee'
            ? weaponInfo.speedFactor
            : undefined,
        intention: round.partyStates[index]?.action || '',
        result: round.partyStates[index]?.result || '',
        targetIds: getTargetIndicesForPartyCombatant(round, index).map(
          (enemyIndex) =>
            getCombatantId('enemy', round.enemies[enemyIndex]?.key || 0)
        ),
      };
    }
  );

  const enemies: InitiativeScenarioCombatant[] = round.enemies.map(
    (combatant, index) => {
      const weaponInfo = getWeaponInfo(combatant.weapon);

      return {
        id: getCombatantId('enemy', combatant.key),
        side: 'enemy',
        index,
        combatantKey: combatant.key,
        name: getCombatantName(combatant.name, 'enemy', index),
        initiative: enemyInitiative,
        weaponId: combatant.weapon,
        weaponName: weaponInfo?.name || `Weapon ${combatant.weapon}`,
        weaponType: getInitiativeWeaponType(weaponInfo?.weaponType),
        weaponSpeedFactor:
          weaponInfo?.weaponType === 'melee'
            ? weaponInfo.speedFactor
            : undefined,
        intention: round.enemyStates[index]?.action || '',
        result: round.enemyStates[index]?.result || '',
        targetIds: getTargetIndicesForEnemyCombatant(round, index).map(
          (partyIndex) =>
            getCombatantId('party', round.party[partyIndex]?.key || 0)
        ),
      };
    }
  );

  const partyById = new Map(
    party.map((combatant) => [combatant.id, combatant])
  );
  const enemyById = new Map(
    enemies.map((combatant) => [combatant.id, combatant])
  );
  const mutualCandidates: DirectMeleePair[] = party.flatMap((partyCombatant) =>
    partyCombatant.targetIds.flatMap((enemyId) => {
      const enemyCombatant = enemyById.get(enemyId);

      if (!enemyCombatant) {
        return [];
      }

      if (
        !isNonMissileCombatant(partyCombatant) ||
        !isNonMissileCombatant(enemyCombatant)
      ) {
        return [];
      }

      return enemyCombatant.targetIds.includes(partyCombatant.id)
        ? [
            {
              partyCombatantId: partyCombatant.id,
              enemyCombatantId: enemyCombatant.id,
              inference: 'mutual-targeting-non-missile-weapons' as const,
            },
          ]
        : [];
    })
  );

  const candidateCountByCombatantId = mutualCandidates.reduce<
    Map<string, number>
  >((counts, pair) => {
    counts.set(
      pair.partyCombatantId,
      (counts.get(pair.partyCombatantId) || 0) + 1
    );
    counts.set(
      pair.enemyCombatantId,
      (counts.get(pair.enemyCombatantId) || 0) + 1
    );
    return counts;
  }, new Map());

  const directMeleePairs = mutualCandidates.filter(
    (pair) =>
      candidateCountByCombatantId.get(pair.partyCombatantId) === 1 &&
      candidateCountByCombatantId.get(pair.enemyCombatantId) === 1
  );

  const directMeleeEngagements: DirectMeleeEngagement[] = directMeleePairs.map(
    (pair) => {
      const partyCombatant = partyById.get(pair.partyCombatantId);
      const enemyCombatant = enemyById.get(pair.enemyCombatantId);

      if (!partyCombatant || !enemyCombatant) {
        throw new Error(
          `Missing combatant while resolving direct melee pair ${pair.partyCombatantId}/${pair.enemyCombatantId}`
        );
      }

      return {
        ...pair,
        resolution: resolveOpenMeleeExchange(
          toOpenMeleeCombatant(partyCombatant),
          toOpenMeleeCombatant(enemyCombatant)
        ),
      };
    }
  );

  const directPairCombatantIds = new Set(
    directMeleePairs.flatMap((pair) => [
      pair.partyCombatantId,
      pair.enemyCombatantId,
    ])
  );
  const unresolvedMeleeCandidateIds = Array.from(
    new Set(
      mutualCandidates
        .flatMap((pair) => [pair.partyCombatantId, pair.enemyCombatantId])
        .filter((combatantId) => !directPairCombatantIds.has(combatantId))
    )
  );

  return {
    label: round.label,
    partyInitiative,
    enemyInitiative,
    simpleOrder: getSimpleOrder(partyInitiative, enemyInitiative),
    party,
    enemies,
    directMeleePairs,
    directMeleeEngagements,
    unresolvedMeleeCandidateIds,
  };
};
