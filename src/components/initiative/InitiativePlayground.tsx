import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { SingleValue } from 'react-select';
import Select from 'react-select';
import { buildInitiativeAttackGraph } from '../../helpers/initiative/attackGraph';
import { buildInitiativeRoundResolutionViewModel } from '../../helpers/initiative/roundResolutionViewModel';
import { resolveInitiativeRound } from '../../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../../helpers/initiative/scenario';
import customStyles from '../../helpers/selectCustomStyles';
import { MONSTER } from '../../tables/attackerClass';
import { getWeaponInfo, getWeaponOptions } from '../../tables/weapon';
import type {
  InitiativeScenarioDraft,
  InitiativeScenarioDraftCombatant,
} from '../../types/initiative';
import type { WeaponOption } from '../../types/option';
import styles from './initiativePlayground.module.css';

type InitiativePlaytestSide = 'party' | 'enemy';
type InitiativePlaytestStateSide = 'party' | 'enemies';

interface InitiativePlaytestCombatant {
  key: number;
  name: string;
  weaponId: number;
  targetCombatantKeys: number[];
}

interface InitiativePlaytestState {
  label: string;
  partyInitiative: string;
  enemyInitiative: string;
  nextCombatantKey: number;
  party: InitiativePlaytestCombatant[];
  enemies: InitiativePlaytestCombatant[];
}

interface InitiativePlaytestEditorTarget {
  side: InitiativePlaytestSide;
  combatantKey: number;
}

const ALL_WEAPON_OPTIONS = getWeaponOptions(MONSTER);

const parseInitiative = (value: string): number => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createCombatant = (
  key: number,
  name: string,
  weaponId: number,
  targetCombatantKeys: number[] = []
): InitiativePlaytestCombatant => ({
  key,
  name,
  weaponId,
  targetCombatantKeys,
});

const createMixedPreset = (): InitiativePlaytestState => ({
  label: 'Mixed Open Melee',
  partyInitiative: '4',
  enemyInitiative: '4',
  nextCombatantKey: 5,
  party: [
    createCombatant(1, 'Aldred', 17, [3]),
    createCombatant(2, 'Bera', 16),
  ],
  enemies: [
    createCombatant(3, 'Gnoll', 2, [1]),
    createCombatant(4, 'Ghoul', 1),
  ],
});

const createEnemyEdgePreset = (): InitiativePlaytestState => ({
  label: 'Enemy Initiative Edge',
  partyInitiative: '2',
  enemyInitiative: '5',
  nextCombatantKey: 5,
  party: [createCombatant(1, 'Hugh', 2, [3]), createCombatant(2, 'Lysa', 17)],
  enemies: [
    createCombatant(3, 'Orc', 1, [1]),
    createCombatant(4, 'Orc Archer', 16),
  ],
});

const createScrumPreset = (): InitiativePlaytestState => ({
  label: 'Ambiguous Scrum',
  partyInitiative: '6',
  enemyInitiative: '1',
  nextCombatantKey: 6,
  party: [
    createCombatant(1, 'Moryn', 2, [4]),
    createCombatant(2, 'Sella', 3, [4]),
    createCombatant(3, 'Tarn', 16),
  ],
  enemies: [
    createCombatant(4, 'Bugbear', 1, [1, 2]),
    createCombatant(5, 'Kobold', 1),
  ],
});

const buildDraftCombatants = (
  combatants: InitiativePlaytestCombatant[]
): InitiativeScenarioDraftCombatant[] =>
  combatants.map((combatant) => ({
    combatantKey: combatant.key,
    name: combatant.name.trim() || undefined,
    weaponId: combatant.weaponId,
    targetCombatantKeys: combatant.targetCombatantKeys,
  }));

