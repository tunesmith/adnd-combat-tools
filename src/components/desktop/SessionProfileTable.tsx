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
}: {
  document: CampaignDocument;
  profiles: PartyProfile[];
  onEdit: (profile: PartyProfile, character: RosterCharacter) => void;
  onToggle: (characterId: string) => void;
}) {
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
              XP
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
              <tr key={profile.characterId}>
                <th scope="row">
                  <button
                    className={styles['sessionName']}
                    onClick={(event) => {
                      event.currentTarget.focus();
                      onEdit(profile, character);
                    }}
                  >
                    {character.name}
                  </button>
                  {details && <small>{details}</small>}
                  {!profile.participating && <small>Not participating</small>}
                </th>
                <td>
                  {reference?.race || '—'}
                  {reference?.alignment && <small>{reference.alignment}</small>}
                </td>
                <td>{profileClassLabel(profile.characterClass)}</td>
                <td
                  title={
                    profile.adjustment
                      ? `Base ${profile.baseLevel} · ${
                          profile.adjustment.name
                        } +1 ${profile.adjustment.enabled ? 'on' : 'off'}`
                      : undefined
                  }
                >
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
                <td>{signed(bonuses?.xpPercent, true)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
