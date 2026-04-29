/**
 * Sidebar Coverage Resolver
 * 
 * Maps completed test scenarios to the Library API Coverage sidebar indicators.
 * Ensures the UI remains in sync with the actual verification state.
 */

const FEATURE_TO_DOT_ID: Record<string, string> = {
  "createPiperWorkerFarm": "cov-init",
  "provider.synthesize": "cov-synthesize",
  "clearPiperInfraCache": "cov-clear-infra",
  "clearPiperModelCache": "cov-clear-model",
  "deletePiperModel": "cov-delete-model",
  "provider.getMetrics": "cov-metrics"
};

/**
 * Updates the sidebar status dots for a list of features.
 * @param features List of library features covered by the scenario.
 */
export function resolveSidebarUpdate(features: string[]): void {
  features.forEach(feature => {
    const dotId = FEATURE_TO_DOT_ID[feature];
    if (!dotId) return;

    const dot = document.getElementById(dotId);
    if (dot) {
      dot.classList.add('hit');
      
      dot.animate([
        { transform: 'scale(1)', opacity: 0.5 },
        { transform: 'scale(1.5)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1 }
      ], {
        duration: 300,
        easing: 'ease-out'
      });
    }
  });
}

/**
 * Resets all coverage indicators to their default state.
 */
export function resetSidebarCoverage(): void {
  Object.values(FEATURE_TO_DOT_ID).forEach(dotId => {
    const dot = document.getElementById(dotId);
    if (dot) {
      dot.classList.remove('hit');
    }
  });
}
