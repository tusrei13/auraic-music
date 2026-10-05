import { NextRequest, NextResponse } from "next/server";
import { SoundEngineServer } from "@/lib/sound-engine/server-engine";
import type { EngineAlbum, EngineArtist, EngineTrack } from "@/types/sound-engine";

export const dynamic = "force-dynamic";

export interface SearchResults {
  topResult?: {
    id: string;
    title: string;
    artist: string;
    type: "song" | "artist" | "album";
    thumbnail: string;
  };
  songs: EngineTrack[];
  artists: EngineArtist[];
  albums: EngineAlbum[];
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 50);

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  try {
    const { songs, artists, albums } = await SoundEngineServer.search(query, limit);

    const topResult: SearchResults["topResult"] = songs[0]
      ? {
          id: songs[0].id,
          title: songs[0].title,
          artist: songs[0].artistName,
          type: "song",
          thumbnail: songs[0].artworkUrl || "",
        }
      : artists[0]
      ? {
          id: artists[0].id,
          title: artists[0].name,
          artist: artists[0].name,
          type: "artist",
          thumbnail: artists[0].avatarUrl || "",
        }
      : albums[0]
      ? {
          id: albums[0].id,
          title: albums[0].title || albums[0].name || "",
          artist: albums[0].artistName || "Unknown Artist",
          type: "album",
          thumbnail: albums[0].artworkUrl || "",
        }
      : undefined;

    return NextResponse.json(
      { topResult, songs, artists, albums },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("[SoundEngine Search] Search failed:", err);
    return NextResponse.json({ error: "Search failed", songs: [], artists: [], albums: [] }, { status: 502 });
  }
}
