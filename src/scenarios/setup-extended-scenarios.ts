import { TestScenario, PiperProvider, TestResult } from "./types";

// ============================================
// Shared Utilities
// ============================================

/** Deterministic delay. Replaces LLM timing interpretation. */
function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Generates a unique request ID with an embedded sequence tag. */
function taggedId(tag: string, seq: number): string {
  return `bh-${tag}-${seq}-${Date.now().toString(36)}`;
}

interface SubStep {
  name: string;
  passed: boolean;
  detail: string;
  durationMs: number;
}

function subStepReport(steps: SubStep[]): TestResult {
  const failures = steps.filter((s) => !s.passed);
  const summary = steps
    .map((s) => `[${s.passed ? "PASS" : "FAIL"}] ${s.name}: ${s.detail} (${s.durationMs}ms)`)
    .join("\n");

  if (failures.length === 0) {
    return { success: true, data: steps, message: summary };
  }
  return {
    success: false,
    error: `${failures.length}/${steps.length} sub-steps failed:\n${summary}`,
  };
}

async function runSubStep(
  name: string,
  fn: () => Promise<string>
): Promise<SubStep> {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return { name, passed: true, detail, durationMs: Date.now() - t0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name, passed: false, detail: msg, durationMs: Date.now() - t0 };
  }
}

// ============================================
// Stress Scenario Builder
// ============================================

interface StressTimings {
  pivotWait: number;
  speakerMutationWait: number;
  ukrainianPivotWait: number;
  modelSwapWait: number;
  callbackToggleWait: number;
  floodPurgeWait: number;
  floodRecoveryWait: number;
  paramCycleWait: number;
  supersessionWait: number;
}

