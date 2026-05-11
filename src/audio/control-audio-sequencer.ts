import { AudioSynthesisResult } from 'piper-timing-farm-browser';
import { Sequencer, SequencerState } from '../../types/audio-interface';

/**
 * Factory for a sequential audio playback orchestrator.
 * Adheres to the Stateless Logic protocol (closure-based state).
 */
export function createAudioSequencer(ctx: AudioContext): Sequencer {
  let queue: AudioSynthesisResult[] = [];
  let isPlaying = false;
  let activeSource: AudioBufferSourceNode | null = null;

  async function playBuffer(result: AudioSynthesisResult) {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const buffer = ctx.createBuffer(1, result.audioData.length, result.sampleRate);
    buffer.copyToChannel(new Float32Array(result.audioData), 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    activeSource = source;
    isPlaying = true;

    source.onended = () => {
      isPlaying = false;
      activeSource = null;
      playNext();
    };

    source.start();
    if (instance.onPlay) {
      instance.onPlay(result);
    }
  }

  function playNext() {
    if (isPlaying || queue.length === 0) return;
    const next = queue.shift();
    if (next) {
      playBuffer(next).catch(err => {
        console.error('Audio playback failed:', err);
        isPlaying = false;
        playNext(); // Attempt next if current fails
      });
    }
  }

  const instance: Sequencer = {
    enqueue: (result: AudioSynthesisResult) => {
      queue.push(result);
      playNext();
    },
    stop: () => {
      queue = [];
      if (activeSource) {
        try { activeSource.stop(); } catch (e) {}
        activeSource = null;
      }
      isPlaying = false;
    },
    getState: (): SequencerState => ({
      isPaused: ctx.state === 'suspended',
      activeCount: isPlaying ? 1 : 0,
      queueDepth: queue.length
    }),
    onPlay: undefined
  };

  return instance;
}
