import { createPiperProvider } from 'piper-timing-farm-browser';

const btn = document.querySelector<HTMLButtonElement>('#btn')!;
const status = document.querySelector<HTMLDivElement>('#status')!;

btn.onclick = async () => {
  btn.disabled = true;
  status.innerText = 'Initializing Farm... (Syncing OPFS Assets)';

  try {
    const provider = createPiperProvider();
    
    // 1. Initial Load with Worker Callback
    await provider.init({
      voiceId: 'en_US-bryce-medium',
      modelId: 'en_US-bryce-medium',
      cpuInstances: 2,
      callbackModule: {
        path: '/process-phoneme-extraction.js',
        functionName: 'extractPhonemes'
      }
    });

    status.innerText = 'Synthesizing with 2 CPU workers...';
    
    const start = performance.now();
    const result = await provider.synthesize('Hello from the sibling consumer testbed!');
    const duration = performance.now() - start;

    // The callbackResult contains whatever was returned from our worker-thread function
    const phonemes = result.callbackResult as string[];

    status.innerHTML = `
      <strong>SUCCESS!</strong><br>
      - Model: ${result.metadata.modelId}<br>
      - Samples: ${result.audioData.length}<br>
      - Time: ${Math.round(duration)}ms<br>
      - Buffer: [${result.audioData.slice(0, 5).join(', ')}...]
    `;

    const phonemesDiv = document.querySelector<HTMLDivElement>('#phonemes')!;
    phonemesDiv.innerHTML = `<strong>Phonemes:</strong><br>${phonemes.join(' ')}`;

    console.log('Synthesis Result (incl. callback result):', result);
    
  } catch (err) {
    status.innerText = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
    // Clear the phonemes container if it existed
    const phonemesDiv = document.querySelector('#phonemes');
    if (phonemesDiv) phonemesDiv.innerHTML = '';
  } finally {
    btn.disabled = false;
  }
};
