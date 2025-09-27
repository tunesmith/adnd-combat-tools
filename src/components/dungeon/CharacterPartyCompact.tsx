import type { FC } from 'react';
import React from 'react';
import { CharacterRace } from '../../tables/dungeon/monster/character/characterRace';
import type {
  PartySummary,
  PartyCharacterSummary,
} from '../../dungeon/helpers/party/formatPartyResult';
import {
  alignmentToCode,
  describeClasses,
} from '../../dungeon/helpers/party/formatPartyResult';
import type { MagicItemTableId } from '../../dungeon/helpers/party/assignMagicItems';

const listResetStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

interface CharacterProps {
  character: PartyCharacterSummary;
  followers: PartyCharacterSummary[];
}

const followerListStyle: React.CSSProperties = {
  ...listResetStyle,
  marginTop: 4,
  marginLeft: 14,
  fontSize: '0.85em',
  opacity: 0.9,
};

const MAGIC_TABLE_LABELS: Record<MagicItemTableId, string> = {
  I: 'Table I',
  II: 'Table II',
  III: 'Table III',
  IV: 'Table IV',
};

const DMG_REFERENCE = 'DMG p.176';

function summarizeMagicItems(items: PartyCharacterSummary['magicItems']): string {
  if (items.length === 0) return '';
  const parts = items.map(
    (item) => `${MAGIC_TABLE_LABELS[item.table]} ×${item.count}`
  );
  return `${parts.join(', ')} (${DMG_REFERENCE})`;
}

const CharacterCompactRow: FC<CharacterProps> = ({ character, followers }) => {
  const race = CharacterRace[character.characterRace] ?? 'Unknown';
  const classText = describeClasses(character);

  return (
    <li
      style={{
        marginBottom: followers.length > 0 ? 8 : 4,
        lineHeight: 1.25,
      }}
    >
      <span style={{ fontWeight: 600, marginRight: 6 }}>[{alignmentToCode(character.alignment)}]</span>
      <span>
        {character.gender} {race} — {classText} (hp: {character.hitPoints})
      </span>
      {character.magicItems.length > 0 && (
        <div style={{ marginTop: 4, fontSize: '0.85em' }}>
          Magic items: {summarizeMagicItems(character.magicItems)}
        </div>
      )}
      {followers.length > 0 && (
        <ul style={followerListStyle}>
          {followers.map((follower, index) => (
            <li key={index}>
              <span style={{ fontWeight: 500 }}>[{alignmentToCode(follower.alignment)}]</span>{' '}
              {follower.gender} {CharacterRace[follower.characterRace] ?? 'Unknown'} —{' '}
              {describeClasses(follower)} (hp: {follower.hitPoints})
              {follower.magicItems.length > 0 && (
                <div style={{ marginTop: 2 }}>
                  Magic items: {summarizeMagicItems(follower.magicItems)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

interface CharacterPartyCompactProps {
  summary: PartySummary;
}

export const CharacterPartyCompact: FC<CharacterPartyCompactProps> = ({ summary }) => {
  return (
    <div style={{ margin: '0.25rem 0' }}>
      {summary.main.length > 0 && (
        <div>
          <p style={{ margin: '0 0 0.25rem', fontWeight: 500 }}>Main characters</p>
          <ul style={{ ...listResetStyle, marginLeft: 14 }}>
            {summary.main.map(({ member, followers }, index) => (
              <CharacterCompactRow
                key={index}
                character={member}
                followers={followers}
              />
            ))}
          </ul>
        </div>
      )}
      {summary.includesHenchmen && (
        <p style={{ margin: '0.25rem 0 0', fontStyle: 'italic', fontSize: '0.9em' }}>
          Includes henchmen ready to accompany them.
        </p>
      )}
    </div>
  );
};
