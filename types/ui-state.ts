/**
 * Dashboard & Health Observability Types
 * 
 * Defines the unified state for the Master Health Dashboard,
 * centralizing telemetry from the Service Worker, WASM Farm, and OPFS.
 */

export type HealthStatus = 'idle' | 'ready' | 'busy' | 'error' | 'terminated';

export interface DashboardState {
  // Infrastructure Status
  swStatus: 'active' | 'inactive' | 'error' | 'SW: ACTIVE' | 'SW: ERROR';
  
  // Farm Lifecycle
  farmStatus: HealthStatus;
  activeModelId: string | null;
  promotionState: 'stable' | 'downloading' | 'stale' | 'surgical' | 'hotswap';
  
  // Real-time Metrics
  queueLength: number;
  busyWorkers: number;
  totalAudioMB: number;
  
  // Audit Counts
  totalQueued: number;
  totalDone: number;
  totalCancelled: number;
}
