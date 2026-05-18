import { useEffect, useMemo, useState } from 'react';

const OVERSCAN_PX = 600;
const DEFAULT_HEIGHT = 84;

function estimateMessageHeight(message) {
  const text = String(message?.message || message?.content || '');
  const lines = Math.max(1, Math.ceil(text.length / 34));
  let height = 48 + (lines * 22);
  if (message?.type === 'image') height += 240;
  if (message?.type === 'video') height += 280;
  if (message?.type === 'audio') height += 70;
  if (message?.type === 'file') height += 48;
  if (message?.deleted) height = Math.max(height, 72);
  return Math.max(DEFAULT_HEIGHT, Math.min(height, 420));
}

function findStartIndex(items, scrollTop) {
  let low = 0;
  let high = items.length - 1;
  let candidate = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (items[mid].offsetTop <= scrollTop) {
      candidate = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return candidate;
}

export default function VirtualMessageList({
  items,
  scrollRef,
  renderItem,
  typing,
  typingNode,
  bottomRef,
}) {
  const [viewport, setViewport] = useState({ scrollTop: 0, height: 720 });

  useEffect(() => {
    const node = scrollRef?.current;
    if (!node) return undefined;

    const sync = () => {
      setViewport({
        scrollTop: node.scrollTop,
        height: node.clientHeight || 720,
      });
    };

    sync();
    node.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      node.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [scrollRef]);

  const metrics = useMemo(() => {
    let offsetTop = 0;
    const rows = items.map((item, index) => {
      const height = estimateMessageHeight(item);
      const row = { item, index, height, offsetTop };
      offsetTop += height;
      return row;
    });
    return {
      rows,
      totalHeight: offsetTop,
    };
  }, [items]);

  const visibleRows = useMemo(() => {
    if (!metrics.rows.length) return [];
    const startAt = Math.max(0, viewport.scrollTop - OVERSCAN_PX);
    const endAt = viewport.scrollTop + viewport.height + OVERSCAN_PX;
    let startIndex = findStartIndex(metrics.rows, startAt);
    let endIndex = startIndex;
    while (endIndex < metrics.rows.length && metrics.rows[endIndex].offsetTop < endAt) {
      endIndex += 1;
    }
    return metrics.rows.slice(Math.max(0, startIndex - 2), Math.min(metrics.rows.length, endIndex + 2));
  }, [metrics.rows, viewport.height, viewport.scrollTop]);

  return (
    <div style={{ position: 'relative', height: metrics.totalHeight + (typing ? 48 : 16) }}>
      {visibleRows.map((row) => (
        <div
          key={row.item.id || row.item.client_id || row.index}
          style={{
            position: 'absolute',
            top: row.offsetTop,
            left: 0,
            right: 0,
          }}
        >
          {renderItem(row.item)}
        </div>
      ))}
      {typing ? (
        <div style={{ position: 'absolute', top: metrics.totalHeight + 8, left: 0, right: 0 }}>
          {typingNode}
        </div>
      ) : null}
      <div ref={bottomRef} style={{ position: 'absolute', top: metrics.totalHeight + (typing ? 48 : 8), height: 1, width: '100%' }} />
    </div>
  );
}
