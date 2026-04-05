let activeSources: AudioBufferSourceNode[] = [];

/**
 * Play raw audio buffer using Web Audio API.
 */
export function playRawAudio(data: Float32Array, ctx: AudioContext, sampleRate: number = 22050) {
  const buffer = ctx.createBuffer(1, data.length, sampleRate);
  // Ensure the data is a plain Float32Array (not SharedArrayBuffer backed) for copyToChannel
  const channelData = new Float32Array(data);
  buffer.copyToChannel(channelData, 0);
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  
  activeSources.push(source);
  
  source.onended = () => {
    activeSources = activeSources.filter(s => s !== source);
  };
  
  source.start();
  return source;
}

/**
 * Stop all active audio playback.
 */
export function stopAudio() {
  activeSources.forEach(source => {
    try {
      source.stop();
    } catch (e) {
      // Ignore errors if source already stopped
    }
  });
  activeSources = [];
}
