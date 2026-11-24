import { profileLabel } from '../../helpers/campaignParty';
import { Fragment, useState, type ReactNode } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type {
  PartyProfile,
  RosterCharacter,
  SaveReminder,
} from '../../helpers/campaignPartyModel';
import {
  calculatedSaves,
  emptyProfile,
  profilesInSession,
  reorderPartyCharacter,
  updatePartyProfile,
} from '../../helpers/campaignParty';
import { saveCategories, saveNoteLabels } from '../../tables/savingThrows';
import layout from './partyReference.module.css';
import PartyEncumbrance from './PartyEncumbrance';
import ProfileDialog from './ProfileDialog';
import SessionProfileTable from './SessionProfileTable';
import SessionXpReference from './SessionXpReference';
import styles from './campaignWorkspace.module.css';

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
      {view === 'session' ? (
        <>
          <SessionProfileTable
            document={document}
            profiles={rows}
            onAdd={
              sessionId
                ? () => {
                    const id = crypto.randomUUID();
                    setEditor({
                      profile: emptyProfile(sessionId, id),
                      character: { id, name: '', player: '', notes: '' },
                    });
                  }
                : undefined
            }
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
        <div className={layout['resources']}>
          <section className={layout['savesSection']}>
            <header>
              <h2>Saving throws</h2>
            </header>
            <div
              className={layout['scroll']}
              role="region"
              aria-label="Saving throws table"
              tabIndex={0}
            >
              <table className={layout['saves']} aria-label="Saving throws">
                <thead>
                  <tr>
                    <th scope="col">Character</th>
                    {saveCategories.map(([label, full]) => (
                      <th key={label} scope="col" title={full}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const character = document.party?.roster.find(
                      (c) => c.id === p.characterId
                    );
                    if (!character) return null;
                    const saves = calculatedSaves(p);
                    const targets = saves ?? p.overrides;
                    return (
                      <Fragment key={p.characterId}>
                        <tr>
                          <th scope="row">
                            <div className={layout['character']}>
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
                                              enabled:
                                                !current.adjustment.enabled,
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
                                !saves
                                  ? 'Manual saves'
                                  : p.saveBasis !== 'printed'
                                  ? p.saveBasis + ' matrix'
                                  : '',
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </small>
                          </th>
                          {saveCategories.map(([label], i) => (
                            <td key={label}>{targets[i] ?? '—'}</td>
                          ))}
                        </tr>
                        {!!p.saveReminders?.length && (
                          <tr>
                            <td colSpan={6} className={layout['reminderCell']}>
                              <ReminderGroups
                                name={character.name}
                                rows={p.saveReminders}
                              />
                            </td>
                          </tr>
                        )}
                        {p.saveNotes.some((n) => n.trim()) && (
                          <tr className={layout['notes']}>
                            <td colSpan={6}>
                              {p.saveNotes.map(
                                (note, i) =>
                                  note.trim() && (
                                    <div key={i}>
                                      <b>
                                        {saveNoteLabels[i]?.replace(
                                          ' notes',
                                          ''
                                        )}
                                      </b>{' '}
                                      {note}
                                    </div>
                                  )
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <PartyEncumbrance
            document={document}
            sessionId={sessionId}
            profiles={rows}
          />
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

function ReminderGroups({
  name,
  rows,
}: {
  name: string;
  rows: SaveReminder[];
}) {
  const bonuses: ReactNode[] = [];
  const instructions: ReactNode[] = [];
  for (const row of rows) {
    const source = row.source && <small>{row.source}</small>;
    if ('instruction' in row) {
      instructions.push(
        <li key={row.id}>
          <span>{row.instruction}</span>
          {source}
        </li>
      );
    } else {
      bonuses.push(
        <li key={row.id}>
          <b>{row.bonus}</b>
          <span>{row.appliesWhen}</span>
          {source}
        </li>
      );
    }
  }
  return (
    <>
      {bonuses.length > 0 && (
        <ul
          className={layout['reminderList']}
          aria-label={`${name} — add to the roll`}
        >
          {bonuses}
        </ul>
      )}
      {instructions.length > 0 && (
        <>
          <div className={layout['beforeHeading']}>Before the roll</div>
          <ul
            className={layout['beforeList']}
            aria-label={`${name} — before the roll`}
          >
            {instructions}
          </ul>
        </>
      )}
    </>
  );
}
