import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

const DEFAULT_ITEM_HEIGHT = 520;
const OVERSCAN = 4;

function Row({ index, style, data }) {
  const { items, renderItem, setItemSize, listWidth } = data;
  const item = items[index];
  const rowRef = useRef(null);

  useEffect(() => {
    if (!rowRef.current || typeof ResizeObserver === 'undefined') return undefined;
    const element = rowRef.current;
    const observer = new ResizeObserver((entries) => {
      const height = Math.ceil(entries?.[0]?.contentRect?.height || DEFAULT_ITEM_HEIGHT);
      setItemSize(index, height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [index, setItemSize]);

  return (
    <div style={{ ...style, width: '100%', padding: '0 0 16px' }}>
      <div ref={rowRef} style={{ width: listWidth ? `${listWidth}px` : '100%' }}>
        {renderItem(item, index)}
      </div>
    </div>
  );
}

export default function VirtualizedInfiniteFeed({
  items = [],
  renderItem,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  height = '72vh',
  estimatedItemHeight = DEFAULT_ITEM_HEIGHT,
  emptyState = null,
}) {
  const listRef = useRef(null);
  const sizeMapRef = useRef(new Map());
  const [listWidth, setListWidth] = useState(0);
  // ✅ v59.13.7 FIX #5: تتبّع requestAnimationFrame + isMounted
  // المشكلة: الكود يستدعي window.requestAnimationFrame(() => setListWidth(width)) داخل render
  // دون تخزين معرّف الـ rAF ودون إلغائه عند unmount، فيتسبب في:
  //   - setState بعد unmount (تحذير React)
  //   - rAFات متعددة تتراكم عند إعادة تحجيم سريعة (resize)
  const rafIdRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rafIdRef.current != null) {
        try { window.cancelAnimationFrame(rafIdRef.current); } catch { /* ignore */ }
        rafIdRef.current = null;
      }
    };
  }, []);

  const setItemSize = useCallback((index, size) => {
    const prev = sizeMapRef.current.get(index);
    if (prev === size) return;
    sizeMapRef.current.set(index, size);
    listRef.current?.resetAfterIndex(index);
  }, []);

  const getItemSize = useCallback((index) => sizeMapRef.current.get(index) || estimatedItemHeight, [estimatedItemHeight]);

  const itemData = useMemo(() => ({
    items,
    renderItem,
    setItemSize,
    listWidth,
  }), [items, renderItem, setItemSize, listWidth]);

  const handleItemsRendered = useCallback(({ visibleStopIndex }) => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (visibleStopIndex >= Math.max(0, items.length - 3)) {
      fetchNextPage?.();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, items.length]);

  if (!items.length) return emptyState;

  return (
    <div style={{ height, minHeight: 420 }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => {
          if (!autoHeight || !width) return null;
          if (listWidth !== width) {
            // ✅ v59.13.7 FIX #5: ألغ أي rAF سابق قبل جدولة واحد جديد (تجنّب التراكم)
            // وفحص isMounted داخل الـ callback لمنع setState بعد unmount.
            if (rafIdRef.current != null) {
              try { window.cancelAnimationFrame(rafIdRef.current); } catch { /* ignore */ }
            }
            rafIdRef.current = window.requestAnimationFrame(() => {
              rafIdRef.current = null;
              if (!isMountedRef.current) return;
              setListWidth(width);
            });
          }
          return (
            <List
              ref={listRef}
              height={autoHeight}
              width={width}
              itemCount={items.length}
              itemData={itemData}
              itemSize={getItemSize}
              overscanCount={OVERSCAN}
              onItemsRendered={handleItemsRendered}
            >
              {Row}
            </List>
          );
        }}
      </AutoSizer>
    </div>
  );
}
