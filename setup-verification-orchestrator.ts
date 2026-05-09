/**
 * Integrated Load Verification Runner for Piper Timing Farm
 * 
 * Unified Verification Control Panel Orchestrator
 */

import { createPiperProvider } from 'piper-timing-farm-browser';
import { playRawAudio, stopAudio } from './process-audio-playback';
import { createAudioSequencer } from './control-audio-sequencer';
import { AudioSynthesisResult, DownloadState } from 'piper-timing-farm-browser';
import { createProcessLogger, ProcessLogger, LogHelpers } from './process-logging';
import { createFifoVerifier, FifoVerifier } from './control-fifo-verifier';
import { stressScenarios } from './src/scenarios/resolve-stress-scenarios';
import { extendedScenarios } from './src/scenarios/setup-extended-scenarios';
import { TestScenario } from './src/scenarios/types';
import { DashboardState } from './types/ui-state';
import { renderDashboard } from './src/utils/resolve-dashboard-updates';

// ============================================
// UI Elements
// ============================================

const btnInit = document.getElementById('btnInit') as HTMLButtonElement;
const btnStop = document.getElementById('btnStop') as HTMLButtonElement;
const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
const auditBody = document.getElementById('auditBody')!;
const logStream = document.getElementById('logStream')!;
const apiCoverage = document.getElementById('apiCoverage')!;
const downloadMonitor = document.getElementById('downloadMonitor')!;

// Knobs
const knobMemory = document.getElementById('knobMemory') as HTMLButtonElement;
const knobHotswap = document.getElementById('knobHotswap') as HTMLButtonElement;
const knobFlashFlood = document.getElementById('knobFlashFlood') as HTMLButtonElement;
const knobPivot = document.getElementById('knobPivot') as HTMLButtonElement;
const toggleCallback = document.getElementById('toggleCallback') as HTMLInputElement;
const btnCancelAll = document.getElementById('btnCancelAll') as HTMLButtonElement;
const knobExtendedRegular = document.getElementById('knobExtendedRegular') as HTMLButtonElement;
const knobExtendedStress = document.getElementById('knobExtendedStress') as HTMLButtonElement;
const speakerIdInput = document.getElementById('speakerIdInput') as HTMLInputElement;
const speedInput = document.getElementById('speedInput') as HTMLInputElement;
const volumeInput = document.getElementById('volumeInput') as HTMLInputElement;

const btnClearLogs = document.getElementById('btnClearLogs') as HTMLButtonElement;
const btnExportLogs = document.getElementById('btnExportLogs') as HTMLButtonElement;

// ============================================
// State
// ============================================

const state: DashboardState = {
  swStatus: 'inactive',
  farmStatus: 'idle',
  activeModelId: null,
  promotionState: 'stable',
  queueLength: 0,
  busyWorkers: 0,
  totalAudioMB: 0,
  totalQueued: 0,
  totalDone: 0,
  totalCancelled: 0
};

const apiUsage = new Set<string>();
const API_METHODS = [
  { id: 'provider.init', label: 'provider.init' },
  { id: 'provider.synthesize', label: 'provider.synthesize' },
  { id: 'provider.cancelAllSynthesis', label: 'provider.cancelAll' },
  { id: 'provider.updatePendingOptions', label: 'provider.updateOptions' },
  { id: 'createPiperProvider', label: 'createPiperProvider' }
];

let totalAudioBytes = 0;
let provider: ReturnType<typeof createPiperProvider> | null = null;
let audioCtx: AudioContext | null = null;
let sequencer: ReturnType<typeof createAudioSequencer> | null = null;
let logger: ProcessLogger | undefined;
let verifier: FifoVerifier | null = null;

const activeUIRows = new Set<string>();
const resultRegistry = new Map<string, Promise<AudioSynthesisResult>>();
const requestParams = new Map<string, { speakerId?: number, speed?: number, volume?: number }>();
const requestProcessingStartTimes = new Map<string, number>();

function syncUI() {
  renderDashboard(state);
  renderApiCoverage();
}

