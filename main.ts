import { createPiperProvider, type PiperWorkerFarm } from 'piper-timing-farm-browser';
import { TEST_BATTERY } from './expose-sentences-test';
import { playRawAudio, stopAudio } from './process-audio-playback';

// UI Elements
const btnInit = document.getElementById('btnInit') as HTMLButtonElement;
const btnStop = document.getElementById('btnStop') as HTMLButtonElement;
const btnBarrage = document.getElementById('btnBarrage') as HTMLButtonElement;
const btnChaos = document.getElementById('btnChaos') as HTMLButtonElement;
const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
const resultList = document.getElementById('resultList')!;
const chaosStatus = document.getElementById('chaosStatus')!;
const logEl = document.getElementById('log')!;

const metricQueue = document.getElementById('metricQueue')!;
const metricBusy = document.getElementById('metricBusy')!;
const metricActiveModel = document.getElementById('metricActiveModel')!;

let provider: (PiperWorkerFarm & { getActiveModelId: () => string | null, clearPiperModelCache: () => Promise<void> }) | null = null;
let audioCtx: AudioContext | null = null;
let chaosInterval: ReturnType<typeof setInterval> | null = null;

const btnClearCache = document.getElementById('clear-cache-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status')!;

function log(msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

// Logic: Initialize Provider
async function initProvider() {
  if (!audioCtx) audioCtx = new AudioContext();
  const modelId = modelSelect.value;
  
  if (!provider) provider = createPiperProvider();
  
  log(`Initializing with ${modelId}...`, 'info');
  btnInit.disabled = true;
  
  try {
    await provider!.init({ modelId, voiceId: modelId, cpuInstances: 2 });
    log(`Provider ready: ${modelId}`, 'success');
  } catch (err) {
    log(`Init Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
  } finally {
    btnInit.disabled = false;
  }
}

// Logic: Create a "Result Card" in UI
function createResultCard(text: string) {
  const card = document.createElement('div');
  card.className = 'result-card pending';
  card.innerHTML = `
    <div style="font-size: 0.75rem; margin-bottom: 0.25rem;">
      <span class="tag">PENDING</span>
      <span class="tag model-tag">?</span>
    </div>
    <div class="text-preview" style="font-size: 0.8rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
      ${text}
    </div>
  `;
  resultList.prepend(card);
  return card;
}

// Logic: Queue a single synthesis
async function queueSynthesis(text: string, card: HTMLElement) {
  if (!provider || !audioCtx) return;
  
  card.classList.replace('pending', 'active');
  const tagEl = card.querySelector('.model-tag')!;
  tagEl.textContent = 'QUEUING...';

  try {
    const result = await provider.synthesize(text);
    
    card.classList.replace('active', 'done');
    tagEl.textContent = result.metadata.modelId ?? 'unknown';
    tagEl.classList.add(result.metadata.modelId?.includes('uk') ? 'uk' : 'en');
    
    log(`Result Ready (${result.metadata.modelId}): ${text.slice(0, 20)}...`, 'success');
    
    // Auto-play in sequence if nothing else is playing (simple FIFO audio)
    playRawAudio(result.audioData, audioCtx);
    
  } catch (err) {
    card.style.borderColor = 'var(--danger)';
    tagEl.textContent = 'FAILED';
    log(`Synthesis Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
  }
}

// Logic: Barrage (Fire & Forget)
async function runBarrage() {
  if (!provider) {
    await initProvider();
  }
  
  resultList.innerHTML = ''; // Clear prior results
  log(`🔥 STARTING BARRAGE: 200+ fire-and-forget requests (100 EN + 100 UK)...`, 'warning');
  
  const pool = [
    ...TEST_BATTERY.LONG_PARAGRAPHS_EN,
    ...TEST_BATTERY.LONG_PARAGRAPHS_UK
  ];

  pool.forEach(text => {
    const card = createResultCard(text);
    // Fire and Forget
    queueSynthesis(text, card);
  });
}

// Logic: Chaos Mode (Random Hotswapping)
function toggleChaosMode() {
  if (chaosInterval) {
    clearInterval(chaosInterval);
    chaosInterval = null;
    chaosStatus.textContent = '';
    log('🌀 Chaos Mode Disabled.', 'info');
    return;
  }
  
  log('🌀 CHAOS MODE ENABLED: Randomized hotswapping active.', 'warning');
  chaosStatus.textContent = '🌀 CHAOS ACTIVE';
  
  chaosInterval = setInterval(() => {
    const models = ['en_US-bryce-medium', 'uk_UA-ukrainian_tts-medium', 'en_GB-cori-medium'];
    const randomModel = models[Math.floor(Math.random() * models.length)];
    
    if (provider && provider.getActiveModelId() !== randomModel) {
      log(`🌀 Chaos: Hotswapping to ${randomModel}...`, 'warning');
      modelSelect.value = randomModel;
      initProvider(); // Triggers "asshole-proof" hotswap
    }
  }, 3000);
}

// UI Sync
setInterval(() => {
  if (provider) {
    const m = provider.metrics;
    metricQueue.textContent = m.queueLength.toString();
    metricBusy.textContent = m.busyWorkers.toString();
    metricActiveModel.textContent = provider.getActiveModelId() || 'None';
  }
}, 300);

// Event Listeners
btnInit.onclick = initProvider;
btnBarrage.onclick = runBarrage;
btnChaos.onclick = toggleChaosMode;
btnStop.onclick = () => {
  stopAudio();
  provider?.terminate();
  provider = null;
  metricActiveModel.textContent = 'None';
  log('🛑 Emergency Stop: Farm Terminated & Audio Silenced.', 'error');
  resultList.innerHTML = '<div style="color: var(--danger); text-align: center; padding: 2rem;">Farm Terminated.</div>';
};

btnClearCache.onclick = async () => {
    try {
        statusEl.innerText = "Clearing OPFS Model Cache...";
        if (provider) {
            await provider.clearPiperModelCache();
        } else {
            // Decoupled Fix: Even if provider isn't initialized, we can clear it 
            // via the library's internal utility if we expose it, or just use 
            // a temporary provider instance to call it.
            const { createPiperProvider } = await import('piper-timing-farm-browser');
            const tempProvider = createPiperProvider();
            await tempProvider.clearPiperModelCache();
        }
        statusEl.innerText = "Cache Cleared! Re-init required.";
        log("OPFS Cache Nuked. Models cleared.", 'warning');
    } catch (err: any) {
        statusEl.innerText = "Error: " + err.message;
        log(`Cache clear failed: ${err.message}`, 'error');
    }
}
