import { EqualizerSettings } from '../types';

class AudioEngine {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassNode: BiquadFilterNode | null = null;
  private midNode: BiquadFilterNode | null = null;
  private trebleNode: BiquadFilterNode | null = null;
  private bassBoostNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isInitialized = false;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    // Allow cross origin when needed
    this.audio.crossOrigin = 'anonymous';
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  // Initialize Web Audio Graph upon first user interaction
  public initWebAudio() {
    if (this.isInitialized) {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();

      // Source from audio element
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);

      // 1. Bass filter (Low Shelf 100Hz)
      this.bassNode = this.audioContext.createBiquadFilter();
      this.bassNode.type = 'lowshelf';
      this.bassNode.frequency.setValueAtTime(100, this.audioContext.currentTime);
      this.bassNode.gain.setValueAtTime(0, this.audioContext.currentTime);

      // 2. Mid filter (Peaking 1200Hz)
      this.midNode = this.audioContext.createBiquadFilter();
      this.midNode.type = 'peaking';
      this.midNode.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      this.midNode.Q.setValueAtTime(1.0, this.audioContext.currentTime);
      this.midNode.gain.setValueAtTime(0, this.audioContext.currentTime);

      // 3. Treble filter (High Shelf 6000Hz)
      this.trebleNode = this.audioContext.createBiquadFilter();
      this.trebleNode.type = 'highshelf';
      this.trebleNode.frequency.setValueAtTime(6000, this.audioContext.currentTime);
      this.trebleNode.gain.setValueAtTime(0, this.audioContext.currentTime);

      // 4. Bass Boost punch filter (Peaking 60Hz)
      this.bassBoostNode = this.audioContext.createBiquadFilter();
      this.bassBoostNode.type = 'peaking';
      this.bassBoostNode.frequency.setValueAtTime(60, this.audioContext.currentTime);
      this.bassBoostNode.Q.setValueAtTime(1.4, this.audioContext.currentTime);
      this.bassBoostNode.gain.setValueAtTime(0, this.audioContext.currentTime);

      // 5. Analyser Node for Visualizers
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // 6. Master Gain
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

      // Connect chain:
      // source -> bass -> mid -> treble -> bassBoost -> analyser -> gain -> destination
      this.sourceNode
        .connect(this.bassNode)
        .connect(this.midNode)
        .connect(this.trebleNode)
        .connect(this.bassBoostNode)
        .connect(this.analyserNode)
        .connect(this.gainNode)
        .connect(this.audioContext.destination);

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio initialization error, continuing with fallback HTMLAudio:', err);
    }
  }

  public applyEqualizer(settings: EqualizerSettings) {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    if (this.bassNode) {
      this.bassNode.gain.setTargetAtTime(settings.bass, now, 0.05);
    }
    if (this.midNode) {
      this.midNode.gain.setTargetAtTime(settings.mid, now, 0.05);
    }
    if (this.trebleNode) {
      this.trebleNode.gain.setTargetAtTime(settings.treble, now, 0.05);
    }
    if (this.bassBoostNode) {
      const boostGain = settings.bassBoost ? 7.5 : 0;
      this.bassBoostNode.gain.setTargetAtTime(boostGain, now, 0.05);
    }

    // Playback rate
    if (this.audio) {
      this.audio.playbackRate = settings.playbackRate || 1.0;
    }
  }

  public getFrequencyData(array: Uint8Array<any>): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(0);
    }
  }

  public getTimeDomainData(array: Uint8Array<any>): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(128);
    }
  }

  public resumeContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioEngine = new AudioEngine();
