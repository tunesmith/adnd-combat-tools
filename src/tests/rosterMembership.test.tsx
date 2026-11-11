/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import PartyReference from '../components/desktop/PartyReference';
import CampaignXp from '../components/desktop/CampaignXp';
import CampaignCombats from '../components/desktop/CampaignCombats';
import CreateSessionDialog from '../components/desktop/CreateSessionDialog';
import type { CampaignDocument } from '../helpers/campaignDocument';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  carriedPartyProfiles,
  emptyProfile,
  profilesInSession,
  priorProfileChoices,
  updatePartyProfile,
} from '../helpers/campaignParty';
import { emptyProfileReference } from '../helpers/campaignPartyModel';
import {
  confirmXpAward,
  newXpPoint,
  previewXpAward,
  saveXpOpening,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
  xpLedger,
} from '../helpers/campaignXp';
import { newXpReward } from '../helpers/campaignXpSources';
import {
  createWorkingCombat,
  emptyWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import { xpAt } from './fixtures/xpCampaign';

beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `roster-test-${++id}` },
  });
});

function fixture(): CampaignDocument {
  const doc = parseCampaign(
    JSON.stringify({
      kind: 'adnd-campaign',
      schemaVersion: 1,
      id: 'roster-fixture',
      title: 'Disposable roster example',
      notes: '',
    })
  );
  return {
    ...doc,
    sessions: [90, 91, 92, 93].map((n) => ({ id: `d${n}`, label: `Day${n}` })),
    workspace: { ...doc.workspace, sessionId: 'd93' },
  };
}
function withProfile(
  doc: CampaignDocument,
  id: string,
  name: string,
  day: string,
  hp: number,
  participating = true
) {
  return updatePartyProfile(
    doc,
    {
      ...emptyProfile(day, id),
      participating,
      characterClass: 'fighter',
      reference: {
        ...emptyProfileReference(),
        maxHp: hp,
        bonuses: { ...emptyProfileReference().bonuses, xpPercent: 0 },
      },
    },
    doc.party?.roster.find((c) => c.id === id) ?? {
      id,
      name,
      player: '',
      notes: '',
    }
  );
}

function harness(initial: CampaignDocument, day = 'd93', includeXp = false) {
  let current = initial;
  function Workspace() {
    const [document, setDocument] = useState(initial);
    const [carry, setCarry] = useState(false);
    const change = (edit: (doc: CampaignDocument) => CampaignDocument) => {
      const next = parseCampaign(serializeCampaign(edit(document)));
      validateHistoryTransition(document, next, '');
      current = next;
      setDocument(next);
      return true;
    };
    return (
      <>
        <PartyReference
          document={document}
          view="session"
          sessionId={day}
          onChange={change}
        />
        {includeXp && (
          <>
            <CampaignXp
              document={document}
              sessionId={day}
              onChange={change}
              onConfirmExtension={async () => undefined}
            />
            <CampaignCombats
              document={document}
              sessionId={day}
              onChange={change}
              onEdit={() => true}
              editorVersion={0}
              active
            />
          </>
        )}
        <button onClick={() => setCarry(true)}>Check carry-forward</button>
        {carry && (
          <CreateSessionDialog
            document={document}
            sessionId={day}
            onCreate={async () => undefined}
            onClose={() => setCarry(false)}
          />
        )}
      </>
    );
  }
  render(<Workspace />);
  return () => current;
}
function addExisting(id: string) {
  fireEvent.click(screen.getByRole('button', { name: '+ Character' }));
  const dialog = within(
    screen.getByRole('dialog', { name: 'Character profile' })
  );
  fireEvent.change(dialog.getByLabelText('Existing character'), {
    target: { value: id },
  });
  return dialog;
}
function editCharacter(name: string) {
  fireEvent.click(screen.getByRole('button', { name, exact: true }));
  return within(screen.getByRole('dialog', { name: 'Character profile' }));
}
function pendingFlags(doc: CampaignDocument, eventId: string, id: string) {
  const recipient = xpLedger(doc)
    .rewards.find((r) => r.id === eventId)
    ?.recipients.find((r) => r.characterId === id);
  return [recipient?.participated, recipient?.eligible];
}

