import Innertube, { ClientType } from "youtubei.js";

class GlobalSoundEngine {
  private static instance: Innertube | null = null;
  private static initPromise: Promise<Innertube> | null = null;

  static async getInstance(): Promise<Innertube> {
    if (!GlobalSoundEngine.instance) {
      if (!GlobalSoundEngine.initPromise) {
        GlobalSoundEngine.initPromise = Innertube.create({
          client_type: ClientType.MUSIC,
          lang: "en",
          enable_session_cache: true,
        }).then((engine) => {
          GlobalSoundEngine.instance = engine;
          return engine;
        }).catch((error) => {
          GlobalSoundEngine.initPromise = null;
          throw error;
        });
      }
      await GlobalSoundEngine.initPromise;
    }
    return GlobalSoundEngine.instance as Innertube;
  }
}

export async function getSoundEngine(): Promise<Innertube> {
  return GlobalSoundEngine.getInstance();
}

export default GlobalSoundEngine;
