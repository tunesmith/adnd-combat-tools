import { doorLocationMessages } from '../../dungeon/services/closedDoorResult';
import { periodicDoorOnlyMessages } from '../../dungeon/services/periodicDoorOnly';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../types/dungeon';

function isPreview(n: DungeonRenderNode): n is DungeonTablePreview {
  return n.kind === 'table-preview';
}

describe('detail rendering for door chains', () => {
  it('doorLocation preview uses sequence 0 when no context', () => {
    const { messages } = doorLocationMessages({ detailMode: true });
    const preview = messages.find(isPreview);
    expect(preview).toBeTruthy();
    expect(preview?.id).toBe('doorLocation:0');
  });

  it('doorLocation Left schedules periodicCheckDoorOnly:0 with updated context', () => {
    const { messages } = doorLocationMessages({
      roll: 1,
      detailMode: true,
      context: { kind: 'doorChain', existing: [] },
    });
    const preview = messages.find(isPreview);
    expect(preview).toBeTruthy();
    expect(preview?.id).toBe('periodicCheckDoorOnly:0');
    expect(preview?.context && (preview.context as any).existing).toEqual([
      'Left',
    ]);
  });

  it('doorLocation Right repeat ends chain with no more doors paragraph', () => {
    const { messages } = doorLocationMessages({
      roll: 12,
      detailMode: true,
      context: { kind: 'doorChain', existing: ['Right'] },
    });
    const paragraph = messages.find(
      (m): m is Extract<DungeonRenderNode, { kind: 'paragraph' }> =>
        m.kind === 'paragraph' && m.text.startsWith('There are no more doors')
    );
    expect(paragraph).toBeTruthy();
    expect(messages.some(isPreview)).toBe(false);
  });

  it('doorLocation Ahead ends chain without periodic preview', () => {
    const { messages } = doorLocationMessages({
      roll: 20,
      detailMode: true,
      context: { kind: 'doorChain', existing: ['Left'] },
    });
    expect(messages.some(isPreview)).toBe(false);
  });

  it('periodicDoorOnly preview honors context sequence index', () => {
    const { messages } = periodicDoorOnlyMessages({
      detailMode: true,
      context: { kind: 'doorChain', existing: ['Left'] },
    });
    const preview = messages.find(isPreview);
    expect(preview).toBeTruthy();
    expect(preview?.id).toBe('periodicCheckDoorOnly:1');
  });

  it('periodicDoorOnly Door schedules doorLocation:<seq> with same context', () => {
    const { messages } = periodicDoorOnlyMessages({
      roll: 3,
      detailMode: true,
      context: { kind: 'doorChain', existing: ['Left', 'Right'] },
    });
    const preview = messages.find(isPreview);
    expect(preview).toBeTruthy();
    expect(preview?.id).toBe('doorLocation:2');
    expect(preview?.context && (preview.context as any).existing).toEqual([
      'Left',
      'Right',
    ]);
  });

  it('periodicDoorOnly Ignore yields paragraph and no next preview', () => {
    const { messages } = periodicDoorOnlyMessages({
      roll: 1,
      detailMode: true,
      context: { kind: 'doorChain', existing: ['Left'] },
    });
    const paragraph = messages.find(
      (m): m is Extract<DungeonRenderNode, { kind: 'paragraph' }> =>
        m.kind === 'paragraph' && m.text.startsWith('Ignored')
    );
    expect(paragraph).toBeTruthy();
    expect(messages.some(isPreview)).toBe(false);
  });
});
