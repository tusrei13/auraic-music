/**
 * Ambient Layering Engine using Web Audio API
 * Generates procedural audio layers: Rain, Vinyl Crackle, and Ocean Waves
 */

export interface AmbientVolumes {
  rain: number;
  vinyl: number;
  waves: number;
  master: number;
}

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private vinylGain: GainNode | null = null;
  private wavesGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private rainSource: AudioNode | null = null;
  private vinylTimer: number | null = null;
  private wavesSource: AudioNode | null = null;
  private wavesLfo: OscillatorNode | null = null;

  private isPlaying: boolean = false;
  private volumes: AmbientVolumes = {
    rain: 0.4,
    vinyl: 0.35,
    waves: 0.3,
    master: 0.7,
  };

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getVolumes(): AmbientVolumes {
    return { ...this.volumes };
  }

  public start() {
    if (typeof window === "undefined") return;
    this.initContext();
    if (!this.ctx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Master chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Setup channels
    this.setupRain();
    this.setupVinyl();
    this.setupWaves();
  }

  private setupRain() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink-ish noise generation for soft ambient rainfall
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Bandpass filter to shape gentle rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(this.volumes.rain, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    whiteNoise.start(0);
    this.rainSource = whiteNoise;
  }

  private setupVinyl() {
    if (!this.ctx || !this.masterGain) return;
    // Vinyl surface hiss
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.015;
    }

    const hissSource = this.ctx.createBufferSource();
    hissSource.buffer = noiseBuffer;
    hissSource.loop = true;

    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = "bandpass";
    hissFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);
    hissFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.vinylGain = this.ctx.createGain();
    this.vinylGain.gain.setValueAtTime(this.volumes.vinyl, this.ctx.currentTime);

    hissSource.connect(hissFilter);
    hissFilter.connect(this.vinylGain);
    this.vinylGain.connect(this.masterGain);

    hissSource.start(0);

    // Periodic vinyl clicks & pops generator
    const playCrackle = () => {
      if (!this.ctx || !this.isPlaying || !this.vinylGain) return;
      const crackleGain = this.ctx.createGain();
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(800 + Math.random() * 2400, this.ctx.currentTime);

      const popDuration = 0.003 + Math.random() * 0.008;
      crackleGain.gain.setValueAtTime(0.04 + Math.random() * 0.08, this.ctx.currentTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + popDuration);

      osc.connect(crackleGain);
      crackleGain.connect(this.vinylGain);

      osc.start();
      osc.stop(this.ctx.currentTime + popDuration);

      const nextDelay = 80 + Math.random() * 420;
      this.vinylTimer = window.setTimeout(playCrackle, nextDelay);
    };

    playCrackle();
  }

  private setupWaves() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Deep brown noise for rolling ocean surf
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 2.8;
    }

    const waveNoise = this.ctx.createBufferSource();
    waveNoise.buffer = noiseBuffer;
    waveNoise.loop = true;

    // Filter modulated by LFO to simulate surging waves
    const waveFilter = this.ctx.createBiquadFilter();
    waveFilter.type = "lowpass";
    waveFilter.frequency.setValueAtTime(350, this.ctx.currentTime);

    // LFO for wave breathing rhythm (~0.12 Hz = 8.3s cycle)
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveFilter.frequency);

    this.wavesGain = this.ctx.createGain();
    this.wavesGain.gain.setValueAtTime(this.volumes.waves, this.ctx.currentTime);

    waveNoise.connect(waveFilter);
    waveFilter.connect(this.wavesGain);
    this.wavesGain.connect(this.masterGain);

    waveNoise.start(0);
    lfo.start(0);

    this.wavesSource = waveNoise;
    this.wavesLfo = lfo;
  }

  public setRainVolume(val: number) {
    this.volumes.rain = Math.max(0, Math.min(1, val));
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(this.volumes.rain, this.ctx.currentTime, 0.05);
    }
  }

  public setVinylVolume(val: number) {
    this.volumes.vinyl = Math.max(0, Math.min(1, val));
    if (this.vinylGain && this.ctx) {
      this.vinylGain.gain.setTargetAtTime(this.volumes.vinyl, this.ctx.currentTime, 0.05);
    }
  }

  public setWavesVolume(val: number) {
    this.volumes.waves = Math.max(0, Math.min(1, val));
    if (this.wavesGain && this.ctx) {
      this.wavesGain.gain.setTargetAtTime(this.volumes.waves, this.ctx.currentTime, 0.05);
    }
  }

  public setMasterVolume(val: number) {
    this.volumes.master = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volumes.master, this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.vinylTimer) {
      clearTimeout(this.vinylTimer);
      this.vinylTimer = null;
    }
    try {
      if (this.rainSource && "stop" in this.rainSource) (this.rainSource as AudioScheduledSourceNode).stop();
      if (this.wavesSource && "stop" in this.wavesSource) (this.wavesSource as AudioScheduledSourceNode).stop();
      if (this.wavesLfo) this.wavesLfo.stop();
    } catch {
      // Ignored if already stopped
    }
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
      this.ctx = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const ambientEngine = new AmbientEngine();