const buildDraftFromState = (
  state: InitiativePlaytestState
): InitiativeScenarioDraft => ({
  label: state.label.trim() || 'Initiative Playtest',
  partyInitiative: parseInitiative(state.partyInitiative),
  enemyInitiative: parseInitiative(state.enemyInitiative),
  party: buildDraftCombatants(state.party),
  enemies: buildDraftCombatants(state.enemies),
});

const getDefaultWeaponIdForSide = (side: InitiativePlaytestSide): number =>
  side === 'party' ? 17 : 1;

const getStateSide = (
  side: InitiativePlaytestSide
): InitiativePlaytestStateSide => (side === 'party' ? 'party' : 'enemies');

const getNextCombatantName = (
  side: InitiativePlaytestSide,
  count: number
): string => `${side === 'party' ? 'Party' : 'Enemy'} ${count + 1}`;

const getCombatantDisplayName = (
  side: InitiativePlaytestSide,
  combatant: InitiativePlaytestCombatant,
  index: number
): string => combatant.name.trim() || getNextCombatantName(side, index);

const getWeaponSummary = (weaponId: number): string => {
  const weaponInfo = getWeaponInfo(weaponId);

  if (weaponInfo?.weaponType === 'melee') {
    return `WSF ${weaponInfo.speedFactor}`;
  }

  if (weaponInfo?.weaponType === 'missile') {
    return `FR ${weaponInfo.fireRate}`;
  }

  return weaponInfo?.weaponType || 'natural';
};

