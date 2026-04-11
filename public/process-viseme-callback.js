/**
 * Worker-Thread Callback Module for Viseme Extraction
 * 
 * This module runs inside the worker thread after each synthesis,
 * extracting visemes from phonemes and computing timestamps.
 * 
 * Usage (in main thread):
 * await provider.init({
 *   callbackModule: {
 *     path: '/js/process-viseme-callback.js',
 *     functionName: 'processVisemes'
 *   }
 * });
 */

/**
 * Phoneme to Viseme mapping (simplified Preston model)
 * 
 * Viseme IDs:
 * 0 - Silence/Rest
 * 1 - A, AI, EI (open mouth)
 * 2 - E, EE (wide mouth)
 * 3 - O, OU (round mouth)
 * 4 - U, OO (tight round)
 * 5 - I, Y (semi-open)
 * 6 - W, Q (lip protrusion)
 * 7 - F, V (lip contact)
 * 8 - TH, DH (tongue between teeth)
 * 9 - L, R (tongue tip up)
 * 10 - S, Z, SH, CH, J (teeth close)
 * 11 - T, D, N (tongue tip alveolar)
 * 12 - K, G, NG (back tongue)
 * 13 - P, B, M (lip closure)
 * 14 - H (open)
 */
const PHONEME_TO_VISEME_MAP = {
    // Vowels
    'a': 1, 'ɑ': 1, 'æ': 1, 'ʌ': 1,
    'e': 2, 'ɛ': 2, 'ə': 2,
    'i': 5, 'ɪ': 5, 'iː': 5,
    'o': 3, 'oʊ': 3, 'ɔ': 3,
    'u': 4, 'uː': 4, 'ʊ': 4,
    'y': 5, 'j': 5,
    'w': 6,

    // Consonants - Labial
    'p': 13, 'b': 13, 'm': 13,
    'f': 7, 'v': 7,

    // Consonants - Dental/Alveolar
    'θ': 8, 'ð': 8,
    'l': 9, 'r': 9, 'ɹ': 9,
    's': 10, 'z': 10, 'ʃ': 10, 'ʒ': 10, 'tʃ': 10, 'dʒ': 10,
    't': 11, 'd': 11, 'n': 11,

    // Consonants - Velar/Glottal
    'k': 12, 'g': 12, 'ŋ': 12,
    'h': 14,

    // Silence
    'sil': 0, 'pause': 0, '_': 0
};

/**
 * Convert phoneme symbol to viseme ID
 */
