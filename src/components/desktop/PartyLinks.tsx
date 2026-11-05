import { useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type {
  PartyProfile,
  InventoryLink,
  CombatLink,
} from '../../helpers/campaignPartyModel';
import {
  sameCombatSlot,
  sameInventorySlot,
  setCombatCharacterLink,
  setInventoryCharacterLink,
} from '../../helpers/campaignParty';

type Target = { label: string; id: string; name?: string } & (
  | { kind: 'inventory'; link: InventoryLink }
  | { kind: 'combat'; link: CombatLink }
);
export default function PartyLinks({
  document,
  profile,
  onChange,
}: {
  document: CampaignDocument;
  profile: PartyProfile;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
}) {
  const [selection, setSelection] = useState('');
  const { sessionId, characterId } = profile;
  const inventory = document.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  const targets: Target[] = [];
  inventory?.document.characters.forEach((actor, i) => {
    targets.push({
      kind: 'inventory',
      name: actor.name,
      id: JSON.stringify(['inventory', inventory.id, actor.id]),
      label: `Possessions · ${i + 1}. ${actor.name || 'Unnamed'}`,
      link: {
        sessionId,
        inventoryId: inventory.id,
        inventoryCharacterId: actor.id,
        characterId,
      },
    });
  });
  document.workingCombats
    .filter((c) => c.sessionId === sessionId && !c.removedAt)
    .forEach((combat, index) => {
      const round = combat.state.rounds[combat.state.rounds.length - 1];
      if (!round) return;
      for (const side of ['party', 'enemy'] as const) {
        (side === 'party' ? round.party : round.enemies).forEach((actor, i) => {
          targets.push({
            kind: 'combat',
            name: actor.name,
            id: JSON.stringify(['combat', combat.id, side, actor.key]),
            label: `${index + 1}. ${combat.title} · ${side} ${i + 1} · ${
              actor.name || 'Unnamed'
            }`,
            link: {
              sessionId,
              combatId: combat.id,
              generation: combat.generation,
              side,
              key: actor.key,
              characterId,
            },
          });
        });
      }
    });
  const owner = (target: Target) =>
    target.kind === 'inventory'
      ? document.party?.inventoryLinks.find((l) =>
          sameInventorySlot(l, target.link)
        )?.characterId
      : document.party?.combatLinks.find(
          (l) =>
            l.generation === target.link.generation &&
            sameCombatSlot(l, target.link)
        )?.characterId;
  const roster = document.party?.roster || [];
  const name = roster
    .find((c) => c.id === characterId)
    ?.name.trim()
    .toLocaleLowerCase();
  const rosterLabel = (id: string | undefined) => {
    const index = roster.findIndex((c) => c.id === id);
    const character = roster[index];
    return character ? `#${index + 1} ${character.name}` : '';
  };
  const chosen = targets.find((t) => t.id === selection);
  const linked = targets.filter((t) => owner(t) === characterId);
  function change(target: Target, enabled: boolean) {
    onChange((doc) =>
      target.kind === 'inventory'
        ? setInventoryCharacterLink(doc, target.link, enabled)
        : setCombatCharacterLink(doc, target.link, enabled)
    );
  }
  return (
    <details>
      <summary>
        Character links{linked.length > 0 ? ` (${linked.length})` : ''}
      </summary>
      {linked.map((t) => (
        <div key={t.id}>
          {t.label}{' '}
          <button type="button" onClick={() => change(t, false)}>
            Unlink
          </button>
        </div>
      ))}
      {targets.length ? (
        <>
          <label>
            Link to{' '}
            <select
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
            >
              <option value="">Choose a current character or combatant</option>
              {targets
                .filter((t) => owner(t) !== characterId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                    {name && t.name?.trim().toLocaleLowerCase() === name
                      ? ' · possible name match'
                      : ''}
                    {owner(t) ? ` · linked to ${rosterLabel(owner(t))}` : ''}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!chosen || owner(chosen) === characterId}
            onClick={() => {
              if (chosen) change(chosen, true);
              setSelection('');
            }}
          >
            {chosen && owner(chosen) ? 'Move link' : 'Link character'}
          </button>
          <p>
            Combat links use the latest round’s roster. Review levels in Combats
            after linking. Link changes take effect without saving the profile.
          </p>
        </>
      ) : (
        <p>Add an inventory character or combatant to link.</p>
      )}
    </details>
  );
}
