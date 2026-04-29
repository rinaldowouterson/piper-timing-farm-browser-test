import { PiperWorkerFarm, SynthesizeOptions } from "piper-timing-farm-browser";

export type TestResult<T = any> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: Error | string };

export type ScenarioCategory = "feature" | "integrity" | "stress";

export type PiperProvider = Omit<PiperWorkerFarm, 'reinit'> & {
  getActiveModelId: () => string | null;
  cancelDownload: (modelId: string) => Promise<void>;
  deletePiperModel: (modelId: string) => Promise<void>;
  getDownloadState: () => Map<string, any>;
  onLog: (listener: (log: any) => void) => () => void;
  updatePendingOptions: (options: Partial<SynthesizeOptions>) => void;
};

export interface TestScenario {
  id: string;
  name: string;
  category: ScenarioCategory;
  description: string;
  features: string[];
  execute: (provider: PiperProvider) => Promise<TestResult>;
}
