import { PiperWorkerFarm } from "piper-timing-farm-browser";

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
};

export interface TestScenario {
  name: string;
  category: ScenarioCategory;
  description: string;
  execute: (provider: PiperWorkerFarm | any) => Promise<TestResult>;
}