function trackApiUsage(methodId: string) {
  apiUsage.add(methodId);
  renderApiCoverage();
}

function renderApiCoverage() {
  apiCoverage.innerHTML = '';
  API_METHODS.forEach(method => {
    const isHit = apiUsage.has(method.id);
    const item = document.createElement('div');
    item.className = `coverage-item ${isHit ? 'hit' : ''}`;
    item.innerHTML = `<span class="coverage-dot"></span><span>${method.label}</span>`;
    apiCoverage.appendChild(item);
  });
}

// ============================================
// UI State Machine
// ============================================

const RESULT_MAP = new WeakMap<AudioSynthesisResult, HTMLElement>();

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setFarmState(farmStatus: DashboardState['farmStatus']) {
  state.farmStatus = farmStatus;
  
  switch (farmStatus) {
    case 'idle':
      btnStop.disabled = true;
      btnCancelAll.disabled = true;
      break;
    case 'ready':
      btnStop.disabled = false;
      btnCancelAll.disabled = false;
      break;
    case 'busy':
      btnInit.disabled = false; // Allow swaps even when busy
      btnStop.disabled = false;
      break;
  }
  syncUI();
}

function refreshBusyState() {
  if (!provider) return;
  if (activeUIRows.size > 0) {
    setFarmState('busy');
  } else if (provider.isInitialized()) {
    setFarmState('ready');
  }
}

// ============================================
// Logging & Observability
// ============================================

function initLogger() {
  if (!logger) {
    logger = createProcessLogger(logStream);
    logger.setMaxEntries(2000);
  }
  if (!verifier) {
    verifier = createFifoVerifier(logger);
  }
}

// ============================================
// Download Monitor Rendering
// ============================================

