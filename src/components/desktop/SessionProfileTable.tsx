import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type {
  PartyProfile,
  RosterCharacter,
} from '../../helpers/campaignPartyModel';
import { effectiveLevel, profileClassLabel } from '../../helpers/campaignParty';
import styles from './campaignWorkspace.module.css';

const recorded = (value: number | null | undefined) => value ?? '—';
const signed = (value: number | null | undefined, percent = false) =>
  value == null ? '—' : `${value > 0 ? '+' : ''}${value}${percent ? '%' : ''}`;

export default function SessionProfileTable({
  document,
  profiles,
  onEdit,
  onToggle,
  onReorder,
}: {
  document: CampaignDocument;
  profiles: PartyProfile[];
  onEdit: (profile: PartyProfile, character: RosterCharacter) => void;
  onToggle: (characterId: string) => void;
  onReorder?: (fromId: string, targetId: string) => void;
}) {
  const draggedCharacter = useRef<{
    characterId: string;
    campaignId: string;
    sessionId: string;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const finishDrag = () => {
    draggedCharacter.current = null;
    setDropTarget(null);
  };
  const canDrop = (profile: PartyProfile) => {
    const source = draggedCharacter.current;
    return (
      !!onReorder &&
      source?.campaignId === document.id &&
      source.sessionId === profile.sessionId &&
      source.characterId !== profile.characterId
    );
  };
  return (
    <div
      className={styles['sessionTableWrap']}
      role="region"
      aria-label="Session character reference"
      tabIndex={0}
    >
      <table className={styles['sessionTable']} aria-label="Session characters">
        <thead>
          <tr>
            <th scope="col">Character / player</th>
            <th scope="col">Race / alignment</th>
            <th scope="col">Class</th>
            <th scope="col">Lv</th>
            <th scope="col">Max HP</th>
            {['STR', 'INT', 'WIS', 'DEX', 'CON', 'CHA'].map((label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ))}
            <th scope="col">
              Melee
              <br />
              hit / dmg
            </th>
            <th scope="col" title="Missile-hit reference bonus">
              Missile
            </th>
            <th scope="col" title="Reaction bonus percentage">
              Reaction
            </th>
            <th
              scope="col"
              title="XP bonus percentage"
              aria-label="XP bonus percentage"
            >
              XP bonus
            </th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => {
            const character = document.party?.roster.find(
              (c) => c.id === profile.characterId
            );
            if (!character) return null;
            const reference = profile.reference;
            const attributes = reference?.attributes;
            const strength = attributes?.strength;
            const bonuses = reference?.bonuses;
            const level = effectiveLevel(profile);
            const details = [
              character.player,
              reference?.gender,
              reference?.age == null ? '' : `${reference.age} yrs`,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <tr
                key={profile.characterId}
                className={
                  dropTarget === profile.characterId && canDrop(profile)
                    ? styles[
                        profiles.findIndex(
                          (p) =>
                            p.characterId ===
                            draggedCharacter.current?.characterId
                        ) > profiles.indexOf(profile)
                          ? 'profileDropBefore'
                          : 'profileDropAfter'
                      ]
                    : undefined
                }
                onDragStart={(event) => {
                  if (!onReorder || profiles.length < 2) {
                    event.preventDefault();
                    return;
                  }
                  draggedCharacter.current = {
                    characterId: profile.characterId,
                    campaignId: document.id,
                    sessionId: profile.sessionId,
                  };
                  event.dataTransfer.setData(
                    'application/x-adnd-party-character',
                    profile.characterId
                  );
                  event.dataTransfer.setData('text/plain', character.name);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  if (canDrop(profile)) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDropTarget(profile.characterId);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const source = draggedCharacter.current;
                  if (
                    canDrop(profile) &&
                    source &&
                    event.dataTransfer.getData(
                      'application/x-adnd-party-character'
                    ) === source.characterId
                  )
                    onReorder?.(source.characterId, profile.characterId);
                  finishDrag();
                }}
                onDragEnd={finishDrag}
              >
                <th scope="row">
                  <button
                    className={styles['sessionName']}
                    type="button"
                    draggable={!!onReorder && profiles.length > 1}
                    title={
                      onReorder ? 'Drag to reorder; click to edit' : undefined
                    }
                    onKeyDown={(event) => {
                      if (!onReorder || !event.altKey || !event.shiftKey)
                        return;
                      const direction =
                        event.key === 'ArrowUp'
                          ? -1
                          : event.key === 'ArrowDown'
                          ? 1
                          : 0;
                      const target =
                        profiles[profiles.indexOf(profile) + direction];
                      if (direction && target) {
                        event.preventDefault();
                        onReorder(profile.characterId, target.characterId);
                      }
                    }}
                    onClick={(event) => {
                      event.currentTarget.focus();
                      onEdit(profile, character);
                    }}
                  >
                    {character.name}
                  </button>
                  {details && <small>{details}</small>}
                </th>
                <td>
                  {reference?.race || '—'}
                  {reference?.alignment && <small>{reference.alignment}</small>}
                </td>
                <td>
                  {profile.classes ? (
                    <div className={styles['profileClassValues']}>
                      {profile.classes.map((c) => (
                        <span key={c.id}>
                          {profileClassLabel(c.characterClass)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    profileClassLabel(profile.characterClass)
                  )}
                </td>
                <td
                  title={
                    profile.adjustment
                      ? `${profile.adjustment.name} +1 ${
                          profile.adjustment.enabled ? 'on' : 'off'
                        }`
                      : undefined
                  }
                >
                  {profile.classes ? (
                    <div className={styles['profileClassValues']}>
                      {profile.classes.map((c) => (
                        <span key={c.id}>
                          {c.baseLevel +
                            (profile.adjustment?.enabled &&
                            profile.adjustment.classId === c.id
                              ? 1
                              : 0)}
                          {profile.adjustment?.classId === c.id && (
                            <button
                              className={styles['sessionEffect']}
                              title={profile.adjustment.name}
                              aria-label={`${character.name} ${profile.adjustment.name} +1`}
                              aria-pressed={profile.adjustment.enabled}
                              onClick={() => onToggle(profile.characterId)}
                            >
                              +1
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <>
                      {level}
                      {profile.adjustment && (
                        <button
                          className={styles['sessionEffect']}
                          title={`${profile.adjustment.name} +1 · ${
                            profile.adjustment.enabled ? 'On' : 'Off'
                          } · Base ${profile.baseLevel}`}
                          aria-label={`${character.name} ${profile.adjustment.name} +1`}
                          aria-pressed={profile.adjustment.enabled}
                          onClick={() => onToggle(profile.characterId)}
                        >
                          +1
                        </button>
                      )}
                    </>
                  )}
                </td>
                <td>{recorded(reference?.maxHp)}</td>
                <td>
                  {strength?.score == null
                    ? '—'
                    : strength.exceptional == null
                    ? strength.score
                    : `18/${
                        strength.exceptional === 100
                          ? '00'
                          : String(strength.exceptional).padStart(2, '0')
                      }`}
                </td>
                {(
                  [
                    'intelligence',
                    'wisdom',
                    'dexterity',
                    'constitution',
                    'charisma',
                  ] as const
                ).map((key) => (
                  <td key={key}>{recorded(attributes?.[key])}</td>
                ))}
                <td>
                  {signed(bonuses?.meleeHit)} / {signed(bonuses?.meleeDamage)}
                </td>
                <td>{signed(bonuses?.missileHit)}</td>
                <td>{signed(bonuses?.reactionPercent, true)}</td>
                <td>
                  {profile.classes ? (
                    <div className={styles['profileClassValues']}>
                      {profile.classes.map((c) => (
                        <span key={c.id}>{signed(c.xpPercent, true)}</span>
                      ))}
                    </div>
                  ) : (
                    signed(bonuses?.xpPercent, true)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
