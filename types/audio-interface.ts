import { AudioSynthesisResult } from 'piper-timing-farm-browser';

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
