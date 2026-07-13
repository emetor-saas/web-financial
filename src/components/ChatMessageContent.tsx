import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Força quebras antes de itens enumerados/tópicos que a IA colou na mesma linha.
 * Ex.: "passos: 1) A 2) B" → "passos:\n1) A\n2) B"
 */
export function normalizeListBreaks(text: string): string {
  let out = text.replace(/\r\n/g, '\n').trim();

  // "1) Item 2) Item" ou "1. Item 2. Item" (não no início da string)
  out = out.replace(/([^\n])\s+(?=\d{1,2}[.)]\s+)/g, '$1\n');
  // "- item - item" / "• item • item" / "* item * item" mid-line
  out = out.replace(/([^\n])\s+(?=[-•*]\s+\S)/g, '$1\n');

  return out;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-foreground">
          {bold[1]}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-t-${i}`}>{part}</span>;
  });
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'ol' | 'ul'; items: string[] };

function parseBlocks(text: string): Block[] {
  const lines = normalizeListBreaks(text).split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { type: 'ol' | 'ul'; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length === 0) return;
    blocks.push({ type: 'p', text: para.join(' ').trim() });
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }

    const ol = line.match(/^\d{1,2}[.)]\s+(.+)$/);
    const ul = line.match(/^[-•*]\s+(.+)$/);

    if (ol) {
      flushPara();
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    if (ul) {
      flushPara();
      if (!list || list.type !== 'ul') {
        flushList();
        list = { type: 'ul', items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }

    flushList();
    para.push(line);
  }

  flushPara();
  flushList();
  return blocks;
}

export function ChatMessageContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseBlocks(content);

  return (
    <div className={cn('space-y-2.5', className)}>
      {blocks.map((block, i) => {
        if (block.type === 'p') {
          return (
            <p key={`p-${i}`} className="whitespace-pre-wrap leading-relaxed">
              {renderInline(block.text, `p-${i}`)}
            </p>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={`ol-${i}`} className="list-decimal list-outside ml-4 space-y-1.5">
              {block.items.map((item, j) => (
                <li key={`ol-${i}-${j}`} className="leading-relaxed pl-1">
                  {renderInline(item, `ol-${i}-${j}`)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={`ul-${i}`} className="list-disc list-outside ml-4 space-y-1.5">
            {block.items.map((item, j) => (
              <li key={`ul-${i}-${j}`} className="leading-relaxed pl-1">
                {renderInline(item, `ul-${i}-${j}`)}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