function renderDownloads(downloads: Map<string, DownloadState>) {
  if (downloads.size === 0) {
    downloadMonitor.innerHTML = `<div class="telemetry-label" style="text-align: center; padding: 2rem;">No active downloads.</div>`;
    return;
  }

  downloadMonitor.innerHTML = '';
  downloads.forEach(dl => {
    const card = document.createElement('div');
    card.className = 'download-card';
    
    const isDownloading = dl.status === 'downloading';
    const progressPercent = (dl.progress * 100).toFixed(1);
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.7rem; font-weight: 700; color: var(--accent);">${dl.modelId}</span>
        ${isDownloading ? `<button class="knob danger cancel-dl-btn" data-model-id="${dl.modelId}" style="padding: 0.2rem 0.5rem; font-size: 0.55rem;">CANCEL</button>` : ''}
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--text-dim);">
        <span>${dl.status.toUpperCase()}</span>
        <span>${progressPercent}%</span>
      </div>
    `;
    downloadMonitor.appendChild(card);
  });
}

// ============================================
// Provider Lifecycle
// ============================================

async function initProvider(options: { 
  modelId?: string; 
  useCallback?: boolean;
} = {}) {
  initLogger();
  trackApiUsage('createPiperProvider');
  
  if (!audioCtx) audioCtx = new AudioContext();
  if (!sequencer) {
    sequencer = createAudioSequencer(audioCtx);
  }
  
  const modelId = options.modelId || modelSelect.value;
  
  if (!provider) {
    provider = createPiperProvider();
    LogHelpers.lifecycle.providerCreated(logger!);

    provider.onLog((log) => {
      // Detection of Path A vs Path B for Dashboard feedback
      if (log.message.includes('Path A (Surgical)')) {
        state.promotionState = 'surgical';
        syncUI();
      } else if (log.message.includes('Path B (Hotswap)')) {
        state.promotionState = 'hotswap';
        syncUI();
      }

      const levelMap: Record<string, any> = {
        'info': 'INFO',
        'warn': 'WARNING',
        'error': 'ERROR',
        'debug': 'DEBUG'
      };
      logger?.log({
        category: 'WORKER',
        level: levelMap[log.level] || 'INFO',
        event: 'LOG',
        workerId: log.workerId,
        data: { message: log.message }
      });
    });

    // Monkey-patch synthesize to ensure all calls (even from scenarios) are tracked in the registry
    const originalSynthesize = provider.synthesize.bind(provider);
    provider.synthesize = (text, options) => {
      const requestId = options?.requestId || `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      
      const defaultSpeed = parseFloat(speedInput.value) || 1.0;
      const defaultVolume = parseFloat(volumeInput.value) || 1.0;
      const defaultSpeakerId = parseInt(speakerIdInput.value) || 0;

      const mergedOptions = {
        ...options,
        requestId,
        speed: options?.speed ?? defaultSpeed,
        volume: options?.volume ?? defaultVolume,
        speakerId: options?.speakerId ?? defaultSpeakerId
      };

      requestParams.set(requestId, mergedOptions);
      const p = originalSynthesize(text, mergedOptions);
      resultRegistry.set(requestId, p);
      return p;
    };

    provider.onQueueStatus(async (event) => {
      let row = document.getElementById(`row-${event.requestId}`);
      
      if (event.state === 'queued') {
        if (!row) row = createResultCard(event.text, event.requestId);
        activeUIRows.add(event.requestId);
      } else if (event.state === 'processing') {
        requestProcessingStartTimes.set(event.requestId, performance.now());
        if (row) {
          row.classList.replace('pending', 'active');
          const modelCell = row.querySelector('.model-cell')!;
          modelCell.innerHTML = `<span class="status-tag busy">SYNTHESIZING</span>`;
        }
      } else if (event.state === 'completed') {
        activeUIRows.delete(event.requestId);
        if (row) {
          try {
            const resultPromise = resultRegistry.get(event.requestId);
            const result = resultPromise ? await resultPromise : undefined;
            markRowDone(row, event.requestId, result);
          } catch (err) {
            markRowError(row, event.requestId, "Result resolution failed");
          }
        }
      } else if (event.state === 'cancelled' || event.state === 'error') {
        activeUIRows.delete(event.requestId);
        if (row) {
          if (event.state === 'cancelled') markRowCancelled(row, event.requestId);
          else if (event.state === 'error') markRowError(row, event.requestId, event.error);
        }
      }
      refreshBusyState();
    });
  }
  
  LogHelpers.lifecycle.initRequested(logger!, modelId, 2);
  trackApiUsage('provider.init');
  
  try {
    await provider.init({
      modelId,
      cpuInstances: 2,
      useCallback: options.useCallback ?? toggleCallback.checked,
      onProgress: (_state) => {
        // Handled by the metrics poller which reads getDownloadState()
      }
    });
    LogHelpers.lifecycle.promotionComplete(logger!, modelId, 2);
    state.activeModelId = modelId;
    state.promotionState = 'stable';
    state.swStatus = navigator.serviceWorker.controller ? 'active' : 'error';
    setFarmState('ready');
  } catch (err) {
    logger?.log({ category: 'LIFECYCLE', level: 'ERROR', event: 'INIT_ERROR', data: { error: String(err) } });
  }
}

// ============================================
// Synthesis Logic
// ============================================

function updateRamMetric(addedBytes: number) {
  totalAudioBytes += addedBytes;
  state.totalAudioMB = totalAudioBytes / (1024 * 1024);
  syncUI();
}

