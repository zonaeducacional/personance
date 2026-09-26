// Generates rich, relaxing procedural chillwave / ambient / lofi tracks as standard WAV audio blobs
// Runs entirely offline in browser with OfflineAudioContext. No external network requests needed!

export async function generateDemoTrackBlob(style: 'synthwave' | 'lofi' | 'ambient' | 'cyber'): Promise<Blob> {
  const sampleRate = 44100;
  const duration = 24; // 24 seconds looped demo
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const now = 0;
  const bpm = style === 'lofi' ? 82 : style === 'synthwave' ? 105 : style === 'cyber' ? 116 : 65;
  const beatInterval = 60 / bpm;

  // Master Gain & Reverb simulator
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.7, now);
  masterGain.connect(offlineCtx.destination);

  // Bass chords progression (e.g. Dm - Bb - F - C)
  const chordRoots = style === 'lofi' 
    ? [146.83, 116.54, 130.81, 164.81] // D3, Bb2, C3, E3
    : style === 'synthwave'
    ? [110.00, 130.81, 146.83, 98.00] // A2, C3, D3, G2
    : [130.81, 146.83, 164.81, 174.61];

  // 1. Pad synthesizer
  chordRoots.forEach((rootFreq, chordIndex) => {
    const chordTime = chordIndex * (duration / 4);
    const chordDuration = duration / 4;

    const triad = [rootFreq, rootFreq * 1.25, rootFreq * 1.5, rootFreq * 1.875];
    triad.forEach((freq) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      const filter = offlineCtx.createBiquadFilter();

      osc.type = style === 'synthwave' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(style === 'cyber' ? 900 : 650, chordTime);

      gain.gain.setValueAtTime(0.001, chordTime);
      gain.gain.exponentialRampToValueAtTime(0.08, chordTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + chordDuration - 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(chordTime);
      osc.stop(chordTime + chordDuration);
    });
  });

  // 2. Bassline
  const totalBeats = Math.floor(duration / beatInterval);
  for (let b = 0; b < totalBeats; b++) {
    const time = b * beatInterval;
    const chordIdx = Math.floor((time / duration) * chordRoots.length) % chordRoots.length;
    const root = chordRoots[chordIdx] / 2;

    const bassOsc = offlineCtx.createOscillator();
    const bassGain = offlineCtx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(root, time);

    bassGain.gain.setValueAtTime(0.22, time);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + beatInterval * 0.9);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(time);
    bassOsc.stop(time + beatInterval);
  }

  // 3. Kick & Snare Drums
  for (let b = 0; b < totalBeats; b++) {
    const time = b * beatInterval;

    // Kick on beat 0 and 2
    if (b % 4 === 0 || b % 4 === 2) {
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.frequency.setValueAtTime(130, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.15);

      kickGain.gain.setValueAtTime(0.4, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(time);
      kickOsc.stop(time + 0.22);
    }

    // Snare / Rimshot on beat 1 and 3
    if (b % 4 === 1 || b % 4 === 3) {
      const snareNoise = offlineCtx.createBufferSource();
      const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.15, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      snareNoise.buffer = noiseBuffer;

      const snareFilter = offlineCtx.createBiquadFilter();
      snareFilter.type = 'highpass';
      snareFilter.frequency.setValueAtTime(1000, time);

      const snareGain = offlineCtx.createGain();
      snareGain.gain.setValueAtTime(0.18, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      snareNoise.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(masterGain);
      snareNoise.start(time);
      snareNoise.stop(time + 0.15);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

// Convert Web Audio AudioBuffer to PCM 16-bit stereo WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(wavBuffer);

  // Write RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');

  // Write fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // Write data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Interleave channel samples
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
