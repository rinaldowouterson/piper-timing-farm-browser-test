/**
 * Process Logging Infrastructure for Integrated Load Verificationing
 * 
 * Provides structured, detailed logging for all process-level events
 * in the Piper Timing Farm library during load verifications.
 */

export type LogCategory = 'LIFECYCLE' | 'DOWNLOAD' | 'SYNTHESIS' | 'WORKER' | 'CACHE' | 'FIFO' | 'METADATA' | 'TEST';
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: string;
  category: LogCategory;
  level: LogLevel;
  event: string;
  modelId?: string;
  requestId?: string;
  workerId?: number;
  data: Record<string, unknown>;
  duration?: number;
  expanded: boolean;
}

export interface ProcessLogger {
  log: (entry: Omit<LogEntry, 'id' | 'timestamp' | 'expanded'>) => void;
  filterByCategory: (category: LogCategory | 'ALL') => void;
  clearLogs: () => void;
  exportLogs: () => string;
  getEntries: () => LogEntry[];
  setMaxEntries: (max: number) => void;
}

const CATEGORY_COLORS: Record<LogCategory, string> = {
  LIFECYCLE: '#3498db',
  DOWNLOAD: '#e67e22',
  SYNTHESIS: '#2ecc71',
  WORKER: '#9b59b6',
  CACHE: '#1abc9c',
  FIFO: '#f39c12',
  METADATA: '#7f8c8d',
  TEST: '#e74c3c'
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  INFO: '#8b949e',
  WARNING: '#f39c12',
  ERROR: '#e74c3c',
  SUCCESS: '#2ecc71',
  DEBUG: '#6c757d'
};

/**
 * Factory for creating a process logger bound to a DOM container.
 */