function createResultCard(text: string, requestId: string): HTMLElement {
  state.totalQueued++;
  syncUI();
  
  const row = document.createElement('tr');
  row.className = 'audit-row pending';
  row.id = `row-${requestId}`;
  
  const displayText = text.length > 50 ? text.substring(0, 47) + '...' : text;
  const escapedText = escapeHtml(displayText);
  const shortId = requestId.split('-').pop();
  
  const params = requestParams.get(requestId) || {};
  const speedStr = params.speed !== undefined ? params.speed.toFixed(1) : '1.0';
  const volStr = params.volume !== undefined ? params.volume.toFixed(1) : '1.0';
  const speakerStr = params.speakerId !== undefined ? String(params.speakerId) : '-';

  row.innerHTML = `
    <td style="font-family: var(--font-mono); color: var(--text-dim); font-size: 0.7rem;">${shortId}</td>
    <td class="model-cell"><span class="status-tag queued">QUEUED</span></td>
    <td class="speaker-cell" style="font-family: var(--font-mono); font-size: 0.7rem;">${speakerStr}</td>
    <td class="speed-cell" style="font-family: var(--font-mono); font-size: 0.7rem;">${speedStr}x</td>
    <td class="volume-cell" style="font-family: var(--font-mono); font-size: 0.7rem;">${volStr}x</td>
    <td class="sentence-cell" title="${escapeHtml(text)}">${escapedText}</td>
    <td class="lat-cell" style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">-</td>
    <td class="rtf-cell" style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">-</td>
    <td class="audio-len-cell" style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">-</td>
    <td class="gen-dur-cell" style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">-</td>
    <td class="status-cell" style="font-family: var(--font-mono); color: var(--text-dim);">-</td>
    <td class="callback-cell" style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-dim);">-</td>
    <td>
      <div style="display: flex; gap: 4px; justify-content: center;">
        <button class="knob danger cancel-row-btn" data-request-id="${requestId}" style="padding: 0.2rem 0.5rem; font-size: 0.55rem;">CANCEL</button>
        <button class="knob success play-btn" disabled style="padding: 0.2rem 0.5rem; font-size: 0.55rem;">PLAY</button>
      </div>
    </td>
  `;
  
  auditBody.prepend(row);
  return row;
}

function markRowDone(row: HTMLElement, _requestId: string, result?: AudioSynthesisResult & { callbackResult?: any }) {
  state.totalDone++;
  syncUI();

  row.classList.remove('pending', 'active');
  row.classList.add('done');
  
  const modelCell = row.querySelector('.model-cell')!;
  const speakerCell = row.querySelector('.speaker-cell')!;
  const statusCell = row.querySelector('.status-cell')!;
  const callbackCell = row.querySelector('.callback-cell')!;
  const rtfCell = row.querySelector('.rtf-cell')!;
  const latCell = row.querySelector('.lat-cell')!;
  const audioLenCell = row.querySelector('.audio-len-cell')!;
  const genDurCell = row.querySelector('.gen-dur-cell')!;
  const playBtn = row.querySelector('.play-btn') as HTMLButtonElement;
  const cancelBtn = row.querySelector('.cancel-row-btn') as HTMLButtonElement;

  const modelId = result?.metadata.modelId || state.activeModelId || 'unknown';
  modelCell.innerHTML = `<span class="status-tag done">${modelId}</span>`;
  speakerCell.textContent = result?.metadata.speakerId !== undefined ? String(result.metadata.speakerId) : '-';
  
  if (result) {
    const audioLen = result.durationMs;
    const genDur = result.metadata.generationTimeMs || 0;
    const startTime = requestProcessingStartTimes.get(_requestId) || performance.now();
    const activeLatency = performance.now() - startTime;

    const rtf = activeLatency > 0 ? (audioLen / activeLatency) : 0;

    statusCell.textContent = `${Math.round(audioLen)}ms`;
    audioLenCell.textContent = `${Math.round(audioLen)}ms`;
    genDurCell.textContent = genDur > 0 ? `${Math.round(genDur)}ms` : '-';
    latCell.textContent = `${Math.round(activeLatency)}ms`;
    rtfCell.textContent = rtf > 0 ? rtf.toFixed(2) : '-';
    
    if (rtf > 0) {
      rtfCell.setAttribute('style', `font-family: var(--font-mono); font-size: 0.7rem; color: ${rtf > 1 ? 'var(--success)' : 'var(--warning)'}; font-weight: 700;`);
    }
    
    if (result.callbackResult) {
      callbackCell.textContent = result.callbackResult.bytes ? `${(result.callbackResult.bytes / 1024).toFixed(1)} KB` : 'DONE';
      callbackCell.setAttribute('style', 'font-family: var(--font-mono); font-size: 0.65rem; color: var(--success); font-weight: 700;');
    } else {
      callbackCell.textContent = 'SKIP';
    }

    updateRamMetric(result.audioData.byteLength);
    playBtn.disabled = false;
    playBtn.onclick = () => {
      stopAudio();
      playRawAudio(result.audioData, audioCtx!);
    };
    RESULT_MAP.set(result, row);
  } else {
    statusCell.textContent = "DONE";
  }

  if (cancelBtn) cancelBtn.style.display = 'none';
}

