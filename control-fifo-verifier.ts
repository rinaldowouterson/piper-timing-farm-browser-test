/**
 * FIFO Order Verification Controller
 * 
 * Verifies that synthesis results arrive in exact request order,
 * testing the Parallel FIFO Sequencer feature of Piper Timing Farm.
 */

import { ProcessLogger, LogHelpers } from './process-logging';

export interface FifoVerifier {
  recordRequest: (requestId: string) => void;
  recordResult: (requestId: string) => void;
  verify: () => boolean;
  getStats: () => FifoStats;
  reset: () => void;
}

export interface FifoStats {
  requestCount: number;
  resultCount: number;
  pendingCount: number;
  mismatches: number;
  mismatchDetails: Array<{ position: number; expected: string; actual: string }>;
  passed: boolean;
}

/**
 * Factory for creating a FIFO order verifier.
 */
export function createFifoVerifier(logger: ProcessLogger): FifoVerifier {
  const requestOrder: string[] = [];
  const resultOrder: string[] = [];
  const requestTimestamps: Map<string, number> = new Map();
  const resultTimestamps: Map<string, number> = new Map();

  const recordRequest = (requestId: string) => {
    requestOrder.push(requestId);
    requestTimestamps.set(requestId, Date.now());
    LogHelpers.fifo.enqueue(logger, requestId, requestOrder.length, requestOrder.length);
  };

  const recordResult = (requestId: string) => {
    resultOrder.push(requestId);
    resultTimestamps.set(requestId, Date.now());
    
    const position = resultOrder.length;
    const requestTime = requestTimestamps.get(requestId) || 0;
    const resultTime = resultTimestamps.get(requestId) || 0;
    const waitTimeMs = resultTime - requestTime;
    
    LogHelpers.fifo.drain(logger, requestId, position, waitTimeMs);
  };

  const verify = (): boolean => {
    const mismatches: Array<{ position: number; expected: string; actual: string }> = [];
    
    // Compare arrays
    const minLength = Math.min(requestOrder.length, resultOrder.length);
    for (let i = 0; i < minLength; i++) {
      if (requestOrder[i] !== resultOrder[i]) {
        mismatches.push({
          position: i,
          expected: requestOrder[i],
          actual: resultOrder[i]
        });
      }
    }

    // Check for missing results
    if (requestOrder.length > resultOrder.length) {
      for (let i = resultOrder.length; i < requestOrder.length; i++) {
        mismatches.push({
          position: i,
          expected: requestOrder[i],
          actual: 'MISSING'
        });
      }
    }

    // Check for extra results
    if (resultOrder.length > requestOrder.length) {
      for (let i = requestOrder.length; i < resultOrder.length; i++) {
        mismatches.push({
          position: i,
          expected: 'MISSING',
          actual: resultOrder[i]
        });
      }
    }

    const passed = mismatches.length === 0 && requestOrder.length === resultOrder.length;
    
    LogHelpers.fifo.verifyComplete(logger, passed, requestOrder, resultOrder);
    
    return passed;
  };

  const getStats = (): FifoStats => {
    const mismatches: Array<{ position: number; expected: string; actual: string }> = [];
    const minLength = Math.min(requestOrder.length, resultOrder.length);
    
    for (let i = 0; i < minLength; i++) {
      if (requestOrder[i] !== resultOrder[i]) {
        mismatches.push({
          position: i,
          expected: requestOrder[i],
          actual: resultOrder[i]
        });
      }
    }

    return {
      requestCount: requestOrder.length,
      resultCount: resultOrder.length,
      pendingCount: requestOrder.length - resultOrder.length,
      mismatches: mismatches.length,
      mismatchDetails: mismatches,
      passed: mismatches.length === 0 && requestOrder.length === resultOrder.length
    };
  };

  const reset = () => {
    requestOrder.length = 0;
    resultOrder.length = 0;
    requestTimestamps.clear();
    resultTimestamps.clear();
  };

  return {
    recordRequest,
    recordResult,
    verify,
    getStats,
    reset
  };
}

/**
 * Generate unique request IDs for testing.
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * FIFO Test Scenario Runner
 */
export async function runFifoTest(
  provider: ReturnType<typeof import('piper-timing-farm-browser').createPiperProvider>,
  logger: ProcessLogger,
  verifier: FifoVerifier,
  count: number = 50,
  textGenerator: (index: number) => string = (i) => `[#${i}] FIFO test sentence number ${i}.`
): Promise<{ passed: boolean; stats: FifoStats }> {
  
  LogHelpers.test.scenarioStart(logger, 'fifo-verification', `FIFO Order Verification (${count} requests)`);
  
  const startTime = Date.now();
  verifier.reset();
  
  // Ensure provider is initialized
  if (!provider.isInitialized()) {
    LogHelpers.lifecycle.initRequested(logger, 'en_US-bryce-medium', 2);
    await provider.init({
      modelId: 'en_US-bryce-medium',
      cpuInstances: 2
    });
    LogHelpers.lifecycle.promotionComplete(logger, 'en_US-bryce-medium', 2);
  }

  // Submit all requests
  const promises: Promise<void>[] = [];
  
  for (let i = 0; i < count; i++) {
    const requestId = generateRequestId();
    const text = textGenerator(i);
    
    verifier.recordRequest(requestId);
    LogHelpers.synthesis.requested(logger, requestId, text);
    
    const promise = provider.synthesize(text, { requestId }).then(result => {
      verifier.recordResult(requestId);
      LogHelpers.synthesis.resultReady(
        logger, 
        requestId, 
        result.metadata.modelId || 'unknown',
        result.durationMs,
        result.metadata.generationTimeMs || 0
      );
    });
    
    promises.push(promise);
  }

  // Wait for all results
  await Promise.all(promises);
  
  // Verify order
  const passed = verifier.verify();
  const stats = verifier.getStats();
  const duration = Date.now() - startTime;
  
  if (passed) {
    LogHelpers.test.scenarioPass(logger, 'fifo-verification', duration, count * 4);
  } else {
    LogHelpers.test.scenarioFail(logger, 'fifo-verification', `${stats.mismatches} order mismatches`, duration);
  }
  
  return { passed, stats };
}