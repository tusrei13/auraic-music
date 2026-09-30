/**
 * Auraic Sound Engine - Unified Type Definitions
 * Normalized data models returned by YouTube Music integrations.
 */

export interface EngineArtwork {
  "150x150"?: string;
  "480x480"?: string;
  "1000x1000"?: string;
}

export interface EngineCoverPhoto {
  "640x"?: string;
  "2000x"?: string;
}

export interface EngineArtist {
  id: string;
  name: string;
  handle: string;
  bio?: string | null;
  location?: string | null;
  profile_picture?: EngineArtwork | null;
  cover_photo?: EngineCoverPhoto | null;
  is_verified: boolean;
  follower_count?: number;
  followee_count?: number;
  track_count?: number;
  playlist_count?: number;
  album_count?: number;
}

export interface EngineTrack {
  id: string;
  streamSource?: "youtube";
  title: string;
  artist?: string;
  description?: string | null;
  genre?: string | null;
  mood?: string | null;
  duration: number; // in seconds
  play_count?: number;
  favorite_count?: number;
  artwork?: EngineArtwork | null;
  user: EngineArtist;
  bpm?: number | null;
  tags?: string | null;
  is_streamable: boolean;
  release_date?: string | null;
}

export interface EnginePlaylist {
  id: string;
  playlist_name: string;
  description?: string | null;
  is_album: boolean;
  track_count: number;
  artwork?: EngineArtwork | null;
  user: EngineArtist;
  total_play_count?: number;
  favorite_count?: number;
  tracks?: EngineTrack[];
}

export interface EngineAlbum extends EnginePlaylist {
  is_album: true;
  release_year?: number;
  total_duration?: number;
}
