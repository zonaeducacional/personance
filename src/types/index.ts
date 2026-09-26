export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre?: string;
  year?: string | number;
  duration: number; // in seconds
  coverUrl?: string; // Data URL or external URL
  audioBlob?: Blob; // Raw audio file stored in IndexedDB
  audioUrl?: string; // Runtime Object URL created from blob or demo URL
  lyrics?: string; // Plain or synced text
  dateAdded: number; // Timestamp
  playCount: number;
  isFavorite: boolean;
  isDemo?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  dateCreated: number;
  dateUpdated: number;
  accentColor?: string;
}

export type VisualizerMode = 'bars' | 'wave' | 'radial' | 'aura' | 'off';

export interface EqualizerSettings {
  bass: number; // -12dB to +12dB
  mid: number; // -12dB to +12dB
  treble: number; // -12dB to +12dB
  bassBoost: boolean;
  stereoExpander: boolean;
  playbackRate: number; // 0.5 to 2.0
}

export type ViewTab = 'home' | 'tracks' | 'playlists' | 'playlist-detail' | 'favorites' | 'admin' | 'fx';

export type RepeatMode = 'off' | 'all' | 'one';
