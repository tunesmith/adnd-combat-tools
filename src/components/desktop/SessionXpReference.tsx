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
  const characters = profiles.flatMap((p) => {
    const c = document.party?.roster.find((c) => c.id === p.characterId);
    return c ? [{ character: c, profile: p }] : [];
  });
  const awards = activeXpEvents(xpLedger(document).events).filter(
    (e) => e.point.position.sessionId === sessionId
  );
  return (
    <div className={styles['xpReferenceWrap']}>
      <table
        className={styles['xpReference']}
        aria-label="Session XP reference"
      >
        <caption>XP</caption>
        <thead>
          <tr>
            <th></th>
            {characters.map(({ character }) => (
              <th scope="col" key={character.id}>
                {character.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Base level</th>
            {characters.map(({ character, profile }) => (
              <td key={character.id}>{profile.baseLevel}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Awarded this session</th>
            {characters.map(({ character }) => (
              <td key={character.id}>
                {awards
                  .reduce(
                    (sum, e) =>
                      sum +
                      (e.rows.find((r) => r.characterId === character.id)
                        ?.award ?? 0),
                    0
                  )
                  .toLocaleString()}
              </td>
            ))}
          </tr>
          <tr>
            <th
              scope="row"
              title="Confirmed XP balance at the end of this session"
            >
              XP balance
            </th>
            {characters.map(({ character }) => (
              <td key={character.id}>
                {sessionXpBalances(
                  document,
                  character.id,
                  sessionId
                ).closing?.toLocaleString() ?? '—'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
