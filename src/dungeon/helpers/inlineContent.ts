import type {
  DungeonInlineContent,
  DungeonInlineSegment,
} from '../../types/dungeon';

export type InlineText = {
  text: string;
  inline?: DungeonInlineContent;
};

type InlinePart = string | DungeonInlineContent | InlineText;

export function emphasizeInlineText(text: string, phrase?: string): InlineText {
  if (!phrase || phrase.trim().length === 0) return { text };
  const inline = emphasizeInlinePhrase(text, phrase);
  return hasStrongSegments(inline) ? { text, inline } : { text };
}

export function joinSentenceInlineTexts(
  parts: Array<string | InlineText | undefined>
): InlineText {
  const contents = parts
    .map((part) => normalizeSentenceContent(toInlineContent(part)))
    .filter((content) => content.length > 0);

  if (contents.length === 0) return { text: '' };

  const inline = joinInlineContents(contents, ' ');
  const text = inlineContentToText(inline);
  return hasStrongSegments(inline) ? { text, inline } : { text };
}

export function extractLeadingItemPhrase(text: string): string | undefined {
  const trimmed = text.trim();
  const patterns = [
    /^There is an? (.+?)\.(?:\s|$)/,
    /^There is (.+?)\.(?:\s|$)/,
    /^There are \d+\s+(.+?)\.(?:\s|$)/,
    /^(.+?) is here\.(?:\s|$)/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function inlineContentToText(content: DungeonInlineContent): string {
  return content.map((segment) => segment.text).join('');
}

function emphasizeInlinePhrase(
  text: string,
  phrase: string
): DungeonInlineContent {
  if (text.length === 0 || phrase.length === 0) {
    return [{ kind: 'text', text }];
  }

  const segments: DungeonInlineContent = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = text.indexOf(phrase, cursor);
    if (matchIndex < 0) {
      pushSegment(segments, 'text', text.slice(cursor));
      break;
    }

    pushSegment(segments, 'text', text.slice(cursor, matchIndex));
    pushSegment(segments, 'strong', phrase);
    cursor = matchIndex + phrase.length;
  }

  return segments;
}

function normalizeSentenceContent(
  content: DungeonInlineContent
): DungeonInlineContent {
  const normalized = cloneContent(content);
  trimContent(normalized);
  if (normalized.length === 0) return normalized;
  const last = normalized[normalized.length - 1];
  if (last && !/[.!?:;]$/.test(last.text)) {
    last.text += '.';
  }
  return normalized;
}

function toInlineContent(part?: InlinePart): DungeonInlineContent {
  if (part === undefined) return [];
  if (typeof part === 'string') {
    return part.length > 0 ? [{ kind: 'text', text: part }] : [];
  }
  if (Array.isArray(part)) {
    return cloneContent(part);
  }
  return part.inline ? cloneContent(part.inline) : toInlineContent(part.text);
}

function joinInlineContents(
  contents: DungeonInlineContent[],
  separator: string
): DungeonInlineContent {
  const joined: DungeonInlineContent = [];
  contents.forEach((content, index) => {
    if (index > 0) {
      pushSegment(joined, 'text', separator);
    }
    content.forEach((segment) =>
      pushSegment(joined, segment.kind, segment.text)
    );
  });
  return joined;
}

function hasStrongSegments(content: DungeonInlineContent): boolean {
  return content.some(
    (segment) => segment.kind === 'strong' && segment.text.length > 0
  );
}

function cloneContent(content: DungeonInlineContent): DungeonInlineContent {
  return content
    .filter((segment) => segment.text.length > 0)
    .map((segment) => ({ ...segment }));
}

function trimContent(content: DungeonInlineContent): void {
  while (content.length > 0) {
    const first = content[0];
    if (!first) break;
    first.text = first.text.replace(/^\s+/, '');
    if (first.text.length > 0) break;
    content.shift();
  }

  while (content.length > 0) {
    const last = content[content.length - 1];
    if (!last) break;
    last.text = last.text.replace(/\s+$/, '');
    if (last.text.length > 0) break;
    content.pop();
  }
}

function pushSegment(
  segments: DungeonInlineContent,
  kind: DungeonInlineSegment['kind'],
  text: string
): void {
  if (text.length === 0) return;
  const last = segments[segments.length - 1];
  if (last && last.kind === kind) {
    last.text += text;
    return;
  }
  segments.push({ kind, text });
}
