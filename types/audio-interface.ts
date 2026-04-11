/**
 * Unified interfaces for Piper Timing Farm consumer logic.
 * Adheres to the central types registry protocol.
 */

export interface PiperMetadata {
  modelId?: string;
  phonemeIds: number[];
  phonemes?: string[];
  durations?: Float32Array;
  totalAudioDurationMs: number;
  sampleRate: number;
  hopSize: number;
  generationTimeMs?: number;
  speakerId?: number;
}

export interface AudioSynthesisResult {
  audioData: Float32Array;
  sampleRate: number;
  durationMs: number;
  metadata: PiperMetadata;
  callbackResult?: any;
}

export interface SequencerState {
  isPaused: boolean;
  activeCount: number;
  queueDepth: number;
}

export interface Sequencer {
  enqueue: (result: AudioSynthesisResult) => void;
  stop: () => void;
  getState: () => SequencerState;
  onPlay?: (result: AudioSynthesisResult) => void;
}

export interface SynthesizeOptions {
  speed?: number;
  volume?: number;
  speakerId?: number;
}
