/**
 * Sidebar Coverage Resolver
 * 
 * Maps completed test scenarios to the Library API Coverage sidebar indicators.
 * Ensures the UI remains in sync with the actual verification state.
 */

const SCENARIO_TO_DOT_ID: Record<string, string> = {
  "Basic Initialization": "cov-init",
  "Standard Synthesis": "cov-synthesize",
  "Infrastructure Reset Recovery": "cov-clear-infra",
  "Model Cache Clear": "cov-clear-model",
  "Model Purge Verification": "cov-delete-model",
  "Sequential API Tour": "cov-metrics"
};

/**
 * Updates the sidebar status dot for a given scenario.
 * @param scenarioName The human-readable name of the completed scenario.
 */
export function resolveSidebarUpdate(scenarioName: string): void {
  const dotId = SCENARIO_TO_DOT_ID[scenarioName];
  if (!dotId) return;

  const dot = document.getElementById(dotId);
  if (dot) {
    dot.classList.add('hit');
    
    // Optional: add a micro-animation trigger
    dot.animate([
      { transform: 'scale(1)', opacity: 0.5 },
      { transform: 'scale(1.5)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration: 300,
      easing: 'ease-out'
    });
  }
}

/**
 * Resets all coverage indicators to their default state.
 */
export function resetSidebarCoverage(): void {
  Object.values(SCENARIO_TO_DOT_ID).forEach(dotId => {
    const dot = document.getElementById(dotId);
    if (dot) {
      dot.classList.remove('hit');
    }
  });
}
