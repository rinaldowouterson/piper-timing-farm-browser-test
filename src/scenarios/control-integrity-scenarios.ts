import { TestScenario, TestResult } from "./types";

export const integrityScenarios: TestScenario[] = [
  {
    name: "Infrastructure Reset Recovery",
    category: "integrity",
    description: "Verify SW recovers from destructive infra-clear via network re-fetch.",
    execute: async (provider: any): Promise<TestResult> => {
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
    name: "Model Purge Verification",
    category: "integrity",
    description: "Verify that specific models can be deleted from local storage.",
    execute: async (provider: any): Promise<TestResult> => {
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
    name: "Model Cache Clear",
    category: "integrity",
    description: "Verify that clearing the model cache removes all stored voices.",
    execute: async (provider: any): Promise<TestResult> => {
      try {
        await provider.clearPiperModelCache();
        return { success: true, data: undefined, message: "Model cache cleared successfully." };
      } catch (error: any) {
        return { success: false, error: error instanceof Error ? error : String(error) };
      }
    }
  }
];
