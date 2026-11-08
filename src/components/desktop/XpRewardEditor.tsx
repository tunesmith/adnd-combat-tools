import XpRecipients from './XpRecipients';
import { useState } from 'react';
import type { SetStateAction } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { XpReward } from '../../helpers/campaignXpModel';
import type { XpMonster } from '../../tables/monsterExperience';
import {
  newXpReward,
  encounterXpCandidates,
  possessionXpCandidates,
  rewardFromEncounter,
  rewardFromPossession,
  refreshXpEvidence,
  xpEvidenceChanged,
  xpEvidencePartyNames,
} from '../../helpers/campaignXpSources';
import {
  resolveXpReward,
  xpEvidenceDuplicates,
} from '../../helpers/campaignXp';
import { xpDisplay, xpDifferenceDisplay } from '../../helpers/xpArithmetic';
import styles from './xpWorkspace.module.css';
const nullable = (value: string) => value.trim() || null;
export function XpRewardCalculation({ reward }: { reward: XpReward }) {
  try {
    let reviewError = '';
    try {
      resolveXpReward(reward);
    } catch (error) {
      reviewError = error instanceof Error ? error.message : String(error);
    }
    // Display calculations before explanations are complete. These placeholders never leave the view.
    const display = {
      ...reward,
      recipients: reward.recipients.map((r) => ({
        ...r,
        allocationReason: r.allocationReason.trim() || 'Reason needed',
      })),
      ratio: {
        ...reward.ratio,
        reason: reward.ratio.reason.trim() || 'Reason needed',
        recordedReason: reward.ratio.recordedReason.trim() || 'Context needed',
      },
      rawOverride: reward.rawOverride
        ? {
            ...reward.rawOverride,
            reason: reward.rawOverride.reason.trim() || 'Reason needed',
          }
        : null,
    };
    const result = resolveXpReward(display);
    return (
      <div className={styles['calculation']}>
        <h3>Calculation</h3>
        <p>
          <strong>{xpDisplay(result.raw)} raw XP</strong>
          {result.calculatedRaw !== null && reward.rawOverride && (
            <>
              {' '}
              · calculated {xpDisplay(result.calculatedRaw)} · adjustment{' '}
              {xpDifferenceDisplay(result.raw, result.calculatedRaw)} ·
              historical/DM override {reward.rawOverride.amount} (
              {reward.rawOverride.reason})
            </>
          )}{' '}
          · ratio {xpDisplay(result.ratio)}
        </p>
        {result.allocationAdjustment.direction !== 'none' && (
          <p>
            Allocation total {xpDisplay(result.calculatedAllocation)} →{' '}
            {xpDisplay(result.acceptedAllocation)} · recorded adjustment{' '}
            {xpDifferenceDisplay(
              result.acceptedAllocation,
              result.calculatedAllocation
            )}
          </p>
        )}
        {result.difficulty !== null && (
          <p>
            Adjusted difficulty {xpDisplay(result.difficulty)} HD · rules
            proposal{' '}
            {result.proposedRatio === null
              ? 'unknown'
              : xpDisplay(result.proposedRatio)}
          </p>
        )}
        {reward.ratio.recordedProposal !== null && (
          <p>
            Recorded historical proposal {reward.ratio.recordedProposal} ·{' '}
            {reward.ratio.recordedReason}
          </p>
        )}
        {reward.ratio.override !== null && (
          <p>
            Accepted ratio override {reward.ratio.override} ·{' '}
            {reward.ratio.reason}
          </p>
        )}
        {result.monsters.map((m, i) => (
          <p key={i}>
            {reward.input.category === 'monster'
              ? reward.input.monsters[i]?.name
              : ''}{' '}
            · band {m.coefficients.label} · base {m.coefficients.base} + special{' '}
            {m.coefficients.special}/ability + exceptional{' '}
            {m.coefficients.exceptional}/ability + {m.coefficients.perHp}/HP ·
            raw {xpDisplay(m.raw)}
          </p>
        ))}
        <table>
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Calculated share</th>
              <th>Accepted share</th>
            </tr>
          </thead>
          <tbody>
            {result.allocations.map((a) => (
              <tr key={a.characterId}>
                <th>
                  {
                    reward.recipients.find(
                      (r) => r.characterId === a.characterId
                    )?.name
                  }
                </th>
                <td title={a.calculated}>{xpDisplay(a.calculated)}</td>
                <td title={a.accepted}>
                  {xpDisplay(a.accepted)}
                  {reward.recipients
                    .find((r) => r.characterId === a.characterId)
                    ?.allocationReason.trim() && (
                    <small>
                      {
                        reward.recipients.find(
                          (r) => r.characterId === a.characterId
                        )?.allocationReason
                      }
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviewError && <p role="status">{reviewError}</p>}
      </div>
    );
  } catch (error) {
    return (
      <div>
        <p className={styles['muted']}>
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
}
// Defaults apply to editable drafts only, leaving accepted calculation snapshots unchanged.
function defaultDraftRatio(reward: XpReward): XpReward {
  return reward.input.category !== 'monster' &&
    reward.ratio.proposed === null &&
    reward.ratio.override === null
    ? { ...reward, ratio: { ...reward.ratio, proposed: '1' } }
    : reward;
}
export default function XpRewardEditor({
  document,
  reward,
  onSave,
  onDelete,
  onClose,
}: {
  document: CampaignDocument;
  reward: XpReward;
  onSave: (reward: XpReward) => boolean;
  onDelete?: () => boolean;
  onClose: () => void;
}) {
  const [draft, updateDraft] = useState(() =>
      defaultDraftRatio(
        reward.input.category === 'monster' &&
          reward.input.monsters.length === 1 &&
          reward.input.monsters[0]?.name === 'Monster group'
          ? {
              ...reward,
              input: {
                ...reward.input,
                monsters: reward.input.monsters.map((m) => ({
                  ...m,
                  name: reward.title,
                })),
              },
            }
          : reward
      )
    ),
    [error, setError] = useState('');
  const setDraft = (change: SetStateAction<XpReward>) =>
    updateDraft((current) =>
      defaultDraftRatio(typeof change === 'function' ? change(current) : change)
    );
  const [encounterId, setEncounterId] = useState(''),
    [keys, setKeys] = useState<string[]>([]),
    [itemKey, setItemKey] = useState('');
  const candidates = encounterXpCandidates(document, encounterId);
  let items: ReturnType<typeof possessionXpCandidates> = [];
  let sourceError = '';
  if (draft.input.category !== 'monster') {
    try {
      items = possessionXpCandidates(document, draft.origin.sessionId);
    } catch (error) {
      sourceError = error instanceof Error ? error.message : String(error);
    }
  }
  const duplicates = xpEvidenceDuplicates(document, draft);
  function monster(index: number, change: Partial<XpMonster>) {
    setDraft((r) =>
      r.input.category === 'monster'
        ? {
            ...r,
            input: {
              ...r.input,
              monsters: r.input.monsters.map((m, i) =>
                i === index ? { ...m, ...change } : m
              ),
            },
          }
        : r
    );
  }
  const input = draft.input;
  return (
    <div
      className={styles['backdrop']}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-label="XP event review"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <div className={styles['heading']}>
          <h2>XP event</h2>
          <span className={styles['muted']}>
            {
              document.sessions.find((s) => s.id === draft.origin.sessionId)
                ?.label
            }
          </span>
        </div>
        <div className={styles['fields']}>
          <label>
            XP event name
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => {
                const title = e.target.value;
                setDraft({
                  ...draft,
                  title,
                  input:
                    draft.input.category === 'monster' &&
                    draft.input.monsters.length === 1
                      ? {
                          ...draft.input,
                          monsters: draft.input.monsters.map((m) =>
                            m.name.toLowerCase() ===
                              draft.title.toLowerCase() ||
                            m.name === 'Monster group'
                              ? { ...m, name: title }
                              : m
                          ),
                        }
                      : draft.input,
                });
              }}
            />
          </label>
          <label>
            Category
            <select
              value={input.category}
              onChange={(e) => {
                const category = e.target
                  .value as XpReward['input']['category'];
                const nextInput = newXpReward(
                  document,
                  draft.origin.sessionId,
                  draft.id,
                  category
                ).input;
                setDraft({
                  ...draft,
                  input:
                    nextInput.category === 'monster'
                      ? {
                          ...nextInput,
                          monsters: nextInput.monsters.map((m) => ({
                            ...m,
                            name: draft.title,
                          })),
                        }
                      : nextInput,
                });
              }}
            >
              <option value="monster">Monsters</option>
              <option value="money">Money</option>
              <option value="treasure">Treasure</option>
            </select>
          </label>
        </div>
        <details>
          <summary>Copy encounter or possession evidence</summary>
          {sourceError && (
            <p role="alert">
              Possession evidence could not be loaded: {sourceError}. You can
              still enter this reward manually.
            </p>
          )}
          {input.category === 'monster' ? (
            <>
              <label>
                Source encounter
                <select
                  value={encounterId}
                  onChange={(e) => {
                    setEncounterId(e.target.value);
                    setKeys([]);
                  }}
                >
                  <option value="">Choose an encounter…</option>
                  {document.workingCombats
                    .filter((c) => c.sessionId === draft.origin.sessionId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                        {c.removedAt ? ' (removed)' : ''}
                      </option>
                    ))}
                </select>
              </label>
              {candidates.map((c) => (
                <label className={styles['check']} key={c.key}>
                  <input
                    type="checkbox"
                    checked={keys.includes(c.key)}
                    onChange={(e) =>
                      setKeys(
                        e.target.checked
                          ? [...keys, c.key]
                          : keys.filter((k) => k !== c.key)
                      )
                    }
                  />
                  {c.combatant.name || 'Unnamed monster'} · recorded max HP{' '}
                  {c.combatant.maxHp || 'unknown'}
                  {c.captured ? ' · already captured; review duplicate' : ''}
                </label>
              ))}
              <button
                disabled={!keys.length}
                onClick={() => {
                  setDraft(
                    rewardFromEncounter(document, draft, encounterId, keys)
                  );
                  setError('');
                }}
              >
                Copy selected monsters
              </button>
            </>
          ) : (
            <>
              <label>
                Source possession
                <select
                  value={itemKey}
                  onChange={(e) => setItemKey(e.target.value)}
                >
                  <option value="">Choose an item or lot…</option>
                  {items.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name} · {c.holderName}
                      {c.captured
                        ? ' · already captured'
                        : c.possibleRepeat
                        ? ' · possible repeat; review'
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={!itemKey}
                onClick={() =>
                  setDraft(
                    rewardFromPossession(
                      document,
                      draft,
                      draft.origin.sessionId,
                      itemKey
                    )
                  )
                }
              >
                Copy selected possession
              </button>
            </>
          )}
        </details>
        {draft.evidence.kind !== 'manual' && (
          <div className={styles['source']}>
            <strong>{draft.evidence.label}</strong>
            <span> · frozen source</span>
            {xpEvidenceChanged(document, draft) && (
              <strong> · Source changed</strong>
            )}
            <button
              onClick={() => {
                try {
                  setDraft(refreshXpEvidence(document, draft));
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              Refresh and review
            </button>
            {draft.evidence.kind === 'encounter' && (
              <p>
                Review starting HP copied from recorded max HP. Enter actual
                HD/levels; tracker categories and remaining HP are not used as
                substitutes. Map the participating names to campaign recipients
                below. Recorded party candidates:{' '}
                {xpEvidencePartyNames(draft.evidence).join(', ') ||
                  'none recorded'}
                .
              </p>
            )}
          </div>
        )}
        <fieldset>
          <legend>
            {input.category === 'monster'
              ? 'Monster inputs'
              : input.category === 'money'
              ? 'Money'
              : 'Treasure decision'}
          </legend>
          {input.category === 'monster' && (
            <>
              {input.monsters.map((m, index) => (
                <div className={styles['monster']} key={m.id}>
                  <div
                    className={`${styles['fields']} ${styles['monsterFields']}`}
                  >
                    {input.monsters.length > 1 && (
                      <label>
                        Monster name
                        <input
                          value={m.name}
                          onChange={(e) =>
                            monster(index, { name: e.target.value })
                          }
                        />
                      </label>
                    )}
                    <label>
                      Count
                      <input
                        type="number"
                        min={1}
                        value={m.count}
                        onChange={(e) =>
                          monster(index, { count: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      HD / level basis
                      <select
                        value={m.basis}
                        onChange={(e) =>
                          monster(index, {
                            basis: e.target.value as XpMonster['basis'],
                          })
                        }
                      >
                        <option value="hit-dice">Actual hit dice</option>
                        <option value="level">Actual character level</option>
                      </select>
                    </label>
                    <label>
                      Actual HD / level
                      <input
                        placeholder="Unknown"
                        value={m.hitDice ?? ''}
                        onChange={(e) =>
                          monster(index, { hitDice: nullable(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      HP addition to HD
                      <input
                        type="number"
                        value={m.hpAdjustment}
                        onChange={(e) =>
                          monster(index, {
                            hpAdjustment: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Total starting HP
                      <input
                        placeholder="Unknown"
                        value={m.startingHp ?? ''}
                        onChange={(e) =>
                          monster(index, {
                            startingHp: nullable(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Special abilities each
                      <input
                        type="number"
                        min={0}
                        value={m.special}
                        onChange={(e) =>
                          monster(index, { special: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Exceptional abilities each
                      <input
                        type="number"
                        min={0}
                        value={m.exceptional}
                        onChange={(e) =>
                          monster(index, {
                            exceptional: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  {input.monsters.length > 1 && (
                    <button
                      onClick={() =>
                        setDraft({
                          ...draft,
                          input: {
                            ...input,
                            monsters: input.monsters.filter(
                              (_, i) => i !== index
                            ),
                          },
                        })
                      }
                    >
                      Remove this monster row
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  const fresh = newXpReward(
                    document,
                    draft.origin.sessionId,
                    crypto.randomUUID(),
                    'monster'
                  ).input;
                  if (fresh.category === 'monster')
                    setDraft({
                      ...draft,
                      input: {
                        ...input,
                        monsters: [...input.monsters, ...fresh.monsters],
                      },
                    });
                }}
              >
                + Monster row
              </button>
            </>
          )}
          {input.category === 'money' && (
            <label>
              GP equivalent
              <input
                value={input.gp ?? ''}
                placeholder="Unknown"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    input: { ...input, gp: nullable(e.target.value) },
                  })
                }
              />
            </label>
          )}
          {input.category === 'treasure' && (
            <div className={styles['fields']}>
              <label>
                Disposition
                <select
                  value={input.disposition}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      input: {
                        ...input,
                        disposition: e.target.value as typeof input.disposition,
                      },
                    })
                  }
                >
                  <option value="defer">Defer</option>
                  <option value="keep">Keep</option>
                  <option value="sell">Sell</option>
                </select>
              </label>
              <label>
                Retained-item XP
                <input
                  value={input.retainedXp ?? ''}
                  placeholder="Unknown"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      input: { ...input, retainedXp: nullable(e.target.value) },
                    })
                  }
                />
              </label>
              <label>
                Sale value (GP)
                <input
                  value={input.proceeds ?? input.marketGp ?? ''}
                  placeholder="Unknown"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      input: {
                        ...input,
                        proceeds: nullable(e.target.value),
                        marketGp: null,
                      },
                    })
                  }
                />
              </label>
            </div>
          )}
        </fieldset>
        <XpRecipients document={document} reward={draft} onChange={setDraft} />
        {input.category === 'monster' &&
          input.monsters.some((m) => m.bandOverride) && (
            <p className={styles['muted']}>
              Recorded band adjustments:{' '}
              {input.monsters
                .filter((m) => m.bandOverride)
                .map((m) => `${m.name}: ${m.bandOverride} (${m.bandReason})`)
                .join('; ')}
            </p>
          )}
        {draft.ratio.recordedProposal !== null && (
          <p className={styles['muted']}>
            Recorded historical ratio: {draft.ratio.recordedProposal} ·{' '}
            {draft.ratio.recordedReason}
          </p>
        )}
        {duplicates.length > 0 && (
          <div className={styles['warning']}>
            <p>
              Possible repeated evidence:{' '}
              {duplicates.map((r) => r.title).join(', ')}.
            </p>
            <label>
              Why this is a distinct XP event
              <input
                value={draft.distinctReason}
                onChange={(e) =>
                  setDraft({ ...draft, distinctReason: e.target.value })
                }
              />
            </label>
          </div>
        )}
        <label>
          Notes
          <textarea
            aria-label="XP event notes"
            rows={2}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          {onDelete && (
            <button
              className={styles['deleteEvent']}
              onClick={() => {
                try {
                  if (onDelete()) onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              Delete event
            </button>
          )}
          <button onClick={onClose}>Cancel</button>
          <button
            className={styles['primary']}
            onClick={() => {
              try {
                if (onSave(draft)) onClose();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Save XP event
          </button>
        </div>
      </section>
    </div>
  );
}
