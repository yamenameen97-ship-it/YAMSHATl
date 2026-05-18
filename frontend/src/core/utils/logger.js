/**
 * Unified Logger
 * 
 * Provides:
 * - Centralized logging
 * - Multiple log levels
 * - Structured logging
 * - Log persistence
 * - Performance monitoring
 */

// ============================================
// Log Levels
// ============================================

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

const LOG_COLORS = {
  DEBUG: '#7c3aed',
  INFO: '#06b6d4',
  WARN: '#f59e0b',
  ERROR: '#ef4444',
  FATAL: '#dc2626',
};

// ============================================
// Logger
// ============================================

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.minLevel = LOG_LEVELS.DEBUG;
    this.enableConsole = true;
    this.enableStorage = true;
    this.enablePerformance = true;
    this.listeners = [];
  }

  // ============================================
  // Configuration
  // ============================================

  setMinLevel(level) {
    this.minLevel = typeof level === 'string' ? LOG_LEVELS[level] : level;
  }

  setMaxLogs(max) {
    this.maxLogs = max;
  }

  setConsoleOutput(enabled) {
    this.enableConsole = enabled;
  }

  setStorageOutput(enabled) {
    this.enableStorage = enabled;
  }

  setPerformanceMonitoring(enabled) {
    this.enablePerformance = enabled;
  }

  // ============================================
  // Logging Methods
  // ============================================

  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  error(message, data = {}) {
    this.log('ERROR', message, data);
  }

  fatal(message, data = {}) {
    this.log('FATAL', message, data);
  }

  log(level, message, data = {}) {
    const levelValue = LOG_LEVELS[level];

    // Check if should log
    if (levelValue < this.minLevel) {
      return;
    }

    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };

    // Add to logs array
    this.logs.push(logEntry);

    // Maintain max logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console
    if (this.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Output to storage
    if (this.enableStorage) {
      this.logToStorage(logEntry);
    }

    // Notify listeners
    this.notifyListeners(logEntry);
  }

  // ============================================
  // Console Output
  // ============================================

  logToConsole(logEntry) {
    const { level, message, data } = logEntry;
    const color = LOG_COLORS[level];
    const style = `color: ${color}; font-weight: bold;`;

    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    if (Object.keys(data).length > 0) {
      console.log(
        `%c[${timestamp}] ${level}`,
        style,
        message,
        data
      );
    } else {
      console.log(
        `%c[${timestamp}] ${level}`,
        style,
        message
      );
    }
  }

  // ============================================
  // Storage Output
  // ============================================

  logToStorage(logEntry) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const key = 'app_logs';
      let logs = [];

      try {
        const stored = window.localStorage.getItem(key);
        if (stored) {
          logs = JSON.parse(stored);
        }
      } catch (err) {
        logs = [];
      }

      logs.push(logEntry);

      // Keep only last 100 logs in storage
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }

      window.localStorage.setItem(key, JSON.stringify(logs));
    } catch (err) {
      // Silently fail if storage is full or unavailable
    }
  }

  // ============================================
  // Performance Monitoring
  // ============================================

  time(label) {
    if (!this.enablePerformance) return;

    const startTime = performance.now();
    const timers = window.__loggerTimers || {};
    timers[label] = startTime;
    window.__loggerTimers = timers;
  }

  timeEnd(label) {
    if (!this.enablePerformance) return;

    const timers = window.__loggerTimers || {};
    const startTime = timers[label];

    if (!startTime) {
      this.warn(`Timer "${label}" not found`);
      return;
    }

    const duration = performance.now() - startTime;
    this.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`, { duration });

    delete timers[label];
  }

  measure(label, fn) {
    if (!this.enablePerformance) {
      return fn();
    }

    this.time(label);
    try {
      return fn();
    } finally {
      this.timeEnd(label);
    }
  }

  async measureAsync(label, fn) {
    if (!this.enablePerformance) {
      return fn();
    }

    this.time(label);
    try {
      return await fn();
    } finally {
      this.timeEnd(label);
    }
  }

  // ============================================
  // Log Retrieval
  // ============================================

  getLogs(level = null) {
    if (!level) {
      return this.logs;
    }

    return this.logs.filter(log => log.level === level);
  }

  getRecentLogs(count = 10) {
    return this.logs.slice(-count);
  }

  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  searchLogs(query) {
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(query.toLowerCase()) ||
      JSON.stringify(log.data).toLowerCase().includes(query.toLowerCase())
    );
  }

  // ============================================
  // Log Management
  // ============================================

  clearLogs() {
    this.logs = [];

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('app_logs');
      }
    } catch (err) {
      // Silently fail
    }
  }

  exportLogs(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Message', 'Data'];
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.message,
        JSON.stringify(log.data),
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csv;
    }

    return this.logs;
  }

  downloadLogs(format = 'json') {
    const content = this.exportLogs(format);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${Date.now()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ============================================
  // Listeners
  // ============================================

  subscribe(listener) {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  notifyListeners(logEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (err) {
        // Silently fail to avoid infinite loops
      }
    });
  }

  // ============================================
  // Statistics
  // ============================================

  getStatistics() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp,
    };

    Object.keys(LOG_LEVELS).forEach(level => {
      stats.byLevel[level] = this.logs.filter(log => log.level === level).length;
    });

    return stats;
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const logger = new Logger();

// Set default min level based on environment
if (import.meta.env.PROD) {
  logger.setMinLevel('INFO');
}

export default logger;
