/**
 * Memory Cleanup Utility
 * Provides functions to help manage memory usage in a web application,
 * particularly useful for single-page applications to prevent memory leaks.
 */

const registeredCleanups = new Map();

/**
 * Registers a cleanup function to be called when a component unmounts or a scope is exited.
 * @param {string} id - A unique identifier for the cleanup task (e.g., component ID, scope name).
 * @param {Function} cleanupFn - The function to execute for cleanup.
 */
export const registerCleanup = (id, cleanupFn) => {
  if (typeof cleanupFn !== 'function') {
    console.error('[MemoryCleanup] Cleanup function must be a function.');
    return;
  }
  if (registeredCleanups.has(id)) {
    console.warn(`[MemoryCleanup] Cleanup ID '${id}' already registered. Overwriting.`);
  }
  registeredCleanups.set(id, cleanupFn);
  console.log(`[MemoryCleanup] Registered cleanup for ID: ${id}`);
};

/**
 * Executes and unregisters a specific cleanup function.
 * @param {string} id - The unique identifier of the cleanup task to execute.
 */
export const executeCleanup = (id) => {
  const cleanupFn = registeredCleanups.get(id);
  if (cleanupFn) {
    try {
      cleanupFn();
      console.log(`[MemoryCleanup] Executed cleanup for ID: ${id}`);
    } catch (error) {
      console.error(`[MemoryCleanup] Error executing cleanup for ID '${id}':`, error);
    }
    registeredCleanups.delete(id);
  } else {
    console.warn(`[MemoryCleanup] No cleanup registered for ID: ${id}`);
  }
};

/**
 * Executes all registered cleanup functions and clears the registry.
 * Useful for full application unmounts or major state resets.
 */
export const cleanupAll = () => {
  console.log('[MemoryCleanup] Executing all registered cleanups...');
  registeredCleanups.forEach((cleanupFn, id) => {
    try {
      cleanupFn();
      console.log(`[MemoryCleanup] Executed cleanup for ID: ${id}`);
    } catch (error) {
      console.error(`[MemoryCleanup] Error executing cleanup for ID '${id}':`, error);
    }
  });
  registeredCleanups.clear();
  console.log('[MemoryCleanup] All cleanups executed and registry cleared.');
};

/**
 * Utility to remove event listeners to prevent memory leaks.
 * @param {EventTarget} target - The DOM element or other event target.
 * @param {string} eventType - The type of event (e.g., 'click', 'scroll').
 * @param {Function} listener - The event listener function to remove.
 * @param {Object} options - Options passed to removeEventListener.
 */
export const removeEventListenerSafe = (target, eventType, listener, options) => {
  if (target && typeof target.removeEventListener === 'function') {
    target.removeEventListener(eventType, listener, options);
  }
};

/**
 * Utility to clear timeouts and intervals.
 * @param {number} timerId - The ID returned by setTimeout or setInterval.
 * @param {'timeout' | 'interval'} type - The type of timer ('timeout' or 'interval').
 */
export const clearTimerSafe = (timerId, type = 'timeout') => {
  if (typeof timerId === 'number') {
    if (type === 'timeout') {
      clearTimeout(timerId);
    } else if (type === 'interval') {
      clearInterval(timerId);
    }
  }
};

/**
 * Example Usage (within a React component):
 * import React, { useEffect } from 'react';
 * import { registerCleanup, executeCleanup } from '../utils/memoryCleanup';
 *
 * const MyComponent = () => {
 *   useEffect(() => {
 *     const timer = setInterval(() => console.log('tick'), 1000);
 *     registerCleanup('my-component-timer', () => clearInterval(timer));
 *
 *     const handleClick = () => console.log('clicked');
 *     document.addEventListener('click', handleClick);
 *     registerCleanup('my-component-click', () => document.removeEventListener('click', handleClick));
 *
 *     return () => {
 *       executeCleanup('my-component-timer');
 *       executeCleanup('my-component-click');
 *     };
 *   }, []);
 *
 *   return <div>My Component</div>;
 * };
 */
