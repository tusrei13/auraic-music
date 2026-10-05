/**
 * Auraic Sound Engine - Unified Type Definitions
 * Normalized data models for the Sound Engine abstraction layer.
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
  handle?: string;
  avatarUrl?: string;
  bio?: string | null;
  location?: string | null;
  profile_picture?: EngineArtwork | null;
  cover_photo?: EngineCoverPhoto | null;
  is_verified?: boolean;
  follower_count?: number;
  followee_count?: number;
  track_count?: number;
  playlist_count?: number;
  album_count?: number;
}

export interface EngineTrack {
  id: string;
  title: string;
  artistName: string;
  artworkUrl: string;
  streamUrl: string;
  duration: number; // in seconds
  genre: string;
  license?: string | null;
  albumName?: string;
  albumId?: string;
  releaseDate?: string | null;
  bpm?: number | null;
  tags?: string | null;
  is_streamable?: boolean;
  play_count?: number;
  favorite_count?: number;
  // UI compatibility aliases
  artist?: string;
  artwork?: EngineArtwork | null;
  user?: EngineArtist;
  streamSource?: "engine";
}

export interface EnginePlaylist {
  id: string;
  name?: string;
  playlist_name?: string;
  title?: string;
  description?: string | null;
  artworkUrl?: string;
  artwork?: EngineArtwork | null;
  user?: EngineArtist;
  track_count: number;
  tracks?: EngineTrack[];
  is_album?: boolean;
  total_play_count?: number;
  favorite_count?: number;
}

export interface EngineAlbum extends EnginePlaylist {
  is_album: true;
  artistId?: string;
  artistName?: string;
  releaseYear?: number;
  total_duration?: number;
}
