import { useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  partyClasses,
  partyProfileSchema,
  rosterCharacterSchema,
} from '../../helpers/campaignPartyModel';
import type {
  PartyProfile,
  RosterCharacter,
} from '../../helpers/campaignPartyModel';
import {
  calculatedSaves,
  effectiveLevel,
  emptyProfile,
  profilesInSession,
  updatePartyProfile,
} from '../../helpers/campaignParty';
import { saveCategories } from '../../tables/savingThrows';
import AutoHeightTextarea from '../tracker/AutoHeightTextarea';
import styles from './campaignWorkspace.module.css';

const notes = ['Dodging notes', 'Fire/lightning notes', 'Other notes'] as const;
const classLabel = (value: string) =>
  value === 'manual'
    ? 'Manual / creature'
    : value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');

function ProfileDialog({
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
  const [error, setError] = useState('');
  const manualSaves = calculatedSaves(draft) === null;
  const saved = document.party?.profiles.some(
    (p) =>
      p.sessionId === profile.sessionId && p.characterId === profile.characterId
  );
  const existing = (document.party?.roster || []).filter(
    (c) =>
      !profilesInSession(document, profile.sessionId).some(
        (p) => p.characterId === c.id
      )
  );
  const patch = (changes: Partial<PartyProfile>) =>
    setDraft((p) => ({ ...p, ...changes }));
  function save() {
    const parsedProfile = partyProfileSchema.safeParse(draft),
      parsedCharacter = rosterCharacterSchema.safeParse(identity);
    if (!parsedProfile.success || !parsedCharacter.success) {
      setError('Enter a character name and valid levels or save targets.');
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
        role="dialog"
        aria-modal="true"
        aria-label="Character profile"
        className={styles['continuationDialog']}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
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
                setDraft(emptyProfile(profile.sessionId, chosen.id));
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
            <label>
              Class
              <select
                value={draft.characterClass}
                onChange={(e) => {
                  const chosen = partyClasses.find((c) => c === e.target.value);
                  if (chosen) patch({ characterClass: chosen });
                }}
              >
                {partyClasses.map((c) => (
                  <option key={c} value={c}>
                    {classLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Base level
              <input
                type="number"
                required
                min={0}
                max={99}
                value={Number.isNaN(draft.baseLevel) ? '' : draft.baseLevel}
                onChange={(e) => patch({ baseLevel: e.target.valueAsNumber })}
              />
            </label>
          </div>
          <label className={styles['continuationChoice']}>
            <input
              type="checkbox"
              checked={draft.participating}
              onChange={(e) => patch({ participating: e.target.checked })}
            />
            Participating this session
          </label>
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
                      }
                    : null,
                })
              }
            />
          </label>
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
          <details>
            <summary>Character notes</summary>
            <label>
              General notes
              <textarea
                rows={3}
                maxLength={100000}
                value={identity.notes}
                onChange={(e) =>
                  setIdentity({ ...identity, notes: e.target.value })
                }
              />
            </label>
          </details>
          {error && <p role="alert">{error}</p>}
          <footer className={styles['sessionDialogFooter']}>
            <span>
              Base {draft.baseLevel} · Effective {effectiveLevel(draft)}
            </span>
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

export default function PartyReference({
  document,
  sessionId,
  onChange,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
}) {
  const [editor, setEditor] = useState<{
    profile: PartyProfile;
    character: RosterCharacter;
  }>();
  const rows = profilesInSession(document, sessionId);
  function update(
    characterId: string,
    change: (profile: PartyProfile) => PartyProfile
  ) {
    onChange((doc) => {
      const profile = profilesInSession(doc, sessionId).find(
        (p) => p.characterId === characterId
      );
      if (!profile) throw new Error('Party profile changed.');
      return updatePartyProfile(doc, change(profile));
    });
  }
  return (
    <>
      <div className={styles['viewHeading']}>
        <h2>Party Reference</h2>
        <button
          disabled={!sessionId}
          onClick={() => {
            const id = crypto.randomUUID();
            setEditor({
              profile: emptyProfile(sessionId, id),
              character: { id, name: '', player: '', notes: '' },
            });
          }}
        >
          + Character
        </button>
      </div>
      {!rows.length ? (
        <p>
          {sessionId
            ? 'Add a character to see saving throws for this session.'
            : 'Select a session first.'}
        </p>
      ) : (
        <div className={styles['partyTableWrap']}>
          <table className={styles['partyTable']}>
            <thead>
              <tr>
                <th scope="col">Character</th>
                {saveCategories.map(([label, full]) => (
                  <th
                    key={label}
                    scope="col"
                    title={full}
                    className={styles['saveTarget']}
                  >
                    {label}
                  </th>
                ))}
                {notes.map((label) => (
                  <th key={label} scope="col" className={styles['saveNote']}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, index) => {
                const character = document.party?.roster.find(
                  (c) => c.id === p.characterId
                );
                if (!character) return null;
                const saves = calculatedSaves(p);
                const targets = saves ?? p.overrides;
                const level = effectiveLevel(p);
                return (
                  <tr key={p.characterId}>
                    <th scope="row">
                      <button
                        className={styles['partyName']}
                        onClick={() => setEditor({ profile: p, character })}
                      >
                        {character.name}
                      </button>
                      {character.player && <small>{character.player}</small>}
                      <small>
                        {classLabel(p.characterClass)} · Level {p.baseLevel}
                        {level !== p.baseLevel && ` → ${level}`}
                      </small>
                      {!saves && <small>Manual saves</small>}
                      {!p.participating && <small>Not participating</small>}
                      {p.adjustment && (
                        <button
                          className={styles['effectToggle']}
                          aria-pressed={p.adjustment.enabled}
                          onClick={() =>
                            update(p.characterId, (current) =>
                              current.adjustment
                                ? {
                                    ...current,
                                    adjustment: {
                                      ...current.adjustment,
                                      enabled: !current.adjustment.enabled,
                                    },
                                  }
                                : current
                            )
                          }
                        >
                          {p.adjustment.name} +1 ·{' '}
                          {p.adjustment.enabled ? 'On' : 'Off'}
                        </button>
                      )}
                    </th>
                    {saveCategories.map(([label], i) => (
                      <td key={label} className={styles['saveTarget']}>
                        {targets[i] ?? '—'}
                      </td>
                    ))}
                    {notes.map((label, i) => (
                      <td key={label} className={styles['saveNote']}>
                        <AutoHeightTextarea
                          className={styles['saveNoteEditor']}
                          aria-label={`${index + 1}. ${
                            character.name
                          } ${label}`}
                          cols={1}
                          maxLength={100000}
                          value={p.saveNotes[i] ?? ''}
                          onChange={(value) => {
                            update(p.characterId, (current) => {
                              const saveNotes: [...PartyProfile['saveNotes']] =
                                [...current.saveNotes];
                              saveNotes[i] = value;
                              return { ...current, saveNotes };
                            });
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {editor && editor.profile.sessionId === sessionId && (
        <ProfileDialog
          document={document}
          profile={editor.profile}
          character={editor.character}
          onChange={onChange}
          onClose={() => setEditor(undefined)}
        />
      )}
    </>
  );
}
