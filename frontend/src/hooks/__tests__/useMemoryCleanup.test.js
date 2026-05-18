/**
 * Unit Tests for useMemoryCleanup Hook
 * 
 * اختبارات الـ cleanup والـ memory management
 * 
 * للتشغيل:
 * npm install --save-dev vitest @testing-library/react
 * npm test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemoryCleanup, useInterval, useTimeout, useEventListener } from '../useMemoryCleanup.js';

describe('useMemoryCleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should register and execute cleanup functions', () => {
    const cleanupFn = vi.fn();
    const { result } = renderHook(() => useMemoryCleanup());

    act(() => {
      result.current.registerCleanup(cleanupFn);
    });

    expect(cleanupFn).not.toHaveBeenCalled();

    act(() => {
      result.current.cleanup();
    });

    expect(cleanupFn).toHaveBeenCalledOnce();
  });

  it('should clear intervals on cleanup', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useMemoryCleanup());

    act(() => {
      result.current.registerInterval(callback, 1000);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledOnce();

    act(() => {
      result.current.cleanup();
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledOnce(); // Should not be called again
  });

  it('should clear timeouts on cleanup', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useMemoryCleanup());

    act(() => {
      result.current.registerTimeout(callback, 1000);
    });

    act(() => {
      result.current.cleanup();
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should remove event listeners on cleanup', () => {
    const handler = vi.fn();
    const element = document.createElement('div');
    const { result } = renderHook(() => useMemoryCleanup());

    act(() => {
      result.current.registerListener(element, 'click', handler);
    });

    element.click();
    expect(handler).toHaveBeenCalledOnce();

    act(() => {
      result.current.cleanup();
    });

    handler.mockClear();
    element.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should cleanup on component unmount', () => {
    const cleanupFn = vi.fn();
    const { unmount } = renderHook(() => {
      const { registerCleanup } = useMemoryCleanup();
      registerCleanup(cleanupFn);
    });

    expect(cleanupFn).not.toHaveBeenCalled();

    unmount();

    expect(cleanupFn).toHaveBeenCalledOnce();
  });
});

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should call callback at specified interval', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledOnce();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('should not call callback if delay is null', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, null));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();

    unmount();
  });

  it('should clear interval on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should call callback after specified delay', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledOnce();

    unmount();
  });

  it('should clear timeout on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useEventListener', () => {
  it('should add and remove event listener', () => {
    const handler = vi.fn();
    const element = document.createElement('div');

    renderHook(() => useEventListener('click', handler, element));

    element.click();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should remove listener on unmount', () => {
    const handler = vi.fn();
    const element = document.createElement('div');

    const { unmount } = renderHook(() => useEventListener('click', handler, element));

    unmount();

    handler.mockClear();
    element.click();
    expect(handler).not.toHaveBeenCalled();
  });
});
