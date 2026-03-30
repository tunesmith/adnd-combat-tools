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

const InitiativePlayground = () => {
  const [state, setState] =
    useState<InitiativePlaytestState>(createMixedPreset);
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
  };

  const loadPreset = (presetFactory: () => InitiativePlaytestState) => {
    setState(presetFactory());
  };

  const attackNodeLabelById = useMemo(
    () =>
      Object.fromEntries(
        attackGraph.nodes.map((node) => [
          node.id,
          `${viewModel.combatantNameById[node.combatantId] || node.combatantId} ${
            node.label
          }`,
        ])
      ),
    [attackGraph.nodes, viewModel.combatantNameById]
  );

  const renderCombatantCard = (
    side: InitiativePlaytestSide,
    combatant: InitiativePlaytestCombatant,
    index: number
  ) => {
    const opposingCombatants = side === 'party' ? state.enemies : state.party;
    const targetSelectId = `${side}-target-${combatant.key}`;
    const weaponInfo = getWeaponInfo(combatant.weaponId);

    return (
      <div key={combatant.key} className={styles['combatantCard']}>
        <div className={styles['combatantCardHeader']}>
          <span className={styles['combatantOrdinal']}>
            {side === 'party' ? 'Party' : 'Enemy'} {index + 1}
          </span>
          <button
            type={'button'}
            className={styles['removeButton']}
            onClick={() => removeCombatant(side, combatant.key)}
          >
            Remove
          </button>
        </div>
        <label className={styles['fieldLabel']}>
          Name
          <input
            className={styles['textInput']}
            value={combatant.name}
            onChange={(event) =>
              updateCombatant(side, combatant.key, { name: event.target.value })
            }
          />
        </label>
        <label className={styles['fieldLabel']}>
          Weapon
          <Select
            instanceId={`${side}-weapon-${combatant.key}`}
            styles={customStyles}
            menuPortalTarget={menuPortalTarget}
            value={
              ALL_WEAPON_OPTIONS.find(
                (option) => option.value === combatant.weaponId
              ) || null
            }
            options={ALL_WEAPON_OPTIONS}
            onChange={(option: SingleValue<WeaponOption>) => {
              if (!option) {
                return;
              }

              updateCombatant(side, combatant.key, {
                weaponId: option.value,
              });
            }}
          />
        </label>
        <div className={styles['weaponMeta']}>
          <span>{weaponInfo?.weaponType || 'natural'}</span>
          {weaponInfo?.weaponType === 'melee' && (
            <span>WSF {weaponInfo.speedFactor}</span>
          )}
          {weaponInfo?.weaponType === 'missile' && (
            <span>FR {weaponInfo.fireRate}</span>
          )}
        </div>
        <label className={styles['fieldLabel']} htmlFor={targetSelectId}>
          Targets
        </label>
        <select
          id={targetSelectId}
          className={styles['selectInput']}
          multiple={true}
          value={combatant.targetCombatantKeys.map(String)}
          onChange={(event) =>
            updateCombatant(side, combatant.key, {
              targetCombatantKeys: Array.from(event.target.selectedOptions).map(
                (option) => parseInt(option.value, 10)
              ),
            })
          }
        >
          {opposingCombatants.map((opponent) => (
            <option key={opponent.key} value={opponent.key}>
              {opponent.name || opponent.key}
            </option>
          ))}
        </select>
      </div>
    );
  };

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

          <div className={styles['rosterGrid']}>
            <section className={styles['sidePanel']}>
              <div className={styles['sideHeader']}>
                <h3>Party</h3>
                <button
                  type={'button'}
                  className={styles['addButton']}
                  onClick={() => addCombatant('party')}
                >
                  Add party
                </button>
              </div>
              <div className={styles['combatantList']}>
                {state.party.map((combatant, index) =>
                  renderCombatantCard('party', combatant, index)
                )}
              </div>
            </section>

            <section className={styles['sidePanel']}>
              <div className={styles['sideHeader']}>
                <h3>Enemy</h3>
                <button
                  type={'button'}
                  className={styles['addButton']}
                  onClick={() => addCombatant('enemy')}
                >
                  Add enemy
                </button>
              </div>
              <div className={styles['combatantList']}>
                {state.enemies.map((combatant, index) =>
                  renderCombatantCard('enemy', combatant, index)
                )}
              </div>
            </section>
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
    </div>
  );
};

export default InitiativePlayground;
