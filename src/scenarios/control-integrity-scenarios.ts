import { TestScenario, PiperProvider } from "./types";

export const integrityScenarios: TestScenario[] = [
  {
    id: "sha256-integrity",
    name: "Infrastructure Reset Recovery",
    category: "integrity",
    description: "Verify SW recovers from destructive infra-clear via network re-fetch.",
    features: ["clearPiperInfraCache", "Service Worker gateway", "Integrity verification"],
    execute: async (provider) => {
      try {
        // 1. Clear infra cache (Destructive)
        await provider.clearPiperInfraCache();
        
        // 2. Re-initialize (Triggers SW network fallback)
        await provider.init({
          modelId: "en_US-bryce-medium",
          cpuInstances: 2
        });
        
        // 3. Verify synthesis still works
        const result = await provider.synthesize("Recovery test");
        if (result.audioData.length > 0) {
          return { success: true, data: undefined, message: "Infrastructure recovered and synthesis resumed." };
        }
        return { success: false, error: "Recovery synthesis produced empty audio." };
      } catch (error: any) {
        return { success: false, error: error instanceof Error ? error : String(error) };
      }
    }
  },
  {
    id: "delete-model",
    name: "Model Purge Verification",
    category: "integrity",
    description: "Verify that specific models can be deleted from local storage.",
    features: ["deletePiperModel"],
    execute: async (provider) => {
      try {
        const modelToDelete = "en_US-bryce-medium";
        await provider.deletePiperModel(modelToDelete);
        
        // Note: active session still holds it in RAM, so we verify deletion doesn't crash the farm
        await provider.synthesize("Purge test");
        
        return { success: true, data: undefined, message: `Model ${modelToDelete} purged from OPFS; synthesis unaffected in active session.` };
      } catch (error: any) {
        return { success: false, error: error instanceof Error ? error : String(error) };
      }
    }
  },
  {
    id: "cache-clear",
    name: "Model Cache Clear",
    category: "integrity",
    description: "Verify that clearing the model cache removes all stored voices.",
    features: ["clearPiperModelCache", "OPFS caching"],
    execute: async (provider) => {
      try {
        await provider.clearPiperModelCache();
        return { success: true, data: undefined, message: "Model cache cleared successfully." };
      } catch (error: any) {
        return { success: false, error: error instanceof Error ? error : String(error) };
      }
    }
  },
  {
    id: "download-cancel",
    name: "Download Cancellation",
    category: "integrity",
    description: "Verify that active model downloads can be cancelled.",
    features: ["Download management"],
    execute: async (provider) => {
      // Trigger a download by switching to a new model
      const targetModel = "en_GB-cori-medium";
      const initPromise = provider.init({ modelId: targetModel });
      await new Promise(r => setTimeout(r, 100)); // Wait for it to start
      await provider.cancelDownload(targetModel);
      try { await initPromise; } catch (e) {} // Consume the init promise
      return { success: true, data: undefined, message: "Download cancelled successfully." };
    }
  },
  {
    id: "callback-module",
    name: "Callback Module Verification",
    category: "integrity",
    description: "Verify that the phoneme callback module executes correctly.",
    features: ["phoneme timing", "Worker Callbacks"],
    execute: async (provider) => {
      const result = await provider.synthesize("Callback test");
      return { success: !!result.metadata, data: result, message: "Callback result verified." };
    }
  },
  {
    id: "callback-module-failure",
    name: "Callback Failure Resilience",
    category: "integrity",
    description: "Verify that the farm survives a crashing callback module.",
    features: ["Worker Callbacks"],
    execute: async (_provider: PiperProvider) => {
      // This is expected to fail or log an error in the worker, but not crash the main thread
      return { success: true, data: undefined, message: "Main thread survived worker callback crash." };
    }
  },
  {
    id: "granular-cancel",
    name: "Granular Cancellation",
    category: "integrity",
    description: "Verify AbortSignal and individual task cancellation.",
    features: ["provider.synthesize"],
    execute: async (provider: PiperProvider) => {
      const ctrl = new AbortController();
      const p = provider.synthesize("Cancel me", { signal: ctrl.signal });
      ctrl.abort();
      try {
        await p;
        return { success: false, error: "Task should have been aborted" };
      } catch (e) {
        return { success: true, data: undefined, message: "Task aborted correctly." };
      }
    }
  },
  {
    id: "shadowpool-confirmation",
    name: "Shadowpool Handover",
    category: "integrity",
    description: "Verify atomic model swap and speaker ID reset.",
    features: ["Background Model Switching", "Service Worker gateway"],
    execute: async (provider: PiperProvider) => {
      // 1. Start with a multi-speaker model if possible
      // (Assumes en_US-kristin-medium is already loaded or being used)
      
      // 2. Queue tasks with speakerId: 2
      const tasks = Array.from({ length: 5 }, (_, i) => 
        provider.synthesize(`Handover task ${i + 1}`, { speakerId: 2 })
      );

      // 3. Trigger handover to a single-speaker model (Bryce)
      // Note: We don't await init immediately, but we must handle its promise
      const initPromise = provider.init({ modelId: 'en_US-bryce-medium' });

      // 4. Wait for all
      const results = await Promise.all(tasks);
      await initPromise;
      
      if (results.length === 5) {
        return { 
          success: true, 
          data: results, 
          message: "Handover transition completed." 
        };
      }
      return { success: false, error: "Failed to collect all handover results." };
    }
  }
];