export function createProcessLogger(container: HTMLElement): ProcessLogger {
  let entries: LogEntry[] = [];
  let maxEntries = 1000;
  let currentFilter: LogCategory | 'ALL' = 'ALL';
  let entryIdCounter = 0;

  const generateId = () => `log-${++entryIdCounter}`;

  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  };

  let logTable: HTMLTableElement | null = null;
  let tbody: HTMLTableSectionElement | null = null;

  const initContainer = () => {
    if (logTable) return;
    container.innerHTML = '';
    
    logTable = document.createElement('table');
    logTable.className = 'log-flat-table';
    logTable.style.width = '100%';
    logTable.style.borderCollapse = 'collapse';
    logTable.style.fontSize = '0.65rem';
    logTable.style.fontFamily = 'var(--font-mono)';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="text-align: left; background: var(--bg-surface); color: var(--text-dim); border-bottom: 1px solid var(--border-subtle);">
        <th style="padding: 6px 4px;">Time</th>
        <th style="padding: 6px 4px;">Cat</th>
        <th style="padding: 6px 4px;">Level</th>
        <th style="padding: 6px 4px;">Event</th>
        <th style="padding: 6px 4px;">Target</th>
        <th style="padding: 6px 4px;">Req</th>
        <th style="padding: 6px 4px;">Data</th>
        <th style="padding: 6px 4px;">Dur</th>
      </tr>
    `;
    logTable.appendChild(thead);
    
    tbody = document.createElement('tbody');
    logTable.appendChild(tbody);
    container.appendChild(logTable);
  };

  const renderEntry = (entry: LogEntry): HTMLTableRowElement => {
    const row = document.createElement('tr');
    row.dataset.id = entry.id;
    row.style.borderBottom = '1px solid hsla(0, 0%, 100%, 0.05)';
    row.style.verticalAlign = 'top';
    
    const detailsObj = entry.data || {};
    const detailsStr = Object.entries(detailsObj)
        .map(([k, v]) => `<span style="color:var(--text-dim)">${k}:</span> <span style="color:#fff">${typeof v === 'object' ? escapeHtml(JSON.stringify(v)) : escapeHtml(String(v))}</span>`)
        .join(' | ');

    const target = entry.modelId ? (entry.modelId.split('-')[1] || entry.modelId) : (entry.workerId !== undefined ? `W-${entry.workerId}` : '-');

    row.innerHTML = `
      <td style="padding: 4px; color: var(--text-dim); white-space: nowrap;">${entry.timestamp}</td>
      <td style="padding: 4px; color: ${CATEGORY_COLORS[entry.category]}; font-weight: bold;">[${entry.category}]</td>
      <td style="padding: 4px; color: ${LEVEL_COLORS[entry.level]}">${entry.level}</td>
      <td style="padding: 4px; color: #fff; white-space: nowrap;">${entry.event}</td>
      <td style="padding: 4px; color: #8b949e; white-space: nowrap;">${target}</td>
      <td style="padding: 4px; color: #8b949e; white-space: nowrap;">${entry.requestId ? `#${entry.requestId.slice(-4)}` : '-'}</td>
      <td style="padding: 4px; max-width: 400px; word-break: break-word;">${detailsStr}</td>
      <td style="padding: 4px; color: #8b949e; white-space: nowrap;">${entry.duration ? `${entry.duration}ms` : '-'}</td>
    `;
    return row;
  };

  const render = () => {
    logTable = null;
    initContainer();

    const filtered = currentFilter === 'ALL' 
      ? entries 
      : entries.filter(e => e.category === currentFilter);

    // Render entries (newest first)
    const reversed = [...filtered].reverse();
    reversed.forEach(entry => {
      const element = renderEntry(entry);
      tbody!.appendChild(element);
    });

    if (filtered.length > 0) {
      const countEl = document.createElement('div');
      countEl.className = 'log-count';
      countEl.style.fontSize = '0.6rem';
      countEl.style.padding = '4px';
      countEl.style.color = 'var(--text-dim)';
      countEl.textContent = `${filtered.length} entries (${entries.length} total)`;
      container.insertBefore(countEl, container.firstChild);
    }
  };

  const log = (entry: Omit<LogEntry, 'id' | 'timestamp' | 'expanded'>) => {
    const fullEntry: LogEntry = {
      ...entry,
      id: generateId(),
      timestamp: formatTimestamp(),
      expanded: false
    };

    entries.push(fullEntry);

    if (entries.length > maxEntries) {
      entries = entries.slice(-maxEntries);
    }

    if (!logTable) initContainer();

    if (currentFilter === 'ALL' || fullEntry.category === currentFilter) {
      const element = renderEntry(fullEntry);
      
      if (tbody!.firstChild) {
        tbody!.insertBefore(element, tbody!.firstChild);
      } else {
        tbody!.appendChild(element);
      }
      
      const countEl = container.querySelector('.log-count');
      if (countEl) {
        const filteredCount = currentFilter === 'ALL' ? entries.length : entries.filter(e => e.category === currentFilter).length;
        countEl.textContent = `${filteredCount} entries (${entries.length} total)`;
      } else {
        const newCountEl = document.createElement('div');
        newCountEl.className = 'log-count';
        newCountEl.style.fontSize = '0.6rem';
        newCountEl.style.padding = '4px';
        newCountEl.style.color = 'var(--text-dim)';
        newCountEl.textContent = `1 entries (${entries.length} total)`;
        container.insertBefore(newCountEl, container.firstChild);
      }
    }

    const domEntries = tbody!.querySelectorAll('tr');
    if (domEntries.length > maxEntries) {
      for (let i = maxEntries; i < domEntries.length; i++) {
        domEntries[i].remove();
      }
    }
  };

  const filterByCategory = (category: LogCategory | 'ALL') => {
    currentFilter = category;
    render();
  };

  const clearLogs = () => {
    entries = [];
    entryIdCounter = 0;
    render();
  };

  const exportLogs = () => {
    const exportData = entries.map(e => ({
      timestamp: e.timestamp,
      category: e.category,
      level: e.level,
      event: e.event,
      modelId: e.modelId,
      requestId: e.requestId,
      workerId: e.workerId,
      data: e.data,
      duration: e.duration
    }));
    return JSON.stringify(exportData, null, 2);
  };

  const getEntries = () => [...entries];

  const setMaxEntries = (max: number) => {
    maxEntries = max;
    if (entries.length > maxEntries) {
      entries = entries.slice(-maxEntries);
      render();
    }
  };

  return {
    log,
    filterByCategory,
    clearLogs,
    exportLogs,
    getEntries,
    setMaxEntries
  };
}

/**
 * Helper functions for common log events
 */
export const LogHelpers = {
  lifecycle: {
    providerCreated: (logger: ProcessLogger) => 
      logger.log({ category: 'LIFECYCLE', level: 'INFO', event: 'PROVIDER_CREATED', data: {} }),
    
    initRequested: (logger: ProcessLogger, modelId: string, cpuInstances: number) =>
      logger.log({ category: 'LIFECYCLE', level: 'INFO', event: 'INIT_REQUESTED', modelId, data: { cpuInstances } }),
    
    initStaleCheck: (logger: ProcessLogger, latestId: string, currentId: string) =>
      logger.log({ category: 'LIFECYCLE', level: 'DEBUG', event: 'INIT_STALE_CHECK', data: { latestRequestId: latestId, currentRequestId: currentId } }),
    
    promotionComplete: (logger: ProcessLogger, modelId: string, workerCount: number) =>
      logger.log({ category: 'LIFECYCLE', level: 'SUCCESS', event: 'PROMOTION_COMPLETE', modelId, data: { workerCount } }),
    
    providerTerminated: (logger: ProcessLogger, activeModelId: string | null) =>
      logger.log({ category: 'LIFECYCLE', level: 'WARNING', event: 'PROVIDER_TERMINATED', data: { activeModelId } }),
  },

  download: {
    queued: (logger: ProcessLogger, modelId: string) =>
      logger.log({ category: 'DOWNLOAD', level: 'INFO', event: 'DOWNLOAD_QUEUED', modelId, data: {} }),
    
    started: (logger: ProcessLogger, modelId: string, url: string, expectedSize?: number) =>
      logger.log({ category: 'DOWNLOAD', level: 'INFO', event: 'DOWNLOAD_STARTED', modelId, data: { url, expectedSize } }),
    
    paused: (logger: ProcessLogger, modelId: string, bytesDownloaded: number, reason: string) =>
      logger.log({ category: 'DOWNLOAD', level: 'WARNING', event: 'DOWNLOAD_PAUSED', modelId, data: { bytesDownloaded, reason } }),
    
    resumed: (logger: ProcessLogger, modelId: string, resumeFromByte: number) =>
      logger.log({ category: 'DOWNLOAD', level: 'INFO', event: 'DOWNLOAD_RESUMED', modelId, data: { resumeFromByte } }),
    
    progress: (logger: ProcessLogger, modelId: string, progress: number, bytesDownloaded: number, bytesTotal: number) =>
      logger.log({ category: 'DOWNLOAD', level: 'DEBUG', event: 'DOWNLOAD_PROGRESS', modelId, data: { progress, bytesDownloaded, bytesTotal, percent: `${Math.round(progress * 100)}%` } }),
    
    complete: (logger: ProcessLogger, modelId: string, duration: number, finalSize: number) =>
      logger.log({ category: 'DOWNLOAD', level: 'SUCCESS', event: 'DOWNLOAD_COMPLETE', modelId, duration, data: { finalSize } }),
    
    cancelled: (logger: ProcessLogger, modelId: string, bytesPurged: number) =>
      logger.log({ category: 'DOWNLOAD', level: 'WARNING', event: 'DOWNLOAD_CANCELLED', modelId, data: { bytesPurged } }),
    
    sha256VerifyPass: (logger: ProcessLogger, modelId: string, verifiedHash: string) =>
      logger.log({ category: 'DOWNLOAD', level: 'SUCCESS', event: 'SHA256_VERIFY_PASS', modelId, data: { verifiedHash } }),
    
    sha256VerifyFail: (logger: ProcessLogger, modelId: string, expected: string, actual: string) =>
      logger.log({ category: 'DOWNLOAD', level: 'ERROR', event: 'SHA256_VERIFY_FAIL', modelId, data: { expected, actual } }),
  },

  synthesis: {
    requested: (logger: ProcessLogger, requestId: string, text: string, speakerId?: number, speed?: number, volume?: number) =>
      logger.log({ category: 'SYNTHESIS', level: 'INFO', event: 'SYNTH_REQUESTED', requestId, data: { textPreview: text.slice(0, 50), textLength: text.length, speakerId, speed, volume } }),
    
    queued: (logger: ProcessLogger, requestId: string, queuePosition: number, queueLength: number) =>
      logger.log({ category: 'SYNTHESIS', level: 'DEBUG', event: 'SYNTH_QUEUED', requestId, data: { queuePosition, queueLength } }),
    
    resultReady: (logger: ProcessLogger, requestId: string, modelId: string, audioDurationMs: number, generationTimeMs: number) =>
      logger.log({ category: 'SYNTHESIS', level: 'SUCCESS', event: 'SYNTH_RESULT_READY', requestId, modelId, duration: generationTimeMs, data: { audioDurationMs } }),
    
    fifoWait: (logger: ProcessLogger, requestId: string, blockingRequestIds: string[]) =>
      logger.log({ category: 'SYNTHESIS', level: 'DEBUG', event: 'SYNTH_FIFO_WAIT', requestId, data: { blockingRequestIds } }),
    
    fifoDrain: (logger: ProcessLogger, requestId: string, waitTimeMs: number) =>
      logger.log({ category: 'SYNTHESIS', level: 'INFO', event: 'SYNTH_FIFO_DRAIN', requestId, duration: waitTimeMs, data: {} }),
  },

  worker: {
    spawned: (logger: ProcessLogger, workerId: number, targetModelId: string) =>
      logger.log({ category: 'WORKER', level: 'INFO', event: 'WORKER_SPAWNED', workerId, modelId: targetModelId, data: {} }),
    
    ready: (logger: ProcessLogger, workerId: number, modelId: string) =>
      logger.log({ category: 'WORKER', level: 'SUCCESS', event: 'WORKER_READY', workerId, modelId, data: {} }),
    
    assigned: (logger: ProcessLogger, workerId: number, requestId: string, textPreview: string) =>
      logger.log({ category: 'WORKER', level: 'DEBUG', event: 'WORKER_ASSIGNED', workerId, requestId, data: { textPreview } }),
    
    complete: (logger: ProcessLogger, workerId: number, requestId: string, durationMs: number) =>
      logger.log({ category: 'WORKER', level: 'INFO', event: 'WORKER_COMPLETE', workerId, requestId, duration: durationMs, data: {} }),
    
    retired: (logger: ProcessLogger, workerId: number, reason: string) =>
      logger.log({ category: 'WORKER', level: 'WARNING', event: 'WORKER_RETIRED', workerId, data: { reason } }),
    
    poolState: (logger: ProcessLogger, activeCount: number, idleCount: number, busyCount: number) =>
      logger.log({ category: 'WORKER', level: 'DEBUG', event: 'POOL_STATE', data: { activeCount, idleCount, busyCount, total: activeCount + idleCount + busyCount } }),
  },

  cache: {
    opfsCheckStart: (logger: ProcessLogger, modelId: string, filename: string) =>
      logger.log({ category: 'CACHE', level: 'DEBUG', event: 'OPFS_CHECK_START', modelId, data: { filename } }),
    
    opfsCheckFound: (logger: ProcessLogger, modelId: string, filename: string, fileSize: number) =>
      logger.log({ category: 'CACHE', level: 'INFO', event: 'OPFS_CHECK_FOUND', modelId, data: { filename, fileSize } }),
    
    opfsCheckMiss: (logger: ProcessLogger, modelId: string, filename: string) =>
      logger.log({ category: 'CACHE', level: 'INFO', event: 'OPFS_CHECK_MISS', modelId, data: { filename } }),
    
    opfsClearStart: (logger: ProcessLogger) =>
      logger.log({ category: 'CACHE', level: 'WARNING', event: 'OPFS_CLEAR_START', data: { reason: 'Manual or test reset' } }),
    
    opfsClearComplete: (logger: ProcessLogger, filesDeleted: number) =>
      logger.log({ category: 'CACHE', level: 'SUCCESS', event: 'OPFS_CLEAR_COMPLETE', data: { filesDeleted } }),
  },

  fifo: {
    enqueue: (logger: ProcessLogger, requestId: string, position: number, totalQueued: number) =>
      logger.log({ category: 'FIFO', level: 'DEBUG', event: 'FIFO_ENQUEUE', requestId, data: { position, totalQueued } }),
    
    drain: (logger: ProcessLogger, requestId: string, position: number, totalWaitMs: number) =>
      logger.log({ category: 'FIFO', level: 'INFO', event: 'FIFO_DRAIN', requestId, duration: totalWaitMs, data: { position } }),
    
    verifyComplete: (logger: ProcessLogger, passed: boolean, requestOrder: string[], resultOrder: string[]) =>
      logger.log({ category: 'FIFO', level: passed ? 'SUCCESS' : 'ERROR', event: 'FIFO_VERIFY_COMPLETE', data: { passed, requestOrderLength: requestOrder.length, resultOrderLength: resultOrder.length, mismatches: passed ? 0 : requestOrder.filter((id, i) => resultOrder[i] !== id).length } }),
  },

  metadata: {
    phonemes: (logger: ProcessLogger, requestId: string, phonemeCount: number, phonemeSymbols?: string[]) =>
      logger.log({ category: 'METADATA', level: 'DEBUG', event: 'METADATA_PHONEMES', requestId, data: { phonemeCount, phonemeSymbolsPreview: phonemeSymbols?.slice(0, 10) } }),
    
    durations: (logger: ProcessLogger, requestId: string, durationCount: number, totalDurationMs: number) =>
      logger.log({ category: 'METADATA', level: 'DEBUG', event: 'METADATA_DURATIONS', requestId, data: { durationCount, totalDurationMs } }),
    
    speakerId: (logger: ProcessLogger, requestId: string, requestedId: number, actualId: number) =>
      logger.log({ category: 'METADATA', level: 'INFO', event: 'METADATA_SPEAKER_ID', requestId, data: { requestedId, actualId, fallback: requestedId !== actualId } }),
  },

  test: {
    scenarioStart: (logger: ProcessLogger, scenarioId: string, scenarioName: string) =>
      logger.log({ category: 'TEST', level: 'WARNING', event: 'TEST_SCENARIO_START', data: { scenarioId, scenarioName } }),
    
    scenarioPass: (logger: ProcessLogger, scenarioId: string, duration: number, eventsLogged: number) =>
      logger.log({ category: 'TEST', level: 'SUCCESS', event: 'TEST_SCENARIO_PASS', duration, data: { scenarioId, eventsLogged } }),
    
    scenarioFail: (logger: ProcessLogger, scenarioId: string, error: string, duration: number) =>
      logger.log({ category: 'TEST', level: 'ERROR', event: 'TEST_SCENARIO_FAIL', duration, data: { scenarioId, error } }),
    
    assertion: (logger: ProcessLogger, scenarioId: string, assertionName: string, passed: boolean, expected: unknown, actual: unknown) =>
      logger.log({ category: 'TEST', level: passed ? 'SUCCESS' : 'ERROR', event: 'TEST_ASSERTION', data: { scenarioId, assertionName, passed, expected, actual } }),
  }
};