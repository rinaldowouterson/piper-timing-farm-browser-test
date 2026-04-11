/**
 * Integrated Load Verification Runner for Piper Timing Farm
 * 
 * Comprehensive verification orchestrator with detailed process logging
 * for verifying all library features.
 */

import { createPiperProvider, resolveCacheClearing } from 'piper-timing-farm-browser';
import { playRawAudio, stopAudio } from './process-audio-playback';
import { createAudioSequencer } from './control-audio-sequential';
import { AudioSynthesisResult } from './types/audio-interface';
import { createProcessLogger, ProcessLogger, LogHelpers, LogCategory } from './process-logging';
import { createFifoVerifier, TEST_SCENARIOS, TestResult } from './expose-test-scenarios';
import type { FifoVerifier } from './control-fifo-verifier';

// ============================================
// UI Elements
// ============================================

const btnInit = document.getElementById('btnInit') as HTMLButtonElement;
const btnStop = document.getElementById('btnStop') as HTMLButtonElement;
const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
const resultList = document.getElementById('resultList')!;
const logEl = document.getElementById('log')!;

const metricQueue = document.getElementById('metricQueue')!;
const metricBusy = document.getElementById('metricBusy')!;
const metricActiveModel = document.getElementById('metricActiveModel')!;
const downloadList = document.getElementById('download-list')!;
const speakerIdSelect = document.getElementById('speakerIdSelect') as HTMLInputElement;
const totalQueuedEl = document.getElementById('totalQueued')!;
const totalDoneEl = document.getElementById('totalDone')!;
const activePoolIdEl = document.getElementById('active-pool-id')!;
const promotionStateEl = document.getElementById('promotion-state')!;

const btnClearCache = document.getElementById('clear-cache-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status')!;

// Manual Synthesis Elements
const manualText = document.getElementById('manualText') as HTMLTextAreaElement;
const btnManualSynth = document.getElementById('btnManualSynth') as HTMLButtonElement;
const audioRamMetric = document.getElementById('audioRamMetric')!;
const emptyTableMsg = document.getElementById('empty-table-msg')!;

// New UI elements
const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
const speedValue = document.getElementById('speedValue')!;
const volumeValue = document.getElementById('volumeValue')!;
const passedCountEl = document.getElementById('passedCount')!;
const failedCountEl = document.getElementById('failedCount')!;
const pendingCountEl = document.getElementById('pendingCount')!;
const exportLogsBtn = document.getElementById('exportLogsBtn') as HTMLButtonElement;
const clearLogsBtn = document.getElementById('clearLogsBtn') as HTMLButtonElement;
const logFilterBar = document.getElementById('logFilterBar')!;
const testScenarioGrid = document.getElementById('testScenarioGrid')!;
const runAllBtn = document.getElementById('runAllBtn') as HTMLButtonElement;

// ============================================
// State
// ============================================

let totalQueued = 0;
let totalDone = 0;
let passedCount = 0;
let failedCount = 0;
let pendingCount = TEST_SCENARIOS.length;
let totalAudioBytes = 0;

let provider: ReturnType<typeof createPiperProvider> | null = null;
let audioCtx: AudioContext | null = null;
let sequencer: ReturnType<typeof createAudioSequencer> | null = null;
let logger: ProcessLogger | null = null;
let verifier: FifoVerifier | null = null;

// Test results tracking
const testResults: Map<string, TestResult> = new Map();

// ============================================
// Logging Setup
// ============================================

function initLogger() {
  if (!logger) {
    logger = createProcessLogger(logEl);
    logger.setMaxEntries(2000);
  }
  if (!verifier) {
    verifier = createFifoVerifier(logger);
  }
}

// ============================================
// Provider Lifecycle
// ============================================