function markRowError(row: HTMLElement, _requestId: string, errorMsg?: string) {
  row.classList.remove('pending', 'active');
  row.classList.add('error');
  const modelCell = row.querySelector('.model-cell')!;
  modelCell.innerHTML = `<span class="status-tag danger">ERROR</span>`;
  if (errorMsg) {
    const sentenceCell = row.querySelector('.sentence-cell')!;
    sentenceCell.innerHTML += `<div style="color: var(--danger); font-size: 0.6rem; margin-top: 4px; font-family: var(--font-mono);">${errorMsg}</div>`;
  }
}

function markRowCancelled(row: HTMLElement, _requestId: string) {
  state.totalCancelled++;
  syncUI();
  row.classList.remove('pending', 'active');
  row.classList.add('cancelled');
  const modelCell = row.querySelector('.model-cell')!;
  modelCell.innerHTML = `<span class="status-tag danger">CANCELLED</span>`;
  const cancelBtn = row.querySelector('.cancel-row-btn') as HTMLButtonElement;
  if (cancelBtn) cancelBtn.disabled = true;
}

async function queueSynthesis(text: string, options: { speakerId?: number; speed?: number; volume?: number; silent?: boolean } = {}) {
  if (!provider || !audioCtx || !logger) return;
  trackApiUsage('provider.synthesize');
  
  // Options are merged in the monkey-patch, so we can just pass them directly
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  logger.log({ category: 'SYNTHESIS', level: 'INFO', event: 'REQUEST', requestId, data: { text } });

  try {
    const result = await provider.synthesize(text, { 
      ...options,
      requestId
    });
    
    if (!options.silent) {
       playRawAudio(result.audioData, audioCtx);
    }
    
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      logger.log({ category: 'SYNTHESIS', level: 'INFO', event: 'CANCEL', requestId, data: {} });
    } else {
      logger.log({ category: 'SYNTHESIS', level: 'ERROR', event: 'FAIL', requestId, data: { error: String(err) }});
    }
  }
}

// ============================================
// Knob Logic
// ============================================

knobMemory.onclick = () => {
  initLogger();
  logger?.log({ category: 'TEST', level: 'DEBUG', event: 'UI_CLICK', data: { action: 'STRESS: MEMORY' } });
  runScenario(stressScenarios.find(s => s.id === 'memory-pressure')!);
};
knobHotswap.onclick = () => {
  initLogger();
  logger?.log({ category: 'TEST', level: 'DEBUG', event: 'UI_CLICK', data: { action: 'STRESS: HOTSWAP' } });
  runScenario(stressScenarios.find(s => s.id === 'hotswap-stress')!);
};
knobFlashFlood.onclick = () => {
  initLogger();
  logger?.log({ category: 'TEST', level: 'DEBUG', event: 'UI_CLICK', data: { action: 'STRESS: FLASH_FLOOD' } });
  runScenario(stressScenarios.find(s => s.id === 'burst-concurrency')!);
};

knobExtendedRegular.onclick = () => {
  initLogger();
  logger?.log({ category: 'TEST', level: 'DEBUG', event: 'UI_CLICK', data: { action: 'BEHEMOTH: REGULAR' } });
  runScenario(extendedScenarios.find(s => s.id === 'extended-standard')!);
};
knobExtendedStress.onclick = () => {
  initLogger();
  logger?.log({ category: 'TEST', level: 'DEBUG', event: 'UI_CLICK', data: { action: 'BEHEMOTH: STRESS' } });
  runScenario(extendedScenarios.find(s => s.id === 'extended-concurrency')!);
};