test('Day93 removal, restoration and roster XP settings preserve combat and confirmed awards', () => {
  let doc = withProfile(fixture(), 'familiar', 'Squeeleo', 'd93', 13);
  doc = withProfile(doc, 'sot', 'Sot', 'd93', 21);
  for (const characterId of ['sot', 'familiar'])
    doc = saveXpOpening(doc, {
      id: `opening-${characterId}`,
      characterId,
      sessionId: 'd93',
      balance: 0,
      reason: 'Fixture opening balance',
    });
  const combat = createWorkingCombat(
    doc,
    'd93',
    'Hell hound fight',
    emptyWorkingCombat(),
    { kind: 'empty' },
    'hell-hounds'
  );
  doc = combat;
  const fight = newXpReward(doc, 'd93', 'fight', 'monster');
  fight.title = 'Hell hound fight';
  fight.input = {
    category: 'monster',
    monsters: [
      {
        id: 'hound',
        name: 'Hell hound',
        count: 1,
        basis: 'hit-dice',
        hitDice: '1',
        hpAdjustment: 0,
        startingHp: '5',
        special: 0,
        exceptional: 0,
        bandOverride: null,
        bandReason: '',
      },
    ],
  };
  fight.recipients = fight.recipients.map((r) => ({
    ...r,
    participated: r.characterId === 'familiar',
    eligible: r.characterId === 'familiar',
  }));
  doc = saveXpReward(doc, fight);
  doc = saveXpPoint(doc, newXpPoint(doc, 'd93', 'battle-award'));
  doc = selectXpRewards(doc, 'battle-award', [fight.id]);
  doc = confirmXpAward(
    doc,
    'battle-award',
    previewXpAward(doc, 'battle-award').fingerprint,
    'accepted-fight',
    xpAt
  );
  const confirmed = xpLedger(doc).events[0];
  const opals = newXpReward(doc, 'd93', 'opals', 'treasure');
  opals.title = 'Hell hound opals';
  opals.input = {
    category: 'treasure',
    disposition: 'keep',
    retainedXp: '120',
    proceeds: null,
    marketGp: null,
  };
  opals.recipients = opals.recipients.map((r) => ({
    ...r,
    eligible: true,
    participated: r.characterId === 'familiar',
  }));
  doc = saveXpReward(doc, opals);
  const current = harness(doc, 'd93', true);
  let dialog = editCharacter('Squeeleo');
  expect(dialog.getByLabelText('Max HP')).toHaveValue(13);
  fireEvent.click(dialog.getByRole('button', { name: 'Remove from session' }));
  expect(
    screen.queryByRole('button', { name: 'Squeeleo', exact: true })
  ).not.toBeInTheDocument();
  expect(pendingFlags(current(), 'opals', 'familiar')).toEqual([false, false]);
  expect(pendingFlags(current(), 'fight', 'familiar')).toEqual([true, true]);

  fireEvent.click(
    screen.getByRole('button', { name: /^Hell hound opals Pending/ })
  );
  let xpEditor = within(
    screen.getByRole('dialog', { name: 'XP event review' })
  );
  expect(
    xpEditor.queryByLabelText('Squeeleo eligible')
  ).not.toBeInTheDocument();
  expect(xpEditor.getByLabelText('Sot participated')).not.toBeChecked();
  expect(xpEditor.getByLabelText('Sot eligible')).toBeChecked();
  fireEvent.click(xpEditor.getByRole('button', { name: 'Cancel' }));

  fireEvent.click(screen.getByRole('button', { name: '+ Award point' }));
  const removalPreview = within(
    screen.getByRole('dialog', { name: 'XP award' })
  );
  fireEvent.click(removalPreview.getByLabelText('Include Hell hound opals'));
  expect(
    removalPreview.queryByRole('columnheader', { name: 'Squeeleo' })
  ).not.toBeInTheDocument();
  expect(
    removalPreview.getByRole('row', { name: /^XP added/ })
  ).toHaveTextContent('120');
  fireEvent.click(removalPreview.getByRole('button', { name: 'Cancel' }));

  dialog = addExisting('familiar');
  expect(
    dialog.getByRole('option', { name: 'Restore saved profile from Day93' })
  ).toBeInTheDocument();
  expect(dialog.getByLabelText('Max HP')).toHaveValue(13);
  fireEvent.click(dialog.getByRole('button', { name: 'Save profile' }));
  expect(
    current().party?.roster.filter((c) => c.id === 'familiar')
  ).toHaveLength(1);
  expect(pendingFlags(current(), 'opals', 'familiar')).toEqual([false, false]);

  fireEvent.click(
    screen.getByRole('button', { name: /^Hell hound opals Pending/ })
  );
  xpEditor = within(screen.getByRole('dialog', { name: 'XP event review' }));
  fireEvent.click(xpEditor.getByLabelText('Squeeleo eligible'));
  fireEvent.click(xpEditor.getByLabelText('Squeeleo participated'));
  fireEvent.click(xpEditor.getByRole('button', { name: 'Save XP event' }));
  dialog = editCharacter('Squeeleo');
  fireEvent.click(dialog.getByText('Roster settings'));
  fireEvent.click(dialog.getByLabelText('Earns XP'));
  expect(dialog.getByRole('status')).toHaveTextContent('1 pending XP event');
  fireEvent.click(dialog.getByRole('button', { name: 'Save profile' }));
  expect(pendingFlags(current(), 'opals', 'familiar')).toEqual([false, false]);
  expect(current().workingCombats).toEqual(combat.workingCombats);
  expect(xpLedger(current()).events[0]).toEqual(confirmed);
  expect(
    within(screen.getByLabelText('Add from party/profile')).getByRole(
      'option',
      { name: /Squeeleo/ }
    )
  ).toBeInTheDocument();
  expect(
    newXpReward(current(), 'd93', 'fresh', 'money').recipients.map(
      (r) => r.characterId
    )
  ).toEqual(['sot']);

  fireEvent.click(screen.getByRole('button', { name: '+ Award point' }));
  const award = within(screen.getByRole('dialog', { name: 'XP award' }));
  fireEvent.click(award.getByLabelText('Include Hell hound opals'));
  const table = within(award.getByRole('table', { name: 'XP award' }));
  expect(
    table.queryByRole('columnheader', { name: 'Squeeleo' })
  ).not.toBeInTheDocument();
  expect(table.getByRole('row', { name: /^XP added/ })).toHaveTextContent(
    '120'
  );
  fireEvent.click(award.getByRole('button', { name: 'Confirm award' }));
  expect(xpLedger(current()).events.at(-1)?.rows).toMatchObject([
    { characterId: 'sot', award: 120 },
  ]);
  expect(xpLedger(current()).events[0]).toEqual(confirmed);
});