async function initProvider(options: { 
  modelId?: string; 
  prioritizeSelected?: boolean;
  callbackModule?: { path: string; functionName: string };
} = {}) {
  initLogger();
  
  if (!audioCtx) audioCtx = new AudioContext();
  if (!sequencer) {
    sequencer = createAudioSequencer(audioCtx);
    sequencer.onPlay = (result) => {
      document.querySelectorAll('.result-card.now-playing').forEach(el => el.classList.remove('now-playing'));
      const cards = document.querySelectorAll('.result-card');
      const target = Array.from(cards).find(c => (c as any)._result === result);
      if (target) {
        target.classList.add('now-playing');
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
  }
  
  const modelId = options.modelId || modelSelect.value;
  
  if (!provider) {
    provider = createPiperProvider();
    LogHelpers.lifecycle.providerCreated(logger!);
  }
  
  LogHelpers.lifecycle.initRequested(logger!, modelId, 2, options.prioritizeSelected ?? true);
  btnInit.disabled = true;
  
  try {
    await provider.init({
      modelId,
      voiceId: modelId,
      cpuInstances: 2,
      prioritizeSelected: options.prioritizeSelected ?? true,
      callbackModule: options.callbackModule,
      onProgress: (state) => {
        LogHelpers.download.progress(logger!, state.modelId, state.progress, state.bytesDownloaded, state.bytesTotal);
      }
    });
    LogHelpers.lifecycle.promotionComplete(logger!, modelId, 2);
    statusEl.innerText = `Ready: ${modelId}`;
  } catch (err) {
    LogHelpers.test.scenarioFail(logger!, 'init', String(err), 0);
    statusEl.innerText = "Error: " + (err instanceof Error ? err.message : String(err));
  } finally {
    btnInit.disabled = false;
  }
}

// ============================================
// Synthesis
// ============================================

function updateRamMetric(addedBytes: number) {
  totalAudioBytes += addedBytes;
  const mb = totalAudioBytes / (1024 * 1024);
  audioRamMetric.textContent = `${mb.toFixed(2)} MB`;
}

function createResultCard(text: string, requestId: string) {
  totalQueued++;
  totalQueuedEl.textContent = totalQueued.toString();
  
  if (emptyTableMsg) emptyTableMsg.style.display = 'none';

  const row = document.createElement('tr');
  row.className = 'audit-row pending';
  row.id = `row-${requestId}`;
  
  // Truncate text for UI
  const displayText = text.length > 60 ? text.substring(0, 57) + '...' : text;
  
  row.innerHTML = `
    <td style="font-family: monospace; color: #8b949e;">${requestId.split('-').pop()}</td>
    <td class="model-cell"><span class="tag">WAITING</span></td>
    <td class="sentence-cell" title="${text}">${displayText}</td>
    <td class="duration-cell">-</td>
    <td class="ram-cell">-</td>
    <td>
      <button class="play-btn" disabled>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        PLAY
      </button>
    </td>
  `;
  
  resultList.prepend(row);
  return row;
}

/**
 * Global handler for results (from manual OR automated paths)
 */
function handleSynthesisResult(text: string, result: AudioSynthesisResult, row: HTMLElement) {
  totalDone++;
  totalDoneEl.textContent = totalDone.toString();

  row.classList.replace('pending', 'done');
  
  const modelCell = row.querySelector('.model-cell')!;
  const durationCell = row.querySelector('.duration-cell')!;
  const ramCell = row.querySelector('.ram-cell')!;
  const playBtn = row.querySelector('.play-btn') as HTMLButtonElement;

  const modelId = result.metadata.modelId || 'unknown';
  modelCell.innerHTML = `<span class="tag ${modelId.includes('uk') ? 'uk' : 'en'}">${modelId}</span>`;
  
  durationCell.textContent = `${Math.round(result.durationMs)}ms`;
  
  const bytes = result.audioData.byteLength;
  ramCell.textContent = `${(bytes / 1024).toFixed(1)} KB`;
  updateRamMetric(bytes);

  playBtn.disabled = false;
  playBtn.onclick = () => {
    stopAudio();
    playRawAudio(result.audioData, audioCtx!);
  };
  
  // Store result on element for sequencer (Legacy support)
  (row as any)._result = result;
}

async function queueSynthesis(text: string, card: HTMLElement, options: { speakerId?: number; speed?: number; volume?: number } = {}) {
  if (!provider || !audioCtx || !logger) return;
  
  const speakerId = options.speakerId ?? (parseInt(speakerIdSelect.value) || 0);
  const speed = options.speed ?? (parseFloat(speedSlider.value) || 1.0);
  const volume = options.volume ?? (parseFloat(volumeSlider.value) || 1.0);
  
  card.classList.replace('pending', 'active');
  const modelCell = card.querySelector('.model-cell')!;
  modelCell.innerHTML = `<span class="tag">SYNTHESIZING...</span>`;
  
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  LogHelpers.synthesis.requested(logger!, requestId, text, speakerId, speed, volume);

  try {
    const result = await provider.synthesize(text, { speakerId, speed, volume });
    handleSynthesisResult(text, result as AudioSynthesisResult, card);
    
    // Log metadata
    if (result.metadata.phonemes) {
      LogHelpers.metadata.phonemes(logger!, requestId, result.metadata.phonemes.length, result.metadata.phonemes);
    }
    LogHelpers.metadata.speakerId(logger!, requestId, speakerId, result.metadata.speakerId || 0);
    
    // Auto-play only for manual synthesis (passed via options or context check)
    if (!(options as any).silent) {
       playRawAudio(result.audioData, audioCtx);
    }
    
  } catch (err) {
    card.style.borderColor = 'var(--danger)';
    modelCell.innerHTML = `<span class="tag" style="background: var(--danger);">FAILED</span>`;
    LogHelpers.test.scenarioFail(logger, 'synthesis', String(err), 0);
  }
}

// ============================================
// Cache Management
// ============================================

async function resetCache() {
  initLogger();
  
  LogHelpers.cache.opfsClearStart(logger!);
  
  try {
    await resolveCacheClearing();
    
    if (provider) {
      // Re-initialize metrics if provider exists
      provider.terminate();
      provider = null;
    }

    LogHelpers.cache.opfsClearComplete(logger!, 0);
    statusEl.innerText = "Cache Cleared!";
  } catch (err: any) {
    statusEl.innerText = "Error: " + err.message;
    LogHelpers.test.scenarioFail(logger!, 'cache-clear', err.message, 0);
  }
}

// ============================================
// Test Scenario Execution
// ============================================

async function runScenario(scenarioId: string) {
  initLogger();
  
  const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) {
    LogHelpers.test.scenarioFail(logger!, scenarioId, 'Scenario not found', 0);
    return;
  }
  
  // Update button state
  const btn = testScenarioGrid.querySelector(`[data-scenario="${scenarioId}"]`) as HTMLButtonElement;
  if (btn) {
    btn.classList.add('running');
    const statusEl = btn.querySelector('.test-status')!;
    statusEl.textContent = 'Running...';
  }
  
  // Reset cache if required
  if (scenario.requiresCacheReset) {
    await resetCache();
  }
  
  // Create test context
  const context = {
    provider: provider!,
    logger: logger!,
    verifier: verifier!,
    audioContext: audioCtx!,
    resetCache,
    onResultReady: (text: string, result: AudioSynthesisResult) => {
      const requestId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const row = createResultCard(text, requestId);
      handleSynthesisResult(text, result, row);
    }
  };
  
  // Ensure provider exists
  if (!provider) {
    provider = createPiperProvider();
    LogHelpers.lifecycle.providerCreated(logger!);
  }
  
  try {
    const result = await scenario.execute(context);
    testResults.set(scenarioId, result);
    
    // Update counts
    if (result.passed) {
      passedCount++;
      passedCountEl.textContent = passedCount.toString();
    } else {
      failedCount++;
      failedCountEl.textContent = failedCount.toString();
    }
    pendingCount--;
    pendingCountEl.textContent = pendingCount.toString();
    
    // Update button state
    if (btn) {
      btn.classList.remove('running');
      btn.classList.add(result.passed ? 'passed' : 'failed');
      const statusEl = btn.querySelector('.test-status')!;
      statusEl.textContent = result.passed
        ? `✓ ${result.duration}ms`
        : `✗ ${result.error || 'Failed'}`;
    }
    
  } catch (err: any) {
    LogHelpers.test.scenarioFail(logger!, scenarioId, String(err), 0);
    
    if (btn) {
      btn.classList.remove('running');
      btn.classList.add('failed');
      const statusEl = btn.querySelector('.test-status')!;
      statusEl.textContent = `✗ ${err.message}`;
    }
  }
}

async function runAllTests() {
  passedCount = 0;
  failedCount = 0;
  passedCountEl.textContent = '0';
  failedCountEl.textContent = '0';
  pendingCountEl.textContent = TEST_SCENARIOS.length.toString();
  
  // Reset all button states
  testScenarioGrid.querySelectorAll('.test-btn').forEach(btn => {
    btn.classList.remove('passed', 'failed', 'running');
    const statusEl = btn.querySelector('.test-status')!;
    statusEl.textContent = '';
  });
  
  for (const scenario of TEST_SCENARIOS) {
    await runScenario(scenario.id);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// ============================================
// UI Sync
// ============================================

setInterval(() => {
  if (provider) {
    const m = provider.metrics;
    metricQueue.textContent = m.queueLength.toString();
    metricBusy.textContent = m.busyWorkers.toString();
    const activeId = provider.getActiveModelId();
    metricActiveModel.textContent = activeId || 'None';
    activePoolIdEl.textContent = activeId || 'None';
    
    const downloads = provider.getDownloadState();
    const isDownloading = Array.from(downloads.values()).some(s => s.state === 'downloading');
    
    if (isDownloading) {
      promotionStateEl.textContent = 'DOWNLOADING SHADOW...';
      promotionStateEl.style.color = 'var(--warning)';
    } else if (activeId && activeId !== modelSelect.value) {
      promotionStateEl.textContent = 'STALE (PENDING PROMO)';
      promotionStateEl.style.color = 'var(--danger)';
    } else {
      promotionStateEl.textContent = 'STABLE (ACTIVE)';
      promotionStateEl.style.color = 'var(--success)';
    }
    
    updateDownloadUI();
  }
}, 300);

function updateDownloadUI() {
  if (!provider) return;
  const states = provider.getDownloadState();
  
  if (states.size === 0) {
    downloadList.innerHTML = '<div style="color: #8b949e; font-size: 0.75rem; text-align: center;">No active downloads.</div>';
    return;
  }

  // Clear "no active" indicator if it was there
  if (downloadList.querySelector('div[style*="text-align: center"]')) {
    downloadList.innerHTML = '';
  }

  // Update or create items
  states.forEach((s, id) => {
    const pct = Math.round(s.progress * 100);
    const safeId = id.replace(/[^a-zA-Z0-9]/g, '_');
    const existing = document.getElementById(`dl-${safeId}`);
    
    if (existing) {
      const infoSpan = existing.querySelector('.download-info span:first-child')!;
      const pctSpan = existing.querySelector('.download-info span:last-child')!;
      const bar = existing.querySelector('.progress-bar') as HTMLElement;
      
      infoSpan.textContent = `${id.split('-')[1]} (${s.state})`;
      pctSpan.textContent = `${pct}%`;
      bar.style.width = `${pct}%`;
    } else {
      const item = document.createElement('div');
      item.id = `dl-${safeId}`;
      item.className = 'download-item';
      item.innerHTML = `
        <div class="download-info">
          <span>${id.split('-')[1]} (${s.state})</span>
          <span>${pct}%</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${pct}%"></div>
        </div>
      `;
      downloadList.appendChild(item);
    }
  });

  // Remove items that are no longer in states
  const ids = Array.from(states.keys()).map(id => `dl-${id.replace(/[^a-zA-Z0-9]/g, '_')}`);
  Array.from(downloadList.children).forEach(child => {
    if (child.id && !ids.includes(child.id)) {
      child.remove();
    }
  });
}

// ============================================
// Event Listeners
// ============================================

// Provider controls
modelSelect.onchange = () => {
  initLogger();
  LogHelpers.lifecycle.initRequested(logger!, modelSelect.value, 2, true);
  initProvider();
};

btnInit.onclick = () => initProvider();

btnStop.onclick = () => {
  stopAudio();
  sequencer?.stop();
  provider?.terminate();
  provider = null;
  metricActiveModel.textContent = 'None';
  initLogger();
  LogHelpers.lifecycle.providerTerminated(logger!, null);
  resultList.innerHTML = '<div style="color: var(--danger); text-align: center; padding: 2rem;">Farm Terminated.</div>';
};

btnManualSynth.onclick = async () => {
  const text = manualText.value.trim();
  if (!text) return;
  
  if (!provider || !provider.isInitialized()) {
    await initProvider();
  }
  
  const requestId = `manual-${Date.now()}`;
  const row = createResultCard(text, requestId);
  queueSynthesis(text, row);
  manualText.value = '';
};

btnClearCache.onclick = resetCache;

// Speed/Volume sliders
speedSlider.oninput = () => {
  speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;
};

volumeSlider.oninput = () => {
  volumeValue.textContent = parseFloat(volumeSlider.value).toFixed(1);
};

// Log filtering
logFilterBar.addEventListener('click', (e) => {
  const target = e.target as HTMLButtonElement;
  if (target.classList.contains('log-filter-btn') && target.dataset.category) {
    logFilterBar.querySelectorAll('.log-filter-btn').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
    
    initLogger();
    logger!.filterByCategory(target.dataset.category as LogCategory | 'ALL');
  }
});

// Clear logs
clearLogsBtn.onclick = () => {
  initLogger();
  logger!.clearLogs();
};

// Export logs
exportLogsBtn.onclick = () => {
  initLogger();
  const logs = logger!.exportLogs();
  const blob = new Blob([logs], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `piper-test-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Test scenario buttons
testScenarioGrid.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  const btn = target.closest('.test-btn') as HTMLButtonElement;
  
  if (btn && btn.dataset.scenario) {
    await runScenario(btn.dataset.scenario);
  }
});

// Run all button
runAllBtn.onclick = runAllTests;

// ============================================
// Initialize
// ============================================

initLogger();
LogHelpers.test.scenarioStart(logger!, 'init', 'Integrated Load Verification Runner Initialized');
statusEl.innerText = "Ready. Select a test scenario or initialize provider.";