function buildStressScenario(
  id: string,
  name: string,
  description: string,
  timings: StressTimings
): TestScenario {
  return {
    id,
    name,
    category: "stress",
    description,
    features: [
      "provider.init",
      "provider.synthesize",
      "provider.updatePendingOptions",
      "provider.cancelSynthesis",
      "provider.cancelAllSynthesis",
      "Background model switching",
      "Worker Callbacks",
      "FIFO order sequencing",
    ],
    execute: async (provider: PiperProvider): Promise<TestResult> => {
      const steps: SubStep[] = [];

      // ── 0. Ensure Bryce is active ─────────────────
      steps.push(
        await runSubStep("Baseline Init", async () => {
          await provider.init({ modelId: "en_US-bryce-medium", cpuInstances: 2 });
          return `Active: ${provider.getActiveModelId()}`;
        })
      );

      // ── 0.5. AbortSignal Cancellation ──────────────
      // (Merged from the old sequential regular test)
      steps.push(
        await runSubStep("AbortSignal Cancellation", async () => {
          const ctrl = new AbortController();
          const p = provider.synthesize("Cancel me immediately.", {
            signal: ctrl.signal,
          });
          ctrl.abort();
          try {
            await p;
            throw Error("Task should have been aborted");
          } catch (err: unknown) {
            if (err instanceof DOMException && err.name === "AbortError") {
              return "AbortError raised correctly";
            }
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("abort")) {
              return `Cancellation confirmed: ${msg}`;
            }
            throw err;
          }
        })
      );

      // ── 1. PIVOT DURING ACTIVE SYNTHESIS ──────────
      steps.push(
        await runSubStep("Pivot During Active Synthesis", async () => {
          const tasks = Array.from({ length: 30 }, (_, i) =>
            provider.synthesize(`Stress pivot task ${i}`, {
              requestId: taggedId("stress-pivot", i),
              speed: 1.0,
              volume: 1.0,
            })
          );

          await wait(timings.pivotWait);
          provider.updatePendingOptions({ speed: 2.5, volume: 0.6 });

          const results = await Promise.all(tasks);
          const allValid = results.every((r) => r.audioData.length > 0);
          if (!allValid) throw Error("Some pivoted tasks returned empty audio");
          return `30/30 completed. Pivot applied mid-synthesis.`;
        })
      );

      // ── 2. SPEAKER ID MUTATION MID-QUEUE ──────────
      steps.push(
        await runSubStep("Speaker ID Mutation Mid-Queue", async () => {
          const tasks = Array.from({ length: 20 }, (_, i) =>
            provider.synthesize(`Speaker mutation ${i}`, {
              requestId: taggedId("spk-mutate", i),
              speakerId: 0,
            })
          );

          await wait(timings.speakerMutationWait);
          provider.updatePendingOptions({ speakerId: 0, speed: 1.5 });

          const results = await Promise.all(tasks);
          const allValid = results.every((r) => r.audioData.length > 0);
          if (!allValid) throw Error("Speaker mutation caused empty audio");
          return `20/20 completed after speaker mutation.`;
        })
      );

      // ── 3. UKRAINIAN MULTI-SPEAKER ──────
      steps.push(
        await runSubStep("Ukrainian Multi-Speaker: speakerId 2 → 0", async () => {
          await provider.init({
            modelId: "uk_UA-ukrainian_tts-medium",
            cpuInstances: 2,
          });

          const ukrainianTexts = [
            "Добрий день, це тест синтезу мовлення.",
            "Система перевіряє стабільність черги запитів.",
            "Перемикання між голосами відбувається без перерви.",
            "Паралельна обробка забезпечує максимальну продуктивність.",
            "Цей тест перевіряє коректність оновлення параметрів.",
            "Голос два активний до моменту зміни параметрів.",
            "Після зміни всі нові запити використовують голос нуль.",
            "Система повинна завершити всі завдання без помилок.",
            "Перевірка порядку FIFO є критичною для цього тесту.",
            "Завершення тесту підтверджує стабільність системи.",
          ];

          const tasks = ukrainianTexts.map((text, i) =>
            provider.synthesize(text, {
              requestId: taggedId("ukr-spk", i),
              speakerId: 2,
              speed: 1.0,
            })
          );

          await wait(timings.ukrainianPivotWait);
          provider.updatePendingOptions({ speakerId: 0 });

          const results = await Promise.all(tasks);
          const allValid = results.every((r) => r.audioData.length > 0);
          if (!allValid) throw Error("Ukrainian multi-speaker pivot produced empty audio");

          const speakerIds = results.map((r) => r.metadata.speakerId ?? "?").join(",");
          return `10/10 completed. speakerIds in results: [${speakerIds}]`;
        })
      );

      // ── 4. MODEL SWAP DURING ACTIVE QUEUE ─────────
      steps.push(
        await runSubStep("Model Swap During Active Queue (Ukrainian → Cori)", async () => {
          const longText =
            "The quick brown fox jumps over the lazy dog while the piper timing farm orchestrates " +
            "parallel synthesis across multiple worker threads for maximum throughput.";

          const tasks = Array.from({ length: 15 }, (_, i) =>
            provider.synthesize(`${longText} [Swap-${i}]`, {
              requestId: taggedId("swap-active", i),
              speakerId: i % 3,
            })
          );

          await wait(timings.modelSwapWait);
          const swapPromise = provider.init({
            modelId: "en_GB-cori-medium",
            cpuInstances: 2,
          });

          const settled = await Promise.allSettled(tasks);
          await swapPromise;

          const completed = settled.filter((s) => s.status === "fulfilled").length;
          const failed = settled.filter((s) => s.status === "rejected").length;
          const activeModel = provider.getActiveModelId();

          return `${completed} completed, ${failed} rejected. Active model: ${activeModel}`;
        })
      );

      // ── 5. CALLBACK TOGGLE UNDER LOAD ─────────────
      steps.push(
        await runSubStep("Callback Toggle Under Load", async () => {
          const currentModel = provider.getActiveModelId();
          if (!currentModel) throw Error("No active model for callback toggle test");

          const tasks = Array.from({ length: 20 }, (_, i) =>
            provider.synthesize(`Callback stress ${i}`, {
              requestId: taggedId("cb-stress", i),
            })
          );

          await wait(timings.callbackToggleWait);
          const togglePromise = provider.init({
            modelId: currentModel,
            useCallback: true,
          });

          const results = await Promise.all(tasks);
          await togglePromise;

          const allValid = results.every((r) => r.audioData.length > 0);
          if (!allValid) throw Error("Callback toggle caused empty audio");

          const verifyResult = await provider.synthesize("Callback verify.");
          const hasCallback = verifyResult.callbackResult !== undefined;

          await provider.init({ modelId: currentModel, useCallback: false });

          return `20/20 pre-toggle completed. Post-toggle callback=${hasCallback ? "active" : "inactive"}`;
        })
      );

      // ── 6. FLASH FLOOD + PURGE RACE ───────────────
      steps.push(
        await runSubStep("Flash Flood + Purge Race", async () => {
          const texts = [
            "High-concurrency burst sentence alpha under maximum concurrency pressure.",
            "High-concurrency burst sentence bravo testing parallel WASM execution limits.",
            "High-concurrency burst sentence charlie verifying FIFO sequencer integrity.",
            "High-concurrency burst sentence delta stressing worker thread pool management.",
            "High-concurrency burst sentence echo validating queue transformation logic.",
          ];

          const tasks = Array.from({ length: 50 }, (_, i) =>
            provider.synthesize(texts[i % texts.length], {
              requestId: taggedId("flood", i),
            })
          );

          await wait(timings.floodPurgeWait);
          provider.cancelAllSynthesis();

          const settled = await Promise.allSettled(tasks);
          const completed = settled.filter((s) => s.status === "fulfilled").length;
          const cancelled = settled.filter((s) => s.status === "rejected").length;

          await wait(timings.floodRecoveryWait);
          const recoveryResult = await provider.synthesize("Post-purge recovery.");
          if (recoveryResult.audioData.length === 0) throw Error("System failed to recover from purge");

          return `${completed} completed, ${cancelled} cancelled. Post-purge recovery: OK`;
        })
      );

      // ── 7. RAPID PARAMETER CYCLING ────────────────
      steps.push(
        await runSubStep("Rapid Parameter Cycling", async () => {
          const tasks = Array.from({ length: 25 }, (_, i) =>
            provider.synthesize(`Param cycle ${i}`, {
              requestId: taggedId("param-cycle", i),
              speed: 1.0,
              volume: 1.0,
              speakerId: 0,
            })
          );

          const paramSets = [
            { speed: 0.8, volume: 1.2, speakerId: 0 },
            { speed: 1.5, volume: 0.5, speakerId: 0 },
            { speed: 3.0, volume: 1.0, speakerId: 0 },
            { speed: 0.5, volume: 0.8, speakerId: 0 },
            { speed: 2.0, volume: 1.5, speakerId: 0 },
          ];

          for (let i = 0; i < paramSets.length; i++) {
            await wait(timings.paramCycleWait);
            provider.updatePendingOptions(paramSets[i]);
          }

          const results = await Promise.all(tasks);
          const allValid = results.every((r) => r.audioData.length > 0);
          if (!allValid) throw Error("Parameter cycling caused empty audio");
          return `25/25 completed across ${paramSets.length} parameter pivots`;
        })
      );

      // ── 8. CONCURRENT INIT SUPERSESSION ────────────
      steps.push(
        await runSubStep("Concurrent Init Supersession", async () => {
          const models = [
            "en_US-bryce-medium",
            "uk_UA-ukrainian_tts-medium",
            "en_GB-cori-medium",
            "en_US-ljspeech-high",
            "uk_UA-ukrainian_tts-medium",
            "en_US-bryce-medium", // final winner
          ];

          const initPromises: Promise<void>[] = [];
          for (let i = 0; i < models.length; i++) {
            initPromises.push(provider.init({ modelId: models[i] }));
            await wait(timings.supersessionWait);
          }

          await Promise.allSettled(initPromises);

          const activeModel = provider.getActiveModelId();
          if (!activeModel) throw Error("No active model after supersession");

          const result = await provider.synthesize("Post-supersession verify.");
          if (result.audioData.length === 0) throw Error("Empty audio after supersession");

          return `Supersession settled on: ${activeModel}`;
        })
      );

      // ── 9. SYNTHESIS WHILE IDLE (BASELINE RECOVERY) ─
      steps.push(
        await runSubStep("Post-Stress Baseline Recovery", async () => {
          const result = await provider.synthesize("Final baseline recovery check.");
          if (result.audioData.length === 0) throw Error("Recovery synthesis empty");
          
          if (!provider.isInitialized()) throw Error("Provider reports not initialized");
          
          const m = provider.metrics;
          return `Recovered. samples=${result.audioData.length}, workers=${m.totalWorkers}, queue=${m.queueLength}`;
        })
      );

      return subStepReport(steps);
    },
  };
}

// ============================================
// Instances
// ============================================

export const regularExtended = buildStressScenario(
  "extended-standard",
  "Extended: Regular",
  "Complete API tour and overlapping operations with LOOSE timings to allow UI validation.",
  {
    pivotWait: 500,
    speakerMutationWait: 500,
    ukrainianPivotWait: 1000,
    modelSwapWait: 1000,
    callbackToggleWait: 500,
    floodPurgeWait: 1000,
    floodRecoveryWait: 500,
    paramCycleWait: 1000,
    supersessionWait: 1500,
  }
);

export const overloadExtended = buildStressScenario(
  "extended-concurrency",
  "Extended: Overload",
  "Complete API tour and overlapping operations with STRICT timings to stress WASM concurrency limits.",
  {
    pivotWait: 200,
    speakerMutationWait: 100,
    ukrainianPivotWait: 300,
    modelSwapWait: 300,
    callbackToggleWait: 150,
    floodPurgeWait: 500,
    floodRecoveryWait: 200,
    paramCycleWait: 100,
    supersessionWait: 100,
  }
);

export const extendedScenarios: TestScenario[] = [regularExtended, overloadExtended];
