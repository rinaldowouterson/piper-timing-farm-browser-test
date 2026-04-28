import { PiperWorkerFarm } from "piper-timing-farm-browser";
import { TestScenario, TestResult } from "./types";

export const featureScenarios: TestScenario[] = [
  {
    name: "Basic Initialization",
    category: "feature",
    description: "Verify that the farm can initialize with a standard model.",
    execute: async (provider: PiperWorkerFarm): Promise<TestResult> => {
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
    name: "Standard Synthesis",
    category: "feature",
    description: "Verify that basic synthesis produces audio data.",
    execute: async (provider: PiperWorkerFarm): Promise<TestResult> => {
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
    name: "Sequential API Tour",
    category: "feature",
    description: "Verify 100% API surface coverage sequentially.",
    execute: async (provider: PiperWorkerFarm): Promise<TestResult> => {
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
  }
];
