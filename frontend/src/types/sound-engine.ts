/**
 * Auraic Sound Engine - Unified Type Definitions
 * Abstract data models for Decentralized Open Audio Stream Engine
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
  repost_count?: number;
}

export interface EngineRemixParentItem {
  parent_track_id: string;
  has_remix_author_reposted?: boolean;
  has_remix_author_saved?: boolean;
  user?: EngineArtist;
}

export interface EngineRemixParent {
  tracks: EngineRemixParentItem[];
}

export interface EngineStemInfo {
  parent_track_id: string;
  category: "drums" | "bass" | "vocals" | "lead" | "synth" | "other" | string;
}

export interface EngineTrack {
  id: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  mood?: string | null;
  duration: number; // in seconds
  play_count?: number;
  favorite_count?: number;
  repost_count?: number;
  artwork?: EngineArtwork | null;
  user: EngineArtist;
  remix_of?: EngineRemixParent | null;
  stem_of?: EngineStemInfo | null;
  bpm?: number | null;
  tags?: string | null;
  is_streamable: boolean;
  release_date?: string | null;
  downloadable?: boolean;
  license?: string | null;
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
  repost_count?: number;
  favorite_count?: number;
  tracks?: EngineTrack[];
}

export interface EngineAlbum extends EnginePlaylist {
  is_album: true;
  release_year?: number;
  total_duration?: number;
}

export interface EngineRemixTreeNode {
  id: string;
  title: string;
  artistName: string;
  artworkUrl?: string;
  duration: number;
  isOriginal: boolean;
  relationType: "original" | "remix" | "stem";
  stemCategory?: string;
  plays?: number;
  children: EngineRemixTreeNode[];
}

export interface EngineApiResponse<T> {
  data: T;
  latest_chain_block?: number;
  latest_indexed_block?: number;
  signature?: string;
  timestamp?: string;
}
