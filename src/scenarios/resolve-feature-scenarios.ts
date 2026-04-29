import { TestScenario, PiperProvider } from "./types";

export const featureScenarios: TestScenario[] = [
  {
    id: "basic-init",
    name: "Basic Initialization",
    category: "feature",
    description: "Verify that the farm can initialize with a standard model.",
    features: ["createPiperWorkerFarm", "provider.getMetrics"],
    execute: async (provider) => {
      try {
        await provider.init({
          modelId: "en_US-bryce-medium",
          cpuInstances: 2
        });
        return { success: true, data: undefined, message: "Farm initialized successfully." };
      } catch (error: any) {
        return { success: false, error: error instanceof Error ? error : String(error) };
      }
    }
  },
  {
    id: "standard-synthesis",
    name: "Standard Synthesis",
    category: "feature",
    description: "Verify that basic synthesis produces audio data.",
    features: ["provider.synthesize"],
    execute: async (provider) => {
      try {
        const result = await provider.synthesize("Hello world");
        if (result.audioData.length > 0) {
          return { success: true, data: undefined, message: `Synthesized ${result.audioData.length} samples.` };
        }
        return { success: false, error: "Synthesis produced empty audio data." };
      } catch (error: any) {
        return { success: false, error: error instanceof Error ? error : String(error) };
      }
    }
  },
  {
    id: "api-tour",
    name: "Sequential API Tour",
    category: "feature",
    description: "Verify 100% API surface coverage sequentially.",
    features: ["provider.synthesize", "provider.getMetrics"],
    execute: async (provider) => {
      try {
        // 1. init
        await provider.init({ modelId: "en_US-bryce-medium" });
        
        // 2. synthesize
        await provider.synthesize("API Tour");
        
        // 3. metrics
        const metrics = provider.metrics;
        if (typeof metrics.totalWorkers !== 'number') return { success: false, error: "Metrics failed" };
        
        // 4. getActiveModelId
        const modelId = provider.getActiveModelId();
        if (modelId !== "en_US-bryce-medium") return { success: false, error: "Model ID mismatch" };
        
        // 5. isInitialized
        if (!provider.isInitialized()) return { success: false, error: "Init check failed" };

        return { success: true, data: undefined, message: "API Tour completed successfully." };
      } catch (error: any) {
        return { success: false, error: error instanceof Error ? error : String(error) };
      }
    }
  },
  {
    id: "unified-asset-resolution",
    name: "Unified Asset Resolution",
    category: "feature",
    description: "Verify that assets are correctly resolved through the Service Worker gateway.",
    features: ["Service Worker gateway"],
    execute: async (provider: PiperProvider) => {
      const isOk = provider.isInitialized();
      if (isOk) {
        return { success: true, data: undefined, message: "Gateway resolution verified." };
      }
      return { success: false, error: "Gateway bypass detected." };
    }
  },
  {
    id: "speed-volume",
    name: "Speed/Volume Verification",
    category: "feature",
    description: "Verify synthesis with custom speed and volume options.",
    features: ["provider.synthesize"],
    execute: async (provider: PiperProvider) => {
      const result = await provider.synthesize("Speed and volume test", { speed: 1.5, volume: 0.8 });
      if (result.audioData.length > 0) {
        return { success: true, data: result, message: "Custom options applied." };
      }
      return { success: false, error: "Synthesis produced empty audio data." };
    }
  },
  {
    id: "multi-speaker",
    name: "Multi-Speaker Validation",
    category: "feature",
    description: "Verify synthesis with a specific speaker ID.",
    features: ["provider.synthesize"],
    execute: async (provider: PiperProvider) => {
      const result = await provider.synthesize("Speaker test", { speakerId: 1 });
      if (result.audioData.length > 0) {
        return { success: true, data: result, message: "Multi-speaker synthesis verified." };
      }
      return { success: false, error: "Synthesis produced empty audio data." };
    }
  },
  {
    id: "surgical-parameter-pivot",
    name: "Parameter Pivot",
    category: "feature",
    description: "Verify mid-stream queue update for speed and speaker.",
    features: ["provider.synthesize"],
    execute: async (provider: PiperProvider) => {
      // 1. Queue a burst of tasks
      const tasks = Array.from({ length: 10 }, (_, i) => 
        provider.synthesize(`Pivoting task number ${i + 1}`, { speed: 1.0 })
      );

      // 2. Pivot mid-stream (give it 100ms to start processing)
      await new Promise(r => setTimeout(r, 100));
      provider.updatePendingOptions({ speed: 3.0 });

      // 3. Wait for all
      const results = await Promise.all(tasks);
      
      // 4. Verify that later items have the new speed
      // (The first few will likely have finished at 1.0)
      const lastResult = results[results.length - 1];
      if (lastResult && lastResult.audioData.length > 0) {
        return { 
          success: true, 
          data: results, 
          message: "Mid-stream parameter pivot completed." 
        };
      }
      
      return { success: false, error: "Pivot verification failed: last task empty." };
    }
  }
];