knobPivot.onclick = () => {
  initLogger();
  logger?.log({ category: 'TEST', level: 'DEBUG', event: 'UI_CLICK', data: { action: 'LIVE_UPDATE: PIVOT', speakerId: speakerIdInput.value } });
  if (!provider) return;
  trackApiUsage('provider.updatePendingOptions');
  const speakerId = parseInt(speakerIdInput.value) || 0;
  const speed = parseFloat(speedInput.value) || 1.0;
  const volume = parseFloat(volumeInput.value) || 1.0;
  
  logger?.log({ category: 'LIFECYCLE', level: 'INFO', event: 'PIVOT', data: { detail: `Applying Speaker ${speakerId}, Speed ${speed}x, Vol ${volume}x to waiting queue` } });
  
  provider.updatePendingOptions({ speakerId, speed, volume });

  // Visually update the UI for all pending rows
  Array.from(activeUIRows).forEach(reqId => {
    const row = document.getElementById(`row-${reqId}`);
    if (row && row.classList.contains('pending') && !row.classList.contains('active')) {
      const spkCell = row.querySelector('.speaker-cell');
      const spdCell = row.querySelector('.speed-cell');
      const volCell = row.querySelector('.volume-cell');
      if (spkCell) spkCell.textContent = String(speakerId);
      if (spdCell) spdCell.textContent = `${speed.toFixed(1)}x`;
      if (volCell) volCell.textContent = `${volume.toFixed(1)}x`;
      
      // Update our internal tracking map so markRowDone still shows it
      requestParams.set(reqId, { ...requestParams.get(reqId), speakerId, speed, volume });
    }
  });
};

toggleCallback.onchange = async () => {
  if (!provider) return;
  const enabled = toggleCallback.checked;
  const currentModel = provider.getActiveModelId();
  if (!currentModel) return;
  logger?.log({ category: 'LIFECYCLE', level: 'INFO', event: 'CALLBACK_TOGGLE', data: { enabled } });
  await provider.init({ modelId: currentModel, useCallback: enabled });
};

btnCancelAll.onclick = () => {
  if (!provider) return;
  trackApiUsage('provider.cancelAllSynthesis');
  logger?.log({ category: 'SYNTHESIS', level: 'WARNING', event: 'PURGE', data: { count: activeUIRows.size } });
  provider.cancelAllSynthesis();
};

// ============================================
// Scenarios Bridge
// ============================================

async function runScenario(scenario: TestScenario | undefined) {
  if (!scenario) return;
  initLogger();
  const startTime = Date.now();
  logger?.log({ category: 'TEST', level: 'INFO', event: 'START', data: { scenario: scenario.name } });

  if (!provider) await initProvider();
  
  try {
    const result = await scenario.execute(provider!);
    const duration = Date.now() - startTime;
    if (result.success) {
      const logData: any = { scenario: scenario.name };
      if (result.message) logData.message = result.message;
      logger?.log({ category: 'TEST', level: 'SUCCESS', event: 'PASS', duration, data: logData });
    } else {
      const isCancellation = result.error === 'Synthesis cancelled before completion' || result.error === 'Synthesis cancelled';
      logger?.log({ 
        category: 'TEST', 
        level: isCancellation ? 'INFO' : 'ERROR', 
        event: isCancellation ? 'CANCEL' : 'FAIL', 
        duration, 
        data: { scenario: scenario.name, error: result.error } 
      });
    }
  } catch (err: any) {
    const isCancellation = err.message === 'Synthesis cancelled before completion' || err.message === 'Synthesis cancelled';
    logger?.log({ 
      category: 'TEST', 
      level: isCancellation ? 'INFO' : 'ERROR', 
      event: isCancellation ? 'CANCEL' : 'CRASH', 
      data: { scenario: scenario.name, error: err.message } 
    });
  }
}

// ============================================
// Metrics Polling
// ============================================

// Tracks the active model ID seen on the previous polling tick.
// Used to detect farm-initiated model changes vs user-initiated dropdown changes.
let lastSeenActiveModelId: string | null = null;