const InitiativePlayground = () => {
  const [state, setState] =
    useState<InitiativePlaytestState>(createMixedPreset);
  const [editorTarget, setEditorTarget] = useState<
    InitiativePlaytestEditorTarget | undefined
  >(undefined);
  const scenario = useMemo(
    () => buildInitiativeScenario(buildDraftFromState(state)),
    [state]
  );
  const resolution = useMemo(
    () => resolveInitiativeRound(scenario),
    [scenario]
  );
  const attackGraph = useMemo(
    () => buildInitiativeAttackGraph(scenario, resolution),
    [resolution, scenario]
  );
  const viewModel = useMemo(
    () => buildInitiativeRoundResolutionViewModel(scenario, resolution),
    [resolution, scenario]
  );
  const menuPortalTarget =
    typeof document !== 'undefined' ? document.body : undefined;
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  const updateLabel = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((previous) => ({
      ...previous,
      label: value,
    }));
  };

  const updateInitiative = (
    field: 'partyInitiative' | 'enemyInitiative',
    value: string
  ) => {
    setState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateCombatant = (
    side: InitiativePlaytestSide,
    combatantKey: number,
    changes: Partial<InitiativePlaytestCombatant>
  ) => {
    const stateSide = getStateSide(side);

    setState((previous) => ({
      ...previous,
      [stateSide]: previous[stateSide].map((combatant) =>
        combatant.key === combatantKey
          ? { ...combatant, ...changes }
          : combatant
      ),
    }));
  };

  const addCombatant = (side: InitiativePlaytestSide) => {
    const stateSide = getStateSide(side);

    setState((previous) => {
      const nextCombatant = createCombatant(
        previous.nextCombatantKey,
        getNextCombatantName(side, previous[stateSide].length),
        getDefaultWeaponIdForSide(side)
      );

      return {
        ...previous,
        nextCombatantKey: previous.nextCombatantKey + 1,
        [stateSide]: previous[stateSide].concat(nextCombatant),
      };
    });
  };

  const removeCombatant = (
    side: InitiativePlaytestSide,
    combatantKey: number
  ) => {
    const stateSide = getStateSide(side);
    const opposingStateSide: InitiativePlaytestStateSide =
      side === 'party' ? 'enemies' : 'party';

    setState((previous) => ({
      ...previous,
      [stateSide]: previous[stateSide].filter(
        (combatant) => combatant.key !== combatantKey
      ),
      [opposingStateSide]: previous[opposingStateSide].map((combatant) =>
        combatant.targetCombatantKeys.includes(combatantKey)
          ? {
              ...combatant,
              targetCombatantKeys: combatant.targetCombatantKeys.filter(
                (targetKey) => targetKey !== combatantKey
              ),
            }
          : combatant
      ),
    }));
    setEditorTarget((previous) =>
      previous &&
      previous.side === side &&
      previous.combatantKey === combatantKey
        ? undefined
        : previous
    );
  };

  const loadPreset = (presetFactory: () => InitiativePlaytestState) => {
    setState(presetFactory());
  };

  const toggleCombatantTarget = (
    attackingSide: InitiativePlaytestSide,
    attackerKey: number,
    targetKey: number
  ) => {
    const stateSide = getStateSide(attackingSide);

    setState((previous) => ({
      ...previous,
      [stateSide]: previous[stateSide].map((combatant) => {
        if (combatant.key !== attackerKey) {
          return combatant;
        }

        return {
          ...combatant,
          targetCombatantKeys: combatant.targetCombatantKeys.includes(targetKey)
            ? combatant.targetCombatantKeys.filter(
                (existingTargetKey) => existingTargetKey !== targetKey
              )
            : combatant.targetCombatantKeys.concat(targetKey),
        };
      }),
    }));
  };

  const attackNodeLabelById = useMemo(
    () =>
      Object.fromEntries(
        attackGraph.nodes.map((node) => [
          node.id,
          `${
            viewModel.combatantNameById[node.combatantId] || node.combatantId
          } ${node.label}`,
        ])
      ),
    [attackGraph.nodes, viewModel.combatantNameById]
  );
  const editedCombatant =
    editorTarget !== undefined
      ? state[getStateSide(editorTarget.side)].find(
          (combatant) => combatant.key === editorTarget.combatantKey
        )
      : undefined;
  const editedCombatantIndex =
    editorTarget !== undefined
      ? state[getStateSide(editorTarget.side)].findIndex(
          (combatant) => combatant.key === editorTarget.combatantKey
        )
      : -1;
  const editedCombatantDisplayName =
    editedCombatant && editorTarget && editedCombatantIndex >= 0
      ? getCombatantDisplayName(
          editorTarget.side,
          editedCombatant,
          editedCombatantIndex
        )
      : undefined;

  return (
    <div className={styles['page']}>
      <div className={styles['hero']}>
        <div>
          <div className={styles['eyebrow']}>AD&amp;D 1e Initiative</div>
          <h1 className={styles['title']}>Initiative Playground</h1>
          <p className={styles['lede']}>
            This page is for playtesting the current rules slice: simple side
            initiative, conservative direct melee pairing, open-melee weapon
            speed factor resolution, and generic attack routines with named
            components.
          </p>
        </div>
        <div className={styles['presetBar']}>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createMixedPreset)}
          >
            Mixed Example
          </button>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createEnemyEdgePreset)}
          >
            Enemy Edge
          </button>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createScrumPreset)}
          >
            Ambiguous Scrum
          </button>
        </div>
      </div>

      <div className={styles['layout']}>
        <section className={styles['panel']}>
          <div className={styles['panelHeader']}>
            <h2 className={styles['panelTitle']}>Scenario Input</h2>
            <p className={styles['panelCopy']}>
              Enter only what the current machinery needs: side initiative,
              weapon, and declared target.
            </p>
          </div>

          <div className={styles['roundControls']}>
            <label className={styles['fieldLabel']}>
              Scenario label
              <input
                className={styles['textInput']}
                value={state.label}
                onChange={updateLabel}
              />
            </label>
            <label className={styles['fieldLabel']}>
              Party initiative
              <input
                className={styles['textInput']}
                inputMode={'numeric'}
                value={state.partyInitiative}
                onChange={(event) =>
                  updateInitiative('partyInitiative', event.target.value)
                }
              />
            </label>
            <label className={styles['fieldLabel']}>
              Enemy initiative
              <input
                className={styles['textInput']}
                inputMode={'numeric'}
                value={state.enemyInitiative}
                onChange={(event) =>
                  updateInitiative('enemyInitiative', event.target.value)
                }
              />
            </label>
          </div>

          <div className={styles['matrixSection']}>
            <div className={styles['matrixHeader']}>
              <h3 className={styles['matrixTitle']}>Engagement Matrix</h3>
              <p className={styles['matrixCopy']}>
                Party combatants run across the top, enemies run down the side.
                Toggle `P→E` when the party column attacks the enemy row, `E→P`
                for the reverse, and mutual cells light up as duels. Click a row
                or column header to edit that combatant.
              </p>
            </div>

            {state.party.length > 0 && state.enemies.length > 0 ? (
              <div className={styles['matrixWrap']}>
                <table className={styles['matrixTable']}>
                  <thead>
                    <tr>
                      <th className={styles['matrixCorner']}>
                        <span className={styles['matrixLegendLabel']}>
                          Party vs Enemy
                        </span>
                        <span className={styles['matrixLegendMeta']}>
                          `P→E` and `E→P` are the declared attacks.
                        </span>
                        <div className={styles['matrixLegendActions']}>
                          <button
                            type={'button'}
                            className={styles['addButton']}
                            onClick={() => addCombatant('party')}
                          >
                            Add party
                          </button>
                          <button
                            type={'button'}
                            className={styles['addButton']}
                            onClick={() => addCombatant('enemy')}
                          >
                            Add enemy
                          </button>
                        </div>
                      </th>
                      {state.party.map((partyCombatant, partyIndex) => (
                        <th
                          key={`party-header-${partyCombatant.key}`}
                          className={styles['matrixColumnHeader']}
                        >
                          <button
                            type={'button'}
                            className={styles['matrixCombatantButton']}
                            onClick={() =>
                              setEditorTarget({
                                side: 'party',
                                combatantKey: partyCombatant.key,
                              })
                            }
                          >
                            <span className={styles['matrixCombatantName']}>
                              {getCombatantDisplayName(
                                'party',
                                partyCombatant,
                                partyIndex
                              )}
                            </span>
                            <span className={styles['matrixCombatantMeta']}>
                              {getWeaponSummary(partyCombatant.weaponId)}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.enemies.map((enemyCombatant, enemyIndex) => {
                      return (
                        <tr key={`enemy-row-${enemyCombatant.key}`}>
                          <th className={styles['matrixRowHeader']}>
                            <button
                              type={'button'}
                              className={styles['matrixCombatantButton']}
                              onClick={() =>
                                setEditorTarget({
                                  side: 'enemy',
                                  combatantKey: enemyCombatant.key,
                                })
                              }
                            >
                              <span className={styles['matrixCombatantName']}>
                                {getCombatantDisplayName(
                                  'enemy',
                                  enemyCombatant,
                                  enemyIndex
                                )}
                              </span>
                              <span className={styles['matrixCombatantMeta']}>
                                {getWeaponSummary(enemyCombatant.weaponId)}
                              </span>
                            </button>
                          </th>
                          {state.party.map((partyCombatant) => {
                            const partyTargetsEnemy =
                              partyCombatant.targetCombatantKeys.includes(
                                enemyCombatant.key
                              );
                            const enemyTargetsParty =
                              enemyCombatant.targetCombatantKeys.includes(
                                partyCombatant.key
                              );
                            const isDuel =
                              partyTargetsEnemy && enemyTargetsParty;

                            return (
                              <td
                                key={`matrix-${enemyCombatant.key}-${partyCombatant.key}`}
                                className={[
                                  styles['matrixCell'],
                                  isDuel ? styles['matrixCellDuel'] : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <button
                                  type={'button'}
                                  className={[
                                    styles['matrixToggle'],
                                    styles['matrixToggleParty'],
                                    partyTargetsEnemy
                                      ? styles['matrixToggleActiveParty']
                                      : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  onClick={() =>
                                    toggleCombatantTarget(
                                      'party',
                                      partyCombatant.key,
                                      enemyCombatant.key
                                    )
                                  }
                                >
                                  P&rarr;E
                                </button>
                                <button
                                  type={'button'}
                                  className={[
                                    styles['matrixToggle'],
                                    styles['matrixToggleEnemy'],
                                    enemyTargetsParty
                                      ? styles['matrixToggleActiveEnemy']
                                      : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  onClick={() =>
                                    toggleCombatantTarget(
                                      'enemy',
                                      enemyCombatant.key,
                                      partyCombatant.key
                                    )
                                  }
                                >
                                  E&rarr;P
                                </button>
                                {isDuel ? (
                                  <span className={styles['matrixBadge']}>
                                    Duel
                                  </span>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles['matrixEmpty']}>
                <div>
                  Add at least one party combatant and one enemy combatant to
                  use the engagement matrix.
                </div>
                <div className={styles['matrixLegendActions']}>
                  <button
                    type={'button'}
                    className={styles['addButton']}
                    onClick={() => addCombatant('party')}
                  >
                    Add party
                  </button>
                  <button
                    type={'button'}
                    className={styles['addButton']}
                    onClick={() => addCombatant('enemy')}
                  >
                    Add enemy
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles['panel']}>
          <div className={styles['panelHeader']}>
            <h2 className={styles['panelTitle']}>Suggested Order</h2>
            <p className={styles['panelCopy']}>
              The output stays partial on purpose. Anything still ambiguous
              remains explicitly unresolved, and the graph now tracks attack
              routine components rather than only raw attack numbers.
            </p>
          </div>

          <div className={styles['summaryStrip']}>
            <div className={styles['summaryCell']}>
              <span className={styles['summaryLabel']}>Simple order</span>
              <span className={styles['summaryValue']}>
                {resolution.simpleOrder}
              </span>
            </div>
            <div className={styles['summaryCell']}>
              <span className={styles['summaryLabel']}>
                Direct melee overrides
              </span>
              <span className={styles['summaryValue']}>
                {resolution.directMeleeEngagements.length}
              </span>
            </div>
            <div className={styles['summaryCell']}>
              <span className={styles['summaryLabel']}>Unresolved</span>
              <span className={styles['summaryValue']}>
                {resolution.unresolvedMeleeCandidateIds.length}
              </span>
            </div>
            <div className={styles['summaryCell']}>
              <span className={styles['summaryLabel']}>Known precedence</span>
              <span className={styles['summaryValue']}>
                {attackGraph.edges.length}
              </span>
            </div>
          </div>

          <div className={styles['cardStack']}>
            {viewModel.cards.map((card) => (
              <article key={card.id} className={styles['resultCard']}>
                <div className={styles['resultHeader']}>
                  <span className={styles['resultKind']}>{card.kind}</span>
                  <h3 className={styles['resultTitle']}>{card.title}</h3>
                </div>
                <p className={styles['resultSummary']}>{card.summary}</p>
                <ol className={styles['stepList']}>
                  {card.steps.map((step) => (
                    <li
                      key={`${card.id}-${step.label}`}
                      className={styles['stepItem']}
                    >
                      <span className={styles['stepLabel']}>{step.label}</span>
                      <span className={styles['stepDetail']}>
                        {step.detail}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>

          <div className={styles['graphPanel']}>
            <div className={styles['graphHeader']}>
              <h3 className={styles['graphTitle']}>Precedence DAG</h3>
              <p className={styles['graphCopy']}>
                The graph only contains relations justified by baseline
                initiative or a narrower melee timing rule.
              </p>
            </div>

            <div className={styles['graphGrid']}>
              <div className={styles['graphColumn']}>
                <h4 className={styles['graphSubhead']}>Layers</h4>
                <ol className={styles['graphList']}>
                  {attackGraph.layers.map((layer, index) => (
                    <li
                      key={`layer-${index + 1}`}
                      className={styles['graphItem']}
                    >
                      <span className={styles['stepLabel']}>
                        Layer {index + 1}
                      </span>
                      <span className={styles['stepDetail']}>
                        {layer
                          .map(
                            (nodeId) => attackNodeLabelById[nodeId] || nodeId
                          )
                          .join(', ')}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className={styles['graphColumn']}>
                <h4 className={styles['graphSubhead']}>Known Before</h4>
                {attackGraph.edges.length > 0 ? (
                  <ol className={styles['graphList']}>
                    {attackGraph.edges.map((edge) => (
                      <li
                        key={`${edge.fromNodeId}-${edge.toNodeId}`}
                        className={styles['graphItem']}
                      >
                        <span className={styles['stepLabel']}>
                          {attackNodeLabelById[edge.fromNodeId] ||
                            edge.fromNodeId}
                        </span>
                        <span className={styles['stepDetail']}>
                          before{' '}
                          {attackNodeLabelById[edge.toNodeId] || edge.toNodeId}
                          {' · '}
                          {edge.reasons.join(', ')}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className={styles['graphEmpty']}>
                    No explicit precedence edges. The current scenario is fully
                    simultaneous at this rules slice.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      {editedCombatant && editorTarget && modalRoot
        ? createPortal(
            <>
              <div
                className={styles['modalShadow']}
                onClick={() => setEditorTarget(undefined)}
              />
              <div
                className={styles['modal']}
                role={'dialog'}
                aria-modal={'true'}
                aria-labelledby={'initiative-editor-title'}
              >
                <div
                  id={'initiative-editor-title'}
                  className={styles['modalTitle']}
                >
                  {editorTarget.side === 'party'
                    ? 'Edit Party Combatant'
                    : 'Edit Enemy Combatant'}
                </div>
                <p className={styles['modalText']}>
                  Target declarations are edited in the engagement matrix. Use
                  this modal to change the combatant label or weapon.
                </p>
                <label
                  className={styles['modalLabel']}
                  htmlFor={`initiative-name-${editedCombatant.key}`}
                >
                  Name
                </label>
                <input
                  id={`initiative-name-${editedCombatant.key}`}
                  className={styles['textInput']}
                  type={'text'}
                  value={editedCombatant.name}
                  onChange={(event) =>
                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      name: event.target.value,
                    })
                  }
                />
                <label className={styles['modalLabel']}>Weapon</label>
                <Select
                  instanceId={`initiative-weapon-${editedCombatant.key}`}
                  styles={customStyles}
                  menuPortalTarget={menuPortalTarget}
                  menuPosition={'fixed'}
                  value={
                    ALL_WEAPON_OPTIONS.find(
                      (option) => option.value === editedCombatant.weaponId
                    ) || null
                  }
                  options={ALL_WEAPON_OPTIONS}
                  onChange={(option: SingleValue<WeaponOption>) => {
                    if (!option) {
                      return;
                    }

                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      weaponId: option.value,
                    });
                  }}
                />
                <div className={styles['modalMeta']}>
                  <span className={styles['modalMetaLabel']}>
                    Current display
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {editedCombatantDisplayName}
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {getWeaponSummary(editedCombatant.weaponId)}
                  </span>
                </div>
                <div className={styles['modalActions']}>
                  <button
                    type={'button'}
                    className={styles['modalButtonDanger']}
                    onClick={() =>
                      removeCombatant(editorTarget.side, editedCombatant.key)
                    }
                  >
                    Remove combatant
                  </button>
                  <button
                    type={'button'}
                    className={styles['modalButton']}
                    onClick={() => setEditorTarget(undefined)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </>,
            modalRoot
          )
        : null}
    </div>
  );
};

export default InitiativePlayground;
