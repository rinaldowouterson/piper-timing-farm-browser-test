/**
 * piper-callback.js — Sovereign Callback Sidecar
 *
 * Convention-based sidecar loaded unconditionally by the Piper worker
 * when `useCallback: true` is set in FarmConfig.
 *
 * This module must be placed at the origin root (/piper-callback.js)
 * and its SHA-256 hash must be registered in INFRA_SHA256_REGISTRY
 * inside control-asset-sw.js.
 *
 * @param {object} result - The raw synthesis result from the Piper worker.
 * @param {Float32Array} result.audioData - The synthesized PCM audio data.
 * @returns {{ processed: boolean, bytes: number }} Proof-of-processing object.
 */
export function onSynthesisComplete(result) {
  return {
    processed: true,
    bytes: result.audioData.byteLength,
  };
}
