import type { DungeonRenderNode } from '../../../../types/dungeon';
import { createOutcomeRenderSnapshot } from '../../../../dungeon/helpers/outcomePipeline';
import {
  resolveTreasureSwordExtraordinaryPower,
  resolveTreasureSwordSpecialPurpose,
  resolveTreasureSwordUnusual,
} from '../../../../dungeon/domain/resolvers';
import type { PendingRoll } from '../../../../dungeon/domain/outcome';
import {
  applyResolvedOutcome,
  normalizeOutcomeTree,
} from '../../../../dungeon/helpers/outcomeTree';
import { applyOutcomeRoll } from '../../../../dungeon/helpers/registry';
import {
  TreasureSword,
  TreasureSwordExtraordinaryPower,
  type TreasureSwordExtraordinaryPowerResult,
} from '../../../../tables/dungeon/treasureSwords';
import { TreasureSwordAlignment } from '../../../../tables/dungeon/treasureSwordAlignment';

function collectPreviewIds(detailNodes: DungeonRenderNode[]): string[] {
  return detailNodes
    .filter(
      (
        node
      ): node is Extract<typeof node, { kind: 'table-preview'; id: string }> =>
        node.kind === 'table-preview'
    )
    .map((preview) => preview.id);
}

describe('createOutcomeRenderSnapshot', () => {
  describe('treasure sword alignment propagation', () => {
    it('suppresses special purpose preview until alignment is available', () => {
      const withoutAlignment = resolveTreasureSwordUnusual({
        roll: 100,
        sword: TreasureSword.SwordPlus2,
        extraordinaryPowerRolls: [100],
      });
      const withoutSnapshot = createOutcomeRenderSnapshot(withoutAlignment);
      if (!withoutSnapshot) {
        throw new Error('Expected snapshot for unusual sword outcome');
      }
      const previewIdsWithout = collectPreviewIds(withoutSnapshot.detail);
      expect(
        previewIdsWithout.some((id) =>
          id.startsWith('treasureSwordSpecialPurpose')
        )
      ).toBe(false);
      expect(
        previewIdsWithout.some((id) =>
          id.startsWith('treasureSwordSpecialPurposePower')
        )
      ).toBe(false);

      const withAlignment = resolveTreasureSwordUnusual({
        roll: 100,
        sword: TreasureSword.SwordPlus2,
        extraordinaryPowerRolls: [100],
        alignmentRoll: 31,
      });
      const withSnapshot = createOutcomeRenderSnapshot(withAlignment);
      if (!withSnapshot) {
        throw new Error('Expected snapshot for aligned unusual sword');
      }
      const previewIdsWith = collectPreviewIds(withSnapshot.detail);
      expect(
        previewIdsWith.some((id) =>
          id.startsWith('treasureSwordSpecialPurpose')
        )
      ).toBe(true);
      expect(
        previewIdsWith.some((id) =>
          id.startsWith('treasureSwordSpecialPurposePower')
        )
      ).toBe(true);
    });

    it('renders purpose resolution and schedules power roll', () => {
      const extraordinary = resolveTreasureSwordExtraordinaryPower({
        roll: 100,
        slotKey: 'root',
        alignment: TreasureSwordAlignment.LawfulGood,
      });
      if (extraordinary.type !== 'event') {
        throw new Error('Expected extraordinary power event');
      }
      if (extraordinary.event.kind !== 'treasureSwordExtraordinaryPower') {
        throw new Error('Expected extraordinary power event kind');
      }
      const result = extraordinary.event
        .result as TreasureSwordExtraordinaryPowerResult;
      if (!result || result.kind !== 'power') {
        throw new Error('Expected power result');
      }
      if (
        result.power !==
        TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose
      ) {
        throw new Error('Expected special purpose instruction');
      }
      const pendingPurpose = (extraordinary.children || []).find(
        (child): child is PendingRoll =>
          child.type === 'pending-roll' &&
          child.table.startsWith('treasureSwordSpecialPurpose')
      );
      if (!pendingPurpose) {
        throw new Error('Expected pending special purpose roll');
      }
      const normalizedBase = normalizeOutcomeTree(extraordinary);
      if (normalizedBase.type !== 'event' || !normalizedBase.children) {
        throw new Error(
          'Expected normalized extraordinary event with children'
        );
      }
      const normalizedPending = normalizedBase.children.find(
        (child): child is PendingRoll =>
          child.type === 'pending-roll' &&
          child.table.startsWith('treasureSwordSpecialPurpose')
      );
      if (!normalizedPending) {
        throw new Error('Expected normalized pending special purpose roll');
      }
      const context =
        normalizedPending.context &&
        typeof normalizedPending.context === 'object'
          ? (normalizedPending.context as {
              slotKey?: unknown;
              rollIndex?: unknown;
              parentSlotKey?: unknown;
              alignment?: unknown;
            })
          : {};
      const resolvedPurpose = resolveTreasureSwordSpecialPurpose({
        roll: 42,
        slotKey:
          typeof context.slotKey === 'string'
            ? (context.slotKey as string)
            : undefined,
        rollIndex:
          typeof context.rollIndex === 'number'
            ? (context.rollIndex as number)
            : undefined,
        parentSlotKey:
          typeof context.parentSlotKey === 'string'
            ? (context.parentSlotKey as string)
            : undefined,
        alignment:
          typeof context.alignment === 'number'
            ? (context.alignment as TreasureSwordAlignment)
            : undefined,
      });
      const targetId = normalizedPending.id ?? normalizedPending.table;
      const normalizedResolution = normalizeOutcomeTree(
        resolvedPurpose,
        targetId
      );
      const applied = applyResolvedOutcome(
        normalizedBase,
        targetId,
        normalizedResolution
      );
      const pendingTables: string[] = [];
      const stack = [applied];
      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) continue;
        if (current.type === 'pending-roll') {
          pendingTables.push(current.table);
        } else if (current.type === 'event' && current.children) {
          stack.push(...current.children);
        }
      }
      expect(
        pendingTables.some((table) =>
          table.startsWith('treasureSwordSpecialPurposePower')
        )
      ).toBe(true);
      const snapshot = createOutcomeRenderSnapshot(applied);
      if (!snapshot) {
        throw new Error('Expected outcome snapshot');
      }
      const previewIds = collectPreviewIds(snapshot.detail);
      expect(
        previewIds.some((id) =>
          id.startsWith('treasureSwordSpecialPurposePower')
        )
      ).toBe(true);
      const purposeParagraph = snapshot.detail.find(
        (
          node
        ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
          node.kind === 'paragraph' &&
          node.text.startsWith("The sword's special purpose is to")
      );
      expect(purposeParagraph).toBeDefined();
    });

    it('resolves special purpose via applyOutcomeRoll and retains power preview', () => {
      const outcome = resolveTreasureSwordUnusual({
        roll: 100,
        sword: TreasureSword.SwordPlus2,
        extraordinaryPowerRolls: [100],
        alignmentRoll: 31,
      });
      const snapshot = createOutcomeRenderSnapshot(outcome);
      if (!snapshot) {
        throw new Error('Expected snapshot for unusual sword');
      }
      const previews = snapshot.detail.filter(
        (
          node
        ): node is Extract<
          typeof node,
          { kind: 'table-preview'; id: string }
        > => node.kind === 'table-preview'
      );
      const specialPreview = previews.find(
        (preview) => preview.id === 'treasureSwordSpecialPurpose'
      );
      expect(specialPreview).toBeDefined();
      const powerPreviewInitial = previews.find(
        (preview) => preview.id === 'treasureSwordSpecialPurposePower'
      );
      expect(powerPreviewInitial).toBeDefined();
      const applied = applyOutcomeRoll({
        outcome,
        tableId: specialPreview?.id ?? 'treasureSwordSpecialPurpose',
        targetId: specialPreview?.targetId ?? specialPreview?.id,
        roll: 17,
        context: specialPreview?.context,
      });
      if (!applied) {
        throw new Error('Expected resolved outcome');
      }
      const afterSnapshot = applied.snapshot;
      const afterPreviews = afterSnapshot.detail.filter(
        (
          node
        ): node is Extract<
          typeof node,
          { kind: 'table-preview'; id: string }
        > => node.kind === 'table-preview'
      );
      expect(
        afterPreviews.some(
          (preview) => preview.id === 'treasureSwordSpecialPurposePower'
        )
      ).toBe(true);
      const powerPreview = afterPreviews.find(
        (preview) => preview.id === 'treasureSwordSpecialPurposePower'
      );
      expect(powerPreview).toBeDefined();
      const purposeParagraph = afterSnapshot.detail.find(
        (
          node
        ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
          node.kind === 'paragraph' &&
          node.text.startsWith("The sword's special purpose is to")
      );
      expect(purposeParagraph).toBeDefined();

      const powered = applyOutcomeRoll({
        outcome: applied.outcome,
        tableId: powerPreview?.id ?? 'treasureSwordSpecialPurposePower',
        targetId: powerPreview?.targetId ?? powerPreview?.id,
        roll: 11,
        context: powerPreview?.context,
      });
      if (!powered) {
        throw new Error('Expected resolved power outcome');
      }
      const powerSnapshot = powered.snapshot;
      const powerPreviews = powerSnapshot.detail.filter(
        (
          node
        ): node is Extract<
          typeof node,
          { kind: 'table-preview'; id: string }
        > => node.kind === 'table-preview'
      );
      expect(
        powerPreviews.some(
          (preview) => preview.id === 'treasureSwordSpecialPurposePower'
        )
      ).toBe(false);
      const powerParagraph = powerSnapshot.detail.find(
        (
          node
        ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
          node.kind === 'paragraph' &&
          node.text.startsWith('When the special purpose triggers')
      );
      expect(powerParagraph).toBeDefined();
    });

    it('supports rolling power before purpose and keeps results linked', () => {
      const baseOutcome = resolveTreasureSwordUnusual({
        roll: 100,
        sword: TreasureSword.SwordPlus2,
        extraordinaryPowerRolls: [100],
        alignmentRoll: 31,
      });
      const baseSnapshot = createOutcomeRenderSnapshot(baseOutcome);
      if (!baseSnapshot) {
        throw new Error('Expected snapshot for unusual sword outcome');
      }
      const basePreviews = baseSnapshot.detail.filter(
        (
          node
        ): node is Extract<
          typeof node,
          { kind: 'table-preview'; id: string }
        > => node.kind === 'table-preview'
      );
      const powerPreview = basePreviews.find(
        (preview) => preview.id === 'treasureSwordSpecialPurposePower'
      );
      const specialPreview = basePreviews.find(
        (preview) => preview.id === 'treasureSwordSpecialPurpose'
      );
      expect(powerPreview).toBeDefined();
      expect(specialPreview).toBeDefined();
      const powerResolved = applyOutcomeRoll({
        outcome: baseOutcome,
        tableId: powerPreview?.id ?? 'treasureSwordSpecialPurposePower',
        targetId: powerPreview?.targetId ?? powerPreview?.id,
        roll: 8,
        context: powerPreview?.context,
      });
      if (!powerResolved) {
        throw new Error('Expected power outcome resolution');
      }
      const afterPowerPreviews = powerResolved.snapshot.detail.filter(
        (
          node
        ): node is Extract<
          typeof node,
          { kind: 'table-preview'; id: string }
        > => node.kind === 'table-preview'
      );
      expect(
        afterPowerPreviews.some(
          (preview) => preview.id === 'treasureSwordSpecialPurposePower'
        )
      ).toBe(false);
      const stillNeedsPurpose = afterPowerPreviews.find(
        (preview) => preview.id === 'treasureSwordSpecialPurpose'
      );
      expect(stillNeedsPurpose).toBeDefined();

      const purposeResolved = applyOutcomeRoll({
        outcome: powerResolved.outcome,
        tableId: stillNeedsPurpose?.id ?? 'treasureSwordSpecialPurpose',
        targetId: stillNeedsPurpose?.targetId ?? stillNeedsPurpose?.id,
        roll: 12,
        context: stillNeedsPurpose?.context,
      });
      if (!purposeResolved) {
        throw new Error('Expected special purpose outcome');
      }
      const finalPreviews = purposeResolved.snapshot.detail.filter(
        (
          node
        ): node is Extract<
          typeof node,
          { kind: 'table-preview'; id: string }
        > => node.kind === 'table-preview'
      );
      expect(
        finalPreviews.some(
          (preview) => preview.id === 'treasureSwordSpecialPurposePower'
        )
      ).toBe(false);
      const finalParagraphs = purposeResolved.snapshot.detail.filter(
        (
          node
        ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
          node.kind === 'paragraph'
      );
      expect(
        finalParagraphs.some((p) =>
          p.text.startsWith("The sword's special purpose is to")
        )
      ).toBe(true);
      expect(
        finalParagraphs.some((p) =>
          p.text.startsWith('When the special purpose triggers')
        )
      ).toBe(true);
    });
  });
});