setInterval(() => {
  if (provider) {
    const m = provider.metrics;
    state.queueLength = m.queueLength;
    state.busyWorkers = m.busyWorkers;
    state.activeModelId = provider.getActiveModelId();

    const downloads = provider.getDownloadState();
    renderDownloads(downloads);

    const isDownloading = Array.from(downloads.values()).some(s => s.status === 'downloading');

    // Detect a farm-initiated model change: the farm's active model changed
    // between the previous tick and this one. This is the only condition under
    // which the dropdown is updated programmatically. A user who manually
    // changed the dropdown without pressing INIT/SWAP will see STALE, which
    // is the correct signal that their selection is pending.
    const farmChangedModel =
      state.activeModelId !== null &&
      state.activeModelId !== lastSeenActiveModelId;

    if (isDownloading) {
      state.promotionState = 'downloading';
    } else if (farmChangedModel) {
      // Farm settled on a new model (e.g. extended swap). Sync dropdown and
      // clear any transient promotion state (hotswap/surgical) — the transition
      // is complete by definition when the farm reports a new activeModelId.
      modelSelect.value = state.activeModelId!;
      updateSpeakerBounds();
      state.promotionState = 'stable';
    } else if (state.activeModelId && state.activeModelId !== modelSelect.value) {
      // Farm model is unchanged, but the dropdown differs. This is a pending
      // user selection that has not been promoted yet.
      state.promotionState = 'stale';
    } else if (state.promotionState !== 'surgical' && state.promotionState !== 'hotswap') {
      state.promotionState = 'stable';
    }

    lastSeenActiveModelId = state.activeModelId;
    syncUI();
  }
}, 400);

// ============================================
// Delegation
// ============================================

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  
  // Cancel Synthesis Row
  const cancelRowBtn = target.closest('.cancel-row-btn') as HTMLButtonElement;
  if (cancelRowBtn && provider) {
    provider.cancelSynthesis(cancelRowBtn.dataset.requestId!);
  }

  // Cancel Download
  const cancelDlBtn = target.closest('.cancel-dl-btn') as HTMLButtonElement;
  if (cancelDlBtn && provider) {
    provider.clearPiperModelCache().catch(err => {
       logger?.log({ category: 'LIFECYCLE', level: 'ERROR', event: 'CACHE_CLEAR_FAIL', data: { error: String(err) } });
    });
  }
});

btnStop.onclick = () => {
  stopAudio();
  provider?.terminate();
  provider = null;
  state.activeModelId = null;
  setFarmState('idle');
  logger?.log({ category: 'LIFECYCLE', level: 'WARNING', event: 'SHUTDOWN', data: {} });
};

btnClearLogs.onclick = () => logger?.clearLogs();

btnExportLogs.onclick = () => {
  const logs = logger?.exportLogs();
  if (logs) {
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piper-c2-logs-${Date.now()}.json`;
    a.click();
  }
};

renderApiCoverage();
initLogger();
logger?.log({ category: 'LIFECYCLE', level: 'SUCCESS', event: 'Verification_ONLINE', data: {} });

btnInit.onclick = () => {
  initLogger();
  logger?.log({ category: 'TEST', level: 'DEBUG', event: 'UI_CLICK', data: { action: 'INIT/SWAP', modelId: modelSelect.value } });
  initProvider().then(() => {
    queueSynthesis("Piper Verification Control Panel Online. Systems Nominal.", { silent: true })
      .catch(err => console.error("Welcome synthesis failed:", err));
  }).catch(err => {
    console.error("Manual init failed:", err);
  });
};

// ============================================
// Dynamic Validation
// ============================================

async function updateSpeakerBounds() {
  try {
    const response = await fetch('/piper-gate/infra/piper-model-cards.json');
    const cards = await response.json();
    const activeModel = cards.find((c: any) => c.id === modelSelect.value);
    if (activeModel) {
      speakerIdInput.max = String(activeModel.numSpeakers - 1);
      if (parseInt(speakerIdInput.value) > activeModel.numSpeakers - 1) {
        speakerIdInput.value = "0";
      }
    }
  } catch (err) {
    console.warn("Failed to fetch model cards for validation:", err);
  }
}

modelSelect.addEventListener('change', updateSpeakerBounds);
updateSpeakerBounds();

setFarmState('idle');
