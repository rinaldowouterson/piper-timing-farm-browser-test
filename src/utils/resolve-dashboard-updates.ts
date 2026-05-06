import { DashboardState } from "../../types/ui-state";

/**
 * Master Health Dashboard Renderer
 * 
 * Performs atomic DOM updates based on the DashboardState.
 * This is a pure rendering utility to eliminate procedural UI code in the main runner.
 */
export function renderDashboard(state: DashboardState): void {
  // Health Orbit (Status Ring)
  const ring = document.getElementById('statusRing');
  const farmState = document.getElementById('farmState');
  if (ring && farmState) {
    ring.className = `orbit-ring ${state.farmStatus}`;
    const statusText: Record<string, string> = {
      idle: 'OFFLINE',
      ready: 'READY',
      busy: 'BUSY',
      error: 'ERROR',
      terminated: 'DEAD'
    };
    farmState.textContent = statusText[state.farmStatus] || 'UNKNOWN';
  }

  // Telemetry (Service Worker)
  const swStatus = document.getElementById('swStatus');
  if (swStatus) {
    const isError = state.swStatus === 'error' || state.swStatus === 'SW: ERROR';
    const isActive = state.swStatus === 'active' || state.swStatus === 'SW: ACTIVE';
    
    swStatus.textContent = isActive ? 'SW: ACTIVE' : (isError ? 'SW: ERROR' : 'SW: INACTIVE');
    swStatus.style.color = isActive ? 'var(--success)' : (isError ? 'var(--danger)' : 'var(--warning)');
  }

  const audioRam = document.getElementById('audioRam');
  if (audioRam) audioRam.textContent = `${state.totalAudioMB.toFixed(2)} MB`;

  const activeModel = document.getElementById('activeModel');
  if (activeModel) activeModel.textContent = state.activeModelId || 'NONE';

  const promoState = document.getElementById('promoState');
  if (promoState) {
    const promoMap: Record<string, { text: string; color: string }> = {
      stable: { text: 'STABLE', color: 'var(--success)' },
      downloading: { text: 'DOWNLOADING', color: 'var(--warning)' },
      stale: { text: 'STALE', color: 'var(--danger)' },
      surgical: { text: 'SURGICAL UPDATE', color: 'var(--accent)' },
      hotswap: { text: 'SHADOW POOL', color: 'var(--accent)' }
    };
    const config = promoMap[state.promotionState] || promoMap.stable;
    promoState.textContent = config.text;
    promoState.style.color = config.color;
  }

  // Audit Counts
  const queuedEl = document.getElementById('countQueued');
  const doneEl = document.getElementById('countDone');
  const cancelEl = document.getElementById('countCancel');
  if (queuedEl) queuedEl.textContent = state.totalQueued.toString();
  if (doneEl) doneEl.textContent = state.totalDone.toString();
  if (cancelEl) cancelEl.textContent = state.totalCancelled.toString();
}
