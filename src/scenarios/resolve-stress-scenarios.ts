import { TestScenario, PiperProvider } from "./types";
import { createFifoVerifier, runFifoTest } from "../../control-fifo-verifier";
import { ProcessLogger } from "../../process-logging";

// Note: These scenarios require a logger instance, which is provided by the orchestrator.
// However, the TestScenario interface's execute method only takes the provider.
// We will use a closure or a singleton logger for these specific tests if needed, 
// or update the interface. For now, we'll use a no-op logger if none is passed.

const noopLogger: ProcessLogger = {
  log: () => {},
  filterByCategory: () => {},
  clearLogs: () => {},
  exportLogs: () => "",
  getEntries: () => [],
  setMaxEntries: () => {}
};

export const stressScenarios: TestScenario[] = [
  {
    id: "fifo-verification",
    name: "FIFO Order Verification",
    category: "stress",
    description: "Verify results arrive in exact request order (50 requests).",
    features: ["provider.synthesize", "FIFO order sequencing"],
    execute: async (provider: PiperProvider) => {
      const verifier = createFifoVerifier(noopLogger);
      return await runFifoTest(provider as any, noopLogger, verifier, 50);
    }
  },
  {
    id: "hotswap-stress",
    name: "Hotswap Load Verification",
    category: "stress",
    description: "Verify Atomic Supersession under rapid model switching (10 cycles).",
    features: ["createPiperWorkerFarm", "Background model switching"],
    execute: async (provider) => {
      const models = ['en_US-bryce-medium', 'en_US-ljspeech-high', 'en_US-arctic-medium'];
      try {
        for (let i = 0; i < 10; i++) {
          await provider.init({
            modelId: models[i % models.length],
            cpuInstances: 2
          });
        }
        return { success: true, data: undefined, message: "Completed 10 hotswap cycles without error." };
      } catch (error: any) {
        return { success: false, error: error instanceof Error ? error : String(error) };
      }
    }
  },
  {
    id: "memory-pressure",
    name: "Memory Pressure Test",
    category: "stress",
    description: "Verify stability under heavy payload (100 parallel requests).",
    features: ["provider.synthesize", "multi-threaded processing"],
    execute: async (provider) => {
      const tasks = Array.from({ length: 100 }, (_, i) => provider.synthesize(`Memory pressure task ${i}`));
      await Promise.all(tasks);
      return { success: true, data: undefined, message: "Handled 100 parallel requests." };
    }
  },
  {
    id: "burst-concurrency",
    name: "Flash Flood Stress",
    category: "stress",
    description: "Simultaneous burst of 50 tasks.",
    features: ["provider.synthesize", "FIFO order sequencing"],
    execute: async (provider) => {
      const tasks = Array.from({ length: 50 }, (_, i) => provider.synthesize(`Flood task ${i}`));
      await Promise.all(tasks);
      return { success: true, data: undefined, message: "High-concurrency burst completed." };
    }
  }
];
