import { createPiperProvider } from 'piper-timing-farm-browser';

const btn = document.querySelector<HTMLButtonElement>('#btn')!;
const status = document.querySelector<HTMLDivElement>('#status')!;

btn.onclick = async () => {
  btn.disabled = true;
  status.innerText = 'Initializing Farm... (Syncing OPFS Assets)';

  try {
    const provider = createPiperProvider();
    
    // 1. Initial Load: Bryce (Bundled Tier)
    await provider.init({
      voiceId: 'en_US-bryce-medium',
      modelId: 'en_US-bryce-medium',
      cpuInstances: 2,
    });

    status.innerText = 'Synthesizing with 2 CPU workers...';
    
    const start = performance.now();
    const result = await provider.synthesize('Hello from the sibling consumer testbed!');
    const duration = performance.now() - start;

    status.innerHTML = `
      <strong>SUCCESS!</strong><br>
      - Model: ${result.metadata.modelId}<br>
      - Samples: ${result.audioData.length}<br>
      - Time: ${Math.round(duration)}ms<br>
      - Buffer: [${result.audioData.slice(0, 5).join(', ')}...]
    `;

    console.log('Synthesis Result:', result);
    
  } catch (err) {
    status.innerText = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    btn.disabled = false;
  }
};
