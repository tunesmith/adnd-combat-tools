import {
  classProfile,
  profileClassLabel,
  inPartyOrder,
} from '../../helpers/campaignParty';
import { xpClassBalances } from '../../helpers/campaignXp';
import { profileXpCap } from '../../helpers/campaignXpCap';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { PartyProfile } from '../../helpers/campaignPartyModel';
import {
  activeXpEvents,
  sessionXpBalances,
  xpLedger,
} from '../../helpers/campaignXp';
import styles from './campaignWorkspace.module.css';

export default function SessionXpReference({
  document,
  sessionId,
  profiles,
}: {
  document: CampaignDocument;
  sessionId: string;
  profiles: PartyProfile[];
}) {
  if (!profiles.length) return null;
  const characters = inPartyOrder(
    document,
    profiles,
    (p) => p.characterId,
    sessionId
  ).flatMap((p) => {
    const c = document.party?.roster.find((c) => c.id === p.characterId);
    return c ? [{ character: c, profile: p }] : [];
  });
  const awards = activeXpEvents(xpLedger(document).events).filter(
    (e) => e.point.position.sessionId === sessionId
  );
  return (
    <div className={styles['xpReferenceWrap']}>
      <table
        className={styles['xpClassReference']}
        aria-label="Session XP reference"
      >
        <caption>XP</caption>
        <thead>
          <tr>
            <th>Character</th>
            <th>Class</th>
            <th>Base level</th>
            <th>Next Level</th>
            <th>Starting XP</th>
            <th>Awarded</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {characters.flatMap(({ character, profile }) => {
            const sessionBalances = sessionXpBalances(
              document,
              character.id,
              sessionId
            );
            const startingClasses = xpClassBalances(
              document,
              character.id,
              { sessionId, phase: 'opening', order: 0 },
              false
            );
            const balances = xpClassBalances(document, character.id, {
              sessionId,
              phase: 'end',
              order: 9999,
            });
            const entries = profile.classes ?? [
              {
                id: '',
                characterClass: profile.characterClass,
                baseLevel: profile.baseLevel,
                xpPercent: profile.reference?.bonuses.xpPercent ?? null,
              },
            ];
            return entries.map((c, i) => {
              const cap = profileXpCap(
                profile.classes ? classProfile(profile, c) : profile
              );
              const classAwards = awards.flatMap((e) => {
                const row = e.rows.find((r) => r.characterId === character.id);
                const result = profile.classes
                  ? row?.classes?.find((v) => v.classId === c.id)
                  : row;
                return result ? [result] : [];
              });
              const added = classAwards.reduce(
                (sum, row) => sum + row.award,
                0
              );
              const before = profile.classes
                ? startingClasses[c.id]
                : sessionBalances.opening;
              const after = profile.classes
                ? balances[c.id]
                : sessionBalances.closing;
              return (
                <tr key={`${character.id}-${c.id}`}>
                  {i === 0 && (
                    <th scope="rowgroup" rowSpan={entries.length}>
                      {character.name}
                    </th>
                  )}
                  <td>{profileClassLabel(c.characterClass)}</td>
                  <td>{c.baseLevel}</td>
                  <td>{cap?.limit?.toLocaleString() ?? '—'}</td>
                  <td>{before?.toLocaleString() ?? '—'}</td>
                  <td>{added.toLocaleString()}</td>
                  <td>{after?.toLocaleString() ?? '—'}</td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}