test('historical additions identify the latest earlier profile and restore legacy absent stats', () => {
  let doc = withProfile(fixture(), 'pc', 'Earlier PC', 'd90', 25);
  doc = withProfile(doc, 'pc', 'Earlier PC', 'd92', 30, false);
  doc = withProfile(doc, 'pc', 'Earlier PC', 'd93', 40);
  doc = withProfile(doc, 'legacy', 'Legacy PC', 'd91', 18, false);
  const old = parseCampaign(JSON.stringify({ ...doc, schemaVersion: 13 }));
  expect(old.schemaVersion).toBe(17);
  expect(priorProfileChoices(old, 'd93', 'pc')[0]?.sessionId).toBe('d92');
  const current = harness(old, 'd91');
  let dialog = addExisting('pc');
  expect(
    dialog.getByRole('option', { name: 'Copy profile from Day90' })
  ).toBeInTheDocument();
  expect(
    dialog.queryByRole('option', { name: /Day93/ })
  ).not.toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Starting stats'), {
    target: { value: '' },
  });
  expect(dialog.getByLabelText('Max HP')).toHaveValue(null);
  fireEvent.change(dialog.getByLabelText('Starting stats'), {
    target: { value: 'd90' },
  });
  fireEvent.change(dialog.getByLabelText('Max HP'), {
    target: { value: '27' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save profile' }));
  expect(profilesInSession(current(), 'd91')[0]?.reference?.maxHp).toBe(27);
  expect(profilesInSession(current(), 'd90')[0]?.reference?.maxHp).toBe(25);
  dialog = addExisting('legacy');
  expect(
    dialog.getByRole('option', { name: 'Restore saved profile from Day91' })
  ).toBeInTheDocument();
  expect(dialog.getByLabelText('Max HP')).toHaveValue(18);
  fireEvent.click(dialog.getByRole('button', { name: 'Save profile' }));
  expect(profilesInSession(current(), 'd91').map((p) => p.characterId)).toEqual(
    expect.arrayContaining(['pc', 'legacy'])
  );
});

test('retirement cutoff is inclusive and uses session order for additions and carry-forward', () => {
  let doc = withProfile(fixture(), 'retire', 'Retiring PC', 'd90', 22);
  doc = withProfile(doc, 'retire', 'Retiring PC', 'd93', 24);
  doc = withProfile(doc, 'other', 'Other PC', 'd93', 20);
  const current = harness(doc);
  const dialog = editCharacter('Retiring PC');
  fireEvent.click(dialog.getByText('Roster settings'));
  fireEvent.click(dialog.getByRole('button', { name: 'Retire from roster' }));
  fireEvent.change(dialog.getByLabelText('Last eligible session'), {
    target: { value: 'd92' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save profile' }));
  expect(
    profilesInSession(current(), 'd93').map((p) => p.characterId)
  ).toContain('retire');
  fireEvent.click(screen.getByRole('button', { name: 'Check carry-forward' }));
  const carry = within(screen.getByRole('dialog', { name: 'New session' }));
  expect(
    carry.queryByRole('checkbox', { name: /Retiring PC/ })
  ).not.toBeInTheDocument();
  expect(carry.getByRole('checkbox', { name: /Other PC/ })).toBeInTheDocument();
  expect(
    carriedPartyProfiles(current(), 'd90', 'd91', ['retire'])
  ).toHaveLength(1);
  expect(
    carriedPartyProfiles(current(), 'd90', 'd92', ['retire'])
  ).toHaveLength(1);
  expect(() =>
    carriedPartyProfiles(current(), 'd90', 'd93', ['retire'])
  ).toThrow();
  const retired = current().party?.roster.find((c) => c.id === 'retire');
  expect(retired?.lastEligibleSessionId).toBe('d92');
  fireEvent.click(carry.getByRole('button', { name: 'Cancel' }));
  const profile = editCharacter('Retiring PC');
  fireEvent.click(profile.getByRole('button', { name: 'Remove from session' }));
  fireEvent.click(screen.getByRole('button', { name: '+ Character' }));
  const picker = within(
    screen.getByRole('dialog', { name: 'Character profile' })
  );
  expect(
    picker.queryByRole('option', { name: /Retiring PC/ })
  ).not.toBeInTheDocument();
  const afterRemoval = current();
  expect(() =>
    updatePartyProfile(afterRemoval, emptyProfile('d93', 'retire'))
  ).toThrow('retired');
});
