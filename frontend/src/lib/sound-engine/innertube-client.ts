import Innertube from "youtubei.js";

interface MediaFormat {
  url: string;
  mimeType: string;
  bitrate?: number;
  approxDurationMs?: number;
}

class GlobalMediaEngine {
  private static instance: GlobalMediaEngine | null = null;
  private innertube: InstanceType<typeof Innertube> | null = null;
  private initPromise: Promise<void> | null = null;

  static getInstance(): Promise<GlobalMediaEngine> {
    if (!GlobalMediaEngine.instance) {
      GlobalMediaEngine.instance = new GlobalMediaEngine();
    }
    return GlobalMediaEngine.instance.ensureInitialized();
  }

  private constructor() {}

  private async ensureInitialized(): Promise<GlobalMediaEngine> {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    await this.initPromise;
    return this;
  }

  private async init(): Promise<void> {
    try {
      this.innertube = await Innertube.create({});
    } catch (err) {
      console.error("[GlobalMediaEngine] Failed to initialize InnerTube session:", err);
      throw err;
    }
  }

  async getAudioStreamUrl(videoId: string): Promise<MediaFormat> {
    const engine = await GlobalMediaEngine.getInstance();
    const innertube = engine.innertube;
    if (!innertube) throw new Error("InnerTube session not initialized");

    const format = await innertube.getStreamingData(videoId, { type: "audio" });
    const url = await format.decipher(innertube.session.player);

    return {
      url,
      mimeType: format.mime_type || "audio/mp4",
      bitrate: format.bitrate,
      approxDurationMs: format.approx_duration_ms,
    };
  }

  async search(query: string, filterType?: string): Promise<unknown> {
    const engine = await GlobalMediaEngine.getInstance();
    const innertube = engine.innertube;
    if (!innertube) throw new Error("InnerTube session not initialized");

    const music = innertube.music;
    const filters = filterType ? { type: filterType as any } : undefined;
    const result = await music.search(query, filters);
    return (result as any).toJSON?.() ?? result;
  }

  async getArtist(artistId: string): Promise<unknown> {
    const engine = await GlobalMediaEngine.getInstance();
    const innertube = engine.innertube;
    if (!innertube) throw new Error("InnerTube session not initialized");
    const artist = await innertube.music.getArtist(artistId);
    return (artist as any).toJSON?.() ?? artist;
  }

  async getAlbum(albumId: string): Promise<unknown> {
    const engine = await GlobalMediaEngine.getInstance();
    const innertube = engine.innertube;
    if (!innertube) throw new Error("InnerTube session not initialized");
    const album = await innertube.music.getAlbum(albumId);
    return (album as any).toJSON?.() ?? album;
  }

  async getTrackInfo(videoId: string): Promise<unknown> {
    const engine = await GlobalMediaEngine.getInstance();
    const innertube = engine.innertube;
    if (!innertube) throw new Error("InnerTube session not initialized");
    const info = await innertube.music.getInfo(videoId);
    return (info as any).toJSON?.() ?? info;
  }
}

export default GlobalMediaEngine;
export type { MediaFormat };