function phonemeToViseme(phoneme) {
    // Normalize phoneme (remove stress markers, length markers)
    const normalized = phoneme.replace(/[ˈˌː]/g, '').toLowerCase();

    // Look up in map
    if (PHONEME_TO_VISEME_MAP[normalized] !== undefined) {
        return PHONEME_TO_VISEME_MAP[normalized];
    }

    // Try partial match for complex phonemes
    for (const [key, value] of Object.entries(PHONEME_TO_VISEME_MAP)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    // Default to rest position
    return 0;
}

/**
 * Compute cumulative timestamps from durations
 */
function computeTimestamps(durations) {
    if (!durations || durations.length === 0) {
        return new Float32Array(0);
    }

    const timestamps = new Float32Array(durations.length);
    let cumulative = 0;

    for (let i = 0; i < durations.length; i++) {
        timestamps[i] = cumulative;
        cumulative += durations[i];
    }

    return timestamps;
}

/**
 * Main callback function - called by worker after synthesis
 * 
 * @param {Object} result - Synthesis result from Piper
 * @param {Float32Array} result.audioData - Raw audio samples
 * @param {Object} result.metadata - Piper metadata
 * @param {string[]} result.metadata.phonemes - Phoneme symbols
 * @param {Float32Array} result.metadata.durations - Per-phoneme timing (ms)
 * @returns {Object} - Callback result (will be attached to synthesis result)
 */
export function processVisemes(result) {
    // Extract phonemes
    const phonemes = result.metadata?.phonemes || [];
    const durations = result.metadata?.durations || new Float32Array(0);

    // Convert phonemes to visemes
    const visemes = new Uint8Array(phonemes.length);
    for (let i = 0; i < phonemes.length; i++) {
        visemes[i] = phonemeToViseme(phonemes[i]);
    }

    // Compute timestamps
    const timestamps = computeTimestamps(durations);

    // Compute viseme durations (same as phoneme durations)
    const visemeDurations = durations.slice ? durations.slice() : new Float32Array(durations);

    // Create viseme sequence with timing
    const visemeSequence = [];
    for (let i = 0; i < visemes.length; i++) {
        visemeSequence.push({
            visemeId: visemes[i],
            phoneme: phonemes[i],
            startTime: timestamps[i],
            duration: visemeDurations[i]
        });
    }

    // Return transferable data for zero-copy transfer
    return {
        // Transferable arrays (will be moved, not copied)
        visemes: visemes,
        timestamps: timestamps,
        visemeDurations: visemeDurations,

        // Non-transferable metadata (will be copied)
        visemeSequence: visemeSequence,
        phonemeCount: phonemes.length,
        totalDuration: timestamps[timestamps.length - 1] + (visemeDurations[visemeDurations.length - 1] || 0),

        // Viseme statistics
        uniqueVisemes: [...new Set(visemes)].sort(),
        visemeDistribution: computeVisemeDistribution(visemes)
    };
}

/**
 * Compute distribution of viseme IDs
 */
function computeVisemeDistribution(visemes) {
    const distribution = {};

    for (let i = 0; i < visemes.length; i++) {
        const v = visemes[i];
        distribution[v] = (distribution[v] || 0) + 1;
    }

    return distribution;
}

/**
 * Alternative callback: Simple phoneme timing extraction
 * 
 * Use this if you only need phoneme-level timing without viseme conversion.
 */
export function processPhonemeTiming(result) {
    const phonemes = result.metadata?.phonemes || [];
    const durations = result.metadata?.durations || new Float32Array(0);
    const timestamps = computeTimestamps(durations);

    return {
        phonemes: phonemes,
        timestamps: timestamps,
        durations: durations,
        phonemeCount: phonemes.length,
        totalDuration: timestamps[timestamps.length - 1] + (durations[durations.length - 1] || 0)
    };
}

/**
 * Alternative callback: Audio analysis
 * 
 * Use this for audio-level analysis (RMS, peaks, etc.)
 */
export function processAudioAnalysis(result) {
    const audioData = result.audioData;

    // Compute RMS (root mean square) for volume estimation
    let sumSquares = 0;
    let peak = 0;
    let peakIndex = 0;

    for (let i = 0; i < audioData.length; i++) {
        const sample = Math.abs(audioData[i]);
        sumSquares += audioData[i] * audioData[i];

        if (sample > peak) {
            peak = sample;
            peakIndex = i;
        }
    }

    const rms = Math.sqrt(sumSquares / audioData.length);
    const peakTimeMs = (peakIndex / result.sampleRate) * 1000;

    // Compute energy over time (windowed)
    const windowSize = Math.floor(result.sampleRate * 0.01); // 10ms windows
    const energyProfile = new Float32Array(Math.ceil(audioData.length / windowSize));

    for (let w = 0; w < energyProfile.length; w++) {
        let windowSum = 0;
        const start = w * windowSize;
        const end = Math.min(start + windowSize, audioData.length);

        for (let i = start; i < end; i++) {
            windowSum += audioData[i] * audioData[i];
        }

        energyProfile[w] = Math.sqrt(windowSum / (end - start));
    }

    return {
        rms: rms,
        peak: peak,
        peakIndex: peakIndex,
        peakTimeMs: peakTimeMs,
        sampleCount: audioData.length,
        durationMs: (audioData.length / result.sampleRate) * 1000,
        energyProfile: energyProfile
    };
}