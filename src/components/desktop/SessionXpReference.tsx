import { compareXpAwards } from '../../helpers/campaignXpTimeline';
import { classProfile, profileClassLabel } from '../../helpers/campaignParty';
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
  const characters = profiles.flatMap((p) => {
    const c = document.party?.roster.find((c) => c.id === p.characterId);
    return c ? [{ character: c, profile: p }] : [];
  });
  const awards = activeXpEvents(xpLedger(document).events).filter(
    (e) => e.point.position.sessionId === sessionId
  );
  if (profiles.some((p) => p.classes))
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
              <th>XP cap</th>
              <th>Opening XP</th>
              <th>Bonus</th>
              <th>Full award</th>
              <th>XP added</th>
              <th>Discarded</th>
              <th>XP balance</th>
            </tr>
          </thead>
          <tbody>
            {characters.flatMap(({ character, profile }) => {
              const opening = xpLedger(document).openings.find(
                (o) => o.characterId === character.id
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
                  const row = e.rows.find(
                    (r) => r.characterId === character.id
                  );
                  const result = profile.classes
                    ? row?.classes?.find((v) => v.classId === c.id)
                    : row;
                  return result ? [result] : [];
                });
                const added = classAwards.reduce(
                  (sum, row) => sum + row.award,
                  0
                );
                const full = classAwards.reduce(
                  (sum, row) => sum + (row.fullAward ?? row.award),
                  0
                );
                const discarded = classAwards.reduce(
                  (sum, row) => sum + (row.discarded ?? 0),
                  0
                );
                const mapping = activeXpEvents(xpLedger(document).events)
                  .filter(
                    (e) =>
                      document.sessions.findIndex(
                        (s) => s.id === e.point.position.sessionId
                      ) <=
                      document.sessions.findIndex((s) => s.id === sessionId)
                  )
                  .sort((a, b) => compareXpAwards(document, a.point, b.point))
                  .flatMap((e) =>
                    e.rows
                      .filter((r) => r.characterId === character.id)
                      .flatMap(
                        (r) =>
                          r.classes?.filter((v) => v.classId === c.id) ?? []
                      )
                  )[0];
                const before = profile.classes
                  ? opening?.classes?.find((v) => v.classId === c.id)
                      ?.balance ?? mapping?.before
                  : opening?.balance;
                const after = profile.classes
                  ? balances[c.id]
                  : sessionXpBalances(document, character.id, sessionId)
                      .closing;
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
                    <td>
                      {c.xpPercent == null
                        ? '—'
                        : `${c.xpPercent > 0 ? '+' : ''}${c.xpPercent}%`}
                    </td>
                    <td>{full.toLocaleString()}</td>
                    <td>{added.toLocaleString()}</td>
                    <td>{discarded.toLocaleString()}</td>
                    <td>{after?.toLocaleString() ?? '—'}</td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
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
            <th scope="row" title="Maximum XP balance before training">
              XP cap
            </th>
            {characters.map(({ character, profile }) => (
              <td key={character.id}>
                {profileXpCap(profile)?.limit?.toLocaleString() ?? '—'}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">XP added this session</th>
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
