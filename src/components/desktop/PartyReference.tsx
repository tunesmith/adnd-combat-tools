import { profileLabel } from '../../helpers/campaignParty';
import { useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type {
  PartyProfile,
  RosterCharacter,
} from '../../helpers/campaignPartyModel';
import {
  calculatedSaves,
  emptyProfile,
  profilesInSession,
  reorderPartyCharacter,
  updatePartyProfile,
} from '../../helpers/campaignParty';
import { saveCategories } from '../../tables/savingThrows';
import AutoHeightTextarea from '../tracker/AutoHeightTextarea';
import ProfileDialog from './ProfileDialog';
import SessionProfileTable from './SessionProfileTable';
import SessionXpReference from './SessionXpReference';
import styles from './campaignWorkspace.module.css';

const notes = ['Dodging notes', 'Fire/lightning notes', 'Other notes'] as const;

export default function PartyReference({
  document,
  sessionId,
  onChange,
  view = 'saves',
}: {
  view?: 'session' | 'saves';
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
      <div
        className={
          view === 'session'
            ? styles['profileActions']
            : styles['referenceHeading']
        }
      >
        {view === 'saves' && <h2>Saving throws</h2>}
        {view === 'session' && (
          <button
            disabled={!sessionId}
            onClick={(event) => {
              event.currentTarget.focus();
              const id = crypto.randomUUID();
              setEditor({
                profile: emptyProfile(sessionId, id),
                character: { id, name: '', player: '', notes: '' },
              });
            }}
          >
            + Character
          </button>
        )}
      </div>
      {view === 'session' ? (
        <>
          <SessionProfileTable
            document={document}
            profiles={rows}
            onReorder={(fromId, targetId) =>
              onChange((doc) =>
                reorderPartyCharacter(doc, sessionId, fromId, targetId)
              )
            }
            onEdit={(profile, character) => setEditor({ profile, character })}
            onToggle={(characterId) =>
              update(characterId, (p) => ({
                ...p,
                adjustment: p.adjustment
                  ? { ...p.adjustment, enabled: !p.adjustment.enabled }
                  : null,
              }))
            }
          />
          <SessionXpReference
            document={document}
            sessionId={sessionId}
            profiles={rows}
          />
        </>
      ) : !rows.length ? (
        <p>
          {sessionId
            ? 'Add characters on Session to see their saving throws.'
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
                return (
                  <tr key={p.characterId}>
                    <th scope="row">
                      <div className={styles['referenceCharacter']}>
                        <button
                          className={styles['sessionName']}
                          onClick={(event) => {
                            event.currentTarget.focus();
                            setEditor({ profile: p, character });
                          }}
                        >
                          {character.name}
                        </button>
                        {p.adjustment && (
                          <button
                            className={styles['sessionEffect']}
                            title={`${p.adjustment.name} +1 · ${
                              p.adjustment.enabled ? 'On' : 'Off'
                            } · Base ${p.baseLevel}`}
                            aria-label={`${character.name} ${p.adjustment.name} +1`}
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
                            +1
                          </button>
                        )}
                      </div>
                      <small>
                        {[
                          character.player,
                          profileLabel(p),
                          !saves ? 'Manual saves' : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
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
