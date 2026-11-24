import ProfileClassesFields from './ProfileClassesFields';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  emptyProfileReference,
  partyProfileSchema,
  rosterCharacterSchema,
} from '../../helpers/campaignPartyModel';
import type {
  PartyProfile,
  RosterCharacter,
} from '../../helpers/campaignPartyModel';
import {
  profileClassLabel as classLabel,
  calculatedSaves,
  profileLabel,
  effectiveLevel,
  emptyProfile,
  copyPartyProfile,
  priorProfileChoices,
  rosterEligibleForSession,
  pendingXpRecipientCount,
  removePartyProfile,
  profilesInSession,
  updatePartyProfile,
} from '../../helpers/campaignParty';
import { saveCategories, saveNoteLabels } from '../../tables/savingThrows';
import {
  partyGear,
  armorChoices,
  armorItemName,
} from '../../helpers/partyEncumbrance';
import ProfileReferenceFields from './ProfileReferenceFields';
import SaveReminderEditor from './SaveReminderEditor';
import AutoHeightTextarea from '../tracker/AutoHeightTextarea';
import styles from './campaignWorkspace.module.css';

export default function ProfileDialog({
  document,
  profile,
  character,
  onChange,
  onClose,
}: {
  document: CampaignDocument;
  profile: PartyProfile;
  character: RosterCharacter;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(profile),
    [identity, setIdentity] = useState(character);
  const [profileSource, setProfileSource] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLElement>(null);
  const trigger = useRef(window.document.activeElement);
  useEffect(() => {
    const focusTarget = trigger.current;
    return () => {
      if (focusTarget instanceof HTMLElement && focusTarget.isConnected)
        focusTarget.focus();
    };
  }, []);
  const manualSaves = calculatedSaves(draft) === null;
  const sessionProfiles = profilesInSession(document, profile.sessionId);
  const saved = sessionProfiles.some(
    (p) => p.characterId === profile.characterId
  );
  const existing = (document.party?.roster || []).filter(
    (c) =>
      rosterEligibleForSession(document, c, profile.sessionId) &&
      !sessionProfiles.some((p) => p.characterId === c.id)
  );
  const sources = saved
    ? []
    : priorProfileChoices(document, profile.sessionId, identity.id);
  const xpPending = pendingXpRecipientCount(document, identity.id);
  const sessionXpPending = pendingXpRecipientCount(
    document,
    identity.id,
    profile.sessionId
  );

  function chooseProfile(source?: PartyProfile, id = identity.id) {
    setProfileSource(source?.sessionId ?? '');
    setDraft(
      source
        ? copyPartyProfile(source, profile.sessionId)
        : emptyProfile(profile.sessionId, id)
    );
  }
  const patch = (changes: Partial<PartyProfile>) =>
    setDraft((p) => ({ ...p, ...changes }));
  const holder = useMemo(
    () => partyGear(document, profile.sessionId).holders.get(identity.id),
    [document, profile.sessionId, identity.id]
  );
  const choices = armorChoices(holder);
  const worn = draft.reference?.wornArmor;
  const chosen = choices.find((item) => item.id === worn?.itemId);
  const previous =
    worn &&
    !chosen &&
    holder?.inventory.find((item) => item.id === worn.itemId);
  function setArmor(
    value: NonNullable<PartyProfile['reference']>['wornArmor']
  ) {
    patch({
      reference: {
        ...(draft.reference ?? emptyProfileReference()),
        wornArmor: value,
      },
    });
  }
  function save() {
    const parsedProfile = partyProfileSchema.safeParse(draft),
      parsedCharacter = rosterCharacterSchema.safeParse(identity);
    if (!parsedProfile.success || !parsedCharacter.success) {
      setError(
        !parsedProfile.success
          ? parsedProfile.error.issues[0]?.message || 'Check profile values.'
          : 'Enter a character name.'
      );
      return;
    }
    if (
      onChange((doc) =>
        updatePartyProfile(doc, parsedProfile.data, parsedCharacter.data)
      )
    )
      onClose();
  }
  return (
    <div className={styles['dialogShade']}>
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Character profile"
        className={`${styles['continuationDialog']} ${styles['profileDialog']}`}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            const controls = Array.from(
              dialog.current?.querySelectorAll<HTMLElement>(
                'input,select,textarea,button,summary'
              ) || []
            ).filter(
              (element) =>
                !element.hasAttribute('disabled') &&
                element.getClientRects().length > 0
            );
            const first = controls[0],
              last = controls[controls.length - 1];
            if (e.shiftKey && window.document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && window.document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
          if (e.key === 'Escape' && !e.defaultPrevented) {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }
        }}
      >
        <h2>Character profile</h2>
        {!saved && existing.length > 0 && (
          <label>
            Existing character{' '}
            <select
              value={
                existing.some((c) => c.id === identity.id) ? identity.id : ''
              }
              onChange={(e) => {
                const chosen =
                  existing.find((c) => c.id === e.target.value) || character;
                setIdentity(chosen);
                chooseProfile(
                  priorProfileChoices(
                    document,
                    profile.sessionId,
                    chosen.id
                  )[0],
                  chosen.id
                );
              }}
            >
              <option value="">New identity</option>
              {existing.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {i + 1}. {c.name}
                  {c.player ? ` · ${c.player}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        {sources.length > 0 && (
          <label>
            Starting stats
            <select
              value={profileSource}
              onChange={(e) =>
                chooseProfile(
                  sources.find((p) => p.sessionId === e.target.value)
                )
              }
            >
              {sources.map((source) => (
                <option key={source.sessionId} value={source.sessionId}>
                  {source.sessionId === profile.sessionId
                    ? 'Restore saved profile from '
                    : 'Copy profile from '}
                  {
                    document.sessions.find((s) => s.id === source.sessionId)
                      ?.label
                  }
                </option>
              ))}
              <option value="">Blank profile</option>
            </select>
          </label>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className={styles['profileFields']}>
            <label>
              Character name
              <input
                autoFocus
                required
                maxLength={1000}
                value={identity.name}
                onChange={(e) =>
                  setIdentity({ ...identity, name: e.target.value })
                }
              />
            </label>
            <label>
              Player (optional)
              <input
                maxLength={1000}
                value={identity.player}
                onChange={(e) =>
                  setIdentity({ ...identity, player: e.target.value })
                }
              />
            </label>
          </div>
          <ProfileClassesFields value={draft} onChange={patch} />
          <div className={styles['profileFields']}>
            <label>
              Worn armor
              <select
                aria-label="Worn armor"
                value={
                  worn === null ? 'none' : worn ? 'item:' + worn.itemId : ''
                }
                onChange={(e) => {
                  const item = choices.find(
                    (i) => 'item:' + i.id === e.target.value
                  );
                  setArmor(
                    item
                      ? { itemId: item.id }
                      : e.target.value === 'none'
                      ? null
                      : undefined
                  );
                }}
              >
                <option value="">Unknown</option>
                <option value="none">No worn armor</option>
                {worn && !chosen && (
                  <option value={'item:' + worn.itemId} disabled>
                    {previous
                      ? `${armorItemName(previous)} (unavailable)`
                      : 'Previously worn item unavailable'}
                  </option>
                )}
                {choices.map((item) => (
                  <option key={item.id} value={'item:' + item.id}>
                    {armorItemName(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ProfileReferenceFields
            value={draft.reference}
            showXpBonus={!draft.classes}
            onChange={(reference) => patch({ reference })}
          />
          <label className={styles['sessionNameField']}>
            Temporary +1 level effect
            <input
              maxLength={1000}
              value={draft.adjustment?.name || ''}
              onChange={(e) =>
                patch({
                  adjustment: e.target.value
                    ? {
                        name: e.target.value,
                        enabled: draft.adjustment?.enabled ?? false,
                        ...(draft.classes
                          ? {
                              classId:
                                draft.adjustment?.classId ??
                                draft.classes[0]?.id,
                            }
                          : {}),
                      }
                    : null,
                })
              }
            />
          </label>
          {draft.adjustment && draft.classes && (
            <label className={styles['sessionNameField']}>
              Affected class
              <select
                aria-label="Temporary effect class"
                value={draft.adjustment.classId}
                onChange={(e) => {
                  if (draft.adjustment)
                    patch({
                      adjustment: {
                        ...draft.adjustment,
                        classId: e.target.value,
                      },
                    });
                }}
              >
                {draft.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {classLabel(c.characterClass)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {draft.adjustment && (
            <label className={styles['continuationChoice']}>
              <input
                type="checkbox"
                checked={draft.adjustment.enabled}
                onChange={(e) => {
                  if (draft.adjustment)
                    patch({
                      adjustment: {
                        ...draft.adjustment,
                        enabled: e.target.checked,
                      },
                    });
                }}
              />
              Enable +1 level
            </label>
          )}
          {draft.characterClass === 'bard' && (
            <div className={styles['profileFields']}>
              <label>
                Retained fighter level
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={draft.retainedFighter ?? ''}
                  onChange={(e) =>
                    patch({
                      retainedFighter:
                        e.target.value === '' ? null : e.target.valueAsNumber,
                    })
                  }
                />
              </label>
              <label>
                Retained thief level
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={draft.retainedThief ?? ''}
                  onChange={(e) =>
                    patch({
                      retainedThief:
                        e.target.value === '' ? null : e.target.valueAsNumber,
                    })
                  }
                />
              </label>
            </div>
          )}
          <details>
            <summary>Rules basis</summary>
            <label>
              Saving-throw basis{' '}
              <select
                value={draft.saveBasis}
                onChange={(e) => {
                  const choice = partyProfileSchema.shape.saveBasis.safeParse(
                    e.target.value
                  );
                  if (choice.success) patch({ saveBasis: choice.data });
                }}
              >
                <option value="printed">Printed class rules</option>
                <option value="manual">Manual targets</option>
                {(['cleric', 'fighter', 'magic-user', 'thief'] as const).map(
                  (b) => (
                    <option key={b} value={b}>
                      {classLabel(b)} matrix
                    </option>
                  )
                )}
              </select>
            </label>
            <label>
              When copying to combat{' '}
              <select
                value={draft.combatBasis}
                onChange={(e) =>
                  patch({
                    combatBasis:
                      e.target.value === 'manual' ? 'manual' : 'class',
                  })
                }
              >
                <option value="class">Copy supported class and level</option>
                <option value="manual">Copy name only</option>
              </select>
            </label>
          </details>
          {manualSaves && (
            <fieldset className={styles['manualTargets']}>
              <legend>Manual saving throws</legend>
              <div className={styles['profileFields']}>
                {saveCategories.map(([label], i) => (
                  <label key={label}>
                    {label}
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={draft.overrides[i] ?? ''}
                      onChange={(e) => {
                        const targets: [...PartyProfile['overrides']] = [
                          ...draft.overrides,
                        ];
                        targets[i] =
                          e.target.value === '' ? null : e.target.valueAsNumber;
                        patch({ overrides: targets });
                      }}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <SaveReminderEditor
            rows={draft.saveReminders ?? []}
            onChange={(saveReminders) => patch({ saveReminders })}
          />
          {(profile.saveNotes.some(Boolean) ||
            draft.saveNotes.some(Boolean)) && (
            <fieldset className={styles['profileGroup']}>
              <legend>Original saving-throw notes</legend>
              {saveNoteLabels.map((label, i) => (
                <label key={label}>
                  {label}
                  <AutoHeightTextarea
                    aria-label={label}
                    value={draft.saveNotes[i] ?? ''}
                    rows={1}
                    maxLength={100000}
                    onChange={(text) => {
                      const saveNotes: PartyProfile['saveNotes'] = [
                        ...draft.saveNotes,
                      ];
                      saveNotes[i] = text;
                      patch({ saveNotes });
                    }}
                  />
                </label>
              ))}
            </fieldset>
          )}
          <details>
            <summary>Character notes</summary>
            <label className={styles['generalNotes']}>
              General notes
              <AutoHeightTextarea
                rows={3}
                maxLength={100000}
                value={identity.notes}
                onChange={(notes) => setIdentity({ ...identity, notes })}
              />
            </label>
          </details>
          <details>
            <summary>Roster settings</summary>
            <label className={styles['continuationChoice']}>
              <input
                type="checkbox"
                checked={identity.earnsXp !== false}
                onChange={(e) =>
                  setIdentity({ ...identity, earnsXp: e.target.checked })
                }
              />
              <span>Earns XP</span>
            </label>
            {identity.earnsXp === false && xpPending > 0 && (
              <p role="status">
                Existing shares remain available on {xpPending} pending XP{' '}
                {xpPending === 1 ? 'event' : 'events'}. Settle them in an award
                draft.
              </p>
            )}
            {(saved || existing.some((c) => c.id === identity.id)) &&
              (identity.lastEligibleSessionId ? (
                <>
                  <label>
                    Last eligible session
                    <select
                      value={identity.lastEligibleSessionId}
                      onChange={(e) =>
                        setIdentity({
                          ...identity,
                          lastEligibleSessionId: e.target.value,
                        })
                      }
                    >
                      {document.sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <small>
                    This session is included. Later awards automatically forfeit
                    outstanding shares. Confirmed XP and existing profiles are
                    retained.
                  </small>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setIdentity({
                      ...identity,
                      lastEligibleSessionId: profile.sessionId,
                    })
                  }
                >
                  Retire from roster
                </button>
              ))}
          </details>
          {error && <p role="alert">{error}</p>}
          <footer className={styles['sessionDialogFooter']}>
            <span>
              {draft.classes ? (
                profileLabel(draft)
              ) : (
                <>
                  Base {draft.baseLevel} · Effective {effectiveLevel(draft)}
                </>
              )}
            </span>
            {saved && (
              <button
                type="button"
                title={
                  sessionXpPending
                    ? 'Earned XP shares remain pending; settle them in an award draft.'
                    : undefined
                }
                onClick={() => {
                  if (
                    onChange((doc) =>
                      removePartyProfile(
                        doc,
                        profile.sessionId,
                        profile.characterId
                      )
                    )
                  )
                    onClose();
                }}
              >
                Remove from session
              </button>
            )}
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Save profile</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
