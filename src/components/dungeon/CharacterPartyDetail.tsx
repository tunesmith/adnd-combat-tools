import type { FC } from 'react';
import React from 'react';
import { CharacterRace } from '../../tables/dungeon/monster/character/characterRace';
import { Attribute } from '../../dungeon/models/attributes';
import type { PartySummary, PartyCharacterSummary } from '../../dungeon/helpers/party/formatPartyResult';
import {
  alignmentToCode,
  alignmentToName,
  describeClasses,
} from '../../dungeon/helpers/party/formatPartyResult';

const attributeOrder: Attribute[] = [
  Attribute.Strength,
  Attribute.Intelligence,
  Attribute.Wisdom,
  Attribute.Dexterity,
  Attribute.Constitution,
  Attribute.Charisma,
];

const listResetStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const followerListStyle: React.CSSProperties = {
  ...listResetStyle,
  marginTop: 6,
  marginLeft: 18,
  fontSize: '0.95em',
};

interface CharacterProps {
  character: PartyCharacterSummary;
  followers: PartyCharacterSummary[];
}

const CharacterDetailRow: FC<CharacterProps> = ({ character, followers }) => {
  const alignmentCode = alignmentToCode(character.alignment);
  const alignmentName = alignmentToName(character.alignment);
  const race = CharacterRace[character.characterRace] ?? 'Unknown';
  const classText = describeClasses(character);

  return (
    <li
      style={{
        marginBottom: followers.length > 0 ? 12 : 8,
        lineHeight: 1.4,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        <span style={{ marginRight: 8 }}>[{alignmentCode}]</span>
        <span style={{ fontStyle: 'italic', marginRight: 8 }}>{alignmentName}</span>
        <span>
          {character.gender} {race} — {classText}
        </span>
      </div>
      <div style={{ fontSize: '0.95em', marginBottom: 4 }}>
        Hit points: <strong>{character.hitPoints}</strong>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9em' }}>
        {attributeOrder.map((attr) => (
          <span key={attr}>
            <strong>{attr}</strong>&nbsp;{character.attributes[attr]}
          </span>
        ))}
      </div>
      {followers.length > 0 && (
        <ul style={followerListStyle}>
          {followers.map((follower, index) => (
            <li key={index}>
              <span style={{ fontWeight: 500 }}>[{alignmentToCode(follower.alignment)}]</span>{' '}
              {follower.gender} {CharacterRace[follower.characterRace] ?? 'Unknown'} —{' '}
              {describeClasses(follower)} (hp: {follower.hitPoints})
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

interface CharacterPartyDetailProps {
  summary: PartySummary;
}

export const CharacterPartyDetail: FC<CharacterPartyDetailProps> = ({ summary }) => {
  return (
    <div style={{ margin: '0.5rem 0' }}>
      {summary.main.length > 0 && (
        <div>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Main characters</p>
          <ul style={{ ...listResetStyle, marginLeft: 18 }}>
            {summary.main.map(({ member, followers }, index) => (
              <CharacterDetailRow
                key={index}
                character={member}
                followers={followers}
              />
            ))}
          </ul>
        </div>
      )}
      {summary.includesHenchmen && (
        <p style={{ margin: '0.5rem 0 0', fontStyle: 'italic' }}>
          They are accompanied by henchmen ready to assist.
        </p>
      )}
    </div>
  );
};
