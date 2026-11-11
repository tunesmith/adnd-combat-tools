import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  bankBalance,
  bankBalanceSourceItem,
  moneyStacks,
  previewBankTransaction,
  commitBankTransaction,
} from '../../helpers/campaignBanking';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../../helpers/campaignDocument';
import {
  sessionFingerprint,
  startNextSession,
} from '../../helpers/campaignContinuity';
import { transferInventorySubtree } from '../../helpers/encumbranceStorage';
import {
  existingBankFixture,
  bureauReceipt,
  existingLeg,
  receiptAt,
} from './bankingExisting';
import type { BankTransactionRequest } from '../../helpers/campaignBanking';

function post(doc: CampaignDocument, request: BankTransactionRequest) {
  const preview = previewBankTransaction(doc, request);
  const next = commitBankTransaction(
    doc,
    request,
    preview.fingerprint,
    'setup-' + request.transactionId,
    receiptAt
  );
  validateHistoryTransition(doc, next, '');
  return next;
}
export function reviewedDay2Fixture() {
  let doc = existingBankFixture();
  const ep = bureauReceipt(doc);
  const silver = {
    transactionId: 'silver-receipt',
    sessionId: 'day1',
    description: 'Invisible chest silver',
    kind: 'income' as const,
    receiptMode: 'existing' as const,
    changes: [existingLeg(doc, 'reatha-inventory', 'silver-1000', 1000)],
  };
  const gold = {
    ...silver,
    transactionId: 'gold-receipt',
    description: 'Invisible chest gold',
    changes: [existingLeg(doc, 'reatha-inventory', 'gold-250', 250)],
  };
  for (const request of [ep, silver, gold]) doc = post(doc, request);
  doc = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'day1',
    sourceFingerprint: sessionFingerprint(doc, 'day1'),
    destinationId: 'day2',
    label: 'Day 2',
    combats: [],
    inventory: {
      sourceId: 'day1-possessions',
      instanceId: 'day2-possessions',
      checkpointId: 'day2-carry',
    },
    copyNotes: false,
    capturedAt: receiptAt,
  });
  const working = doc.workingInventories.find((w) => w.sessionId === 'day2');
  if (!working || working.document.version !== 10) throw Error('Fixture');
  let inventory = working.document;
  for (const container of ['chest', 'pouch-a', 'pouch-b'])
    inventory = transferInventorySubtree(
      inventory,
      container,
      'reatha-inventory',
      'castle-storage'
    );
  // The fixture starts from reviewed end-of-Day2 possessions, before its banking
  // relocation has been reconstructed. This is not a new physical transfer.
  doc = {
    ...doc,
    workingInventories: doc.workingInventories.map((w) =>
      w.id === working.id ? { ...w, document: inventory } : w
    ),
  };
  return parseCampaign(serializeCampaign(doc));
}
export function chestTransfer(doc: CampaignDocument): BankTransactionRequest {
  const working = doc.workingInventories.find((w) => w.sessionId === 'day2');
  if (!working) throw Error('Fixture');
  const source = bankBalance(doc, 'reatha-inventory', 'day2');
  return {
    transactionId: 'chest-move',
    sessionId: 'day2',
    description: 'Chest money moved to Castle Kifu',
    kind: 'transfer',
    receiptMode: 'existing',
    changes: moneyStacks(working.document)
      .filter((s) => s.holderId === 'castle-storage')
      .flatMap((stack) => [
        {
          holderId: 'reatha-inventory',
          denomination: stack.denomination,
          quantity: -stack.item.quantity,
          item: bankBalanceSourceItem(
            'reatha-inventory',
            stack.denomination,
            source[stack.denomination] ?? 0
          ),
        },
        {
          holderId: stack.holderId,
          denomination: stack.denomination,
          quantity: stack.item.quantity,
          item: stack.item,
        },
      ]),
  };
}
export function inventoryAt(doc: CampaignDocument, session = 'day2') {
  const result = doc.workingInventories.find(
    (w) => w.sessionId === session
  )?.document;
  if (!result || result.version !== 10) throw Error('Fixture');
  return result;
}
