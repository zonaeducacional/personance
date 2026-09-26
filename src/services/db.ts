import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track, Playlist, EqualizerSettings } from '../types';
import { generateDemoTrackBlob } from './audioGenerator';

interface ResonanceDB extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: { 'by-date': number; 'by-favorite': number };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: { 'by-date': number };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'resonance_music_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ResonanceDB>> | null = null;
let useMemoryFallback = false;
const memoryTracks = new Map<string, Track>();
const memoryPlaylists = new Map<string, Playlist>();
const memorySettings = new Map<string, any>();

export async function getDB(): Promise<IDBPDatabase<ResonanceDB> | null> {
  if (useMemoryFallback) return null;
  if (!dbPromise) {
    if (typeof window === 'undefined' || !window.indexedDB) {
      useMemoryFallback = true;
      return null;
    }
    dbPromise = openDB<ResonanceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('by-date', 'dateAdded');
          trackStore.createIndex('by-favorite', 'isFavorite');
        }
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('by-date', 'dateCreated');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    }).catch((err) => {
      console.warn('IndexedDB inacessível, utilizando modo de memória resiliente:', err);
      useMemoryFallback = true;
      return null as unknown as IDBPDatabase<ResonanceDB>;
    });
  }
  try {
    const db = await dbPromise;
    return db || null;
  } catch (err) {
    console.warn('Erro ao obter conexão com IndexedDB:', err);
    useMemoryFallback = true;
    return null;
  }
}

// Track operations
export async function getAllTracks(): Promise<Track[]> {
  try {
    const db = await getDB();
    if (db) {
      const tracks = await db.getAll('tracks');
      return tracks.sort((a, b) => b.dateAdded - a.dateAdded);
    }
  } catch (err) {
    console.warn('Erro ao ler faixas do IndexedDB, usando memória:', err);
    useMemoryFallback = true;
  }
  return Array.from(memoryTracks.values()).sort((a, b) => b.dateAdded - a.dateAdded);
}

export async function getTrack(id: string): Promise<Track | undefined> {
  try {
    const db = await getDB();
    if (db) {
      return await db.get('tracks', id);
    }
  } catch (err) {
    console.warn('Erro ao buscar faixa:', err);
  }
  return memoryTracks.get(id);
}

export async function saveTrack(track: Track): Promise<void> {
  memoryTracks.set(track.id, track);
  try {
    const db = await getDB();
    if (db) {
      await db.put('tracks', track);
    }
  } catch (err) {
    console.warn('Erro ao salvar faixa no IndexedDB:', err);
  }
}

export async function deleteTrack(id: string): Promise<void> {
  memoryTracks.delete(id);
  try {
    const db = await getDB();
    if (db) {
      await db.delete('tracks', id);
    }
  } catch (err) {
    console.warn('Erro ao deletar faixa do IndexedDB:', err);
  }

  // Also remove from any playlists that contain it
  const playlists = await getAllPlaylists();
  for (const pl of playlists) {
    if (pl.trackIds.includes(id)) {
      pl.trackIds = pl.trackIds.filter((tId) => tId !== id);
      await savePlaylist(pl);
    }
  }
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const track = await getTrack(id);
  if (track) {
    track.isFavorite = !track.isFavorite;
    await saveTrack(track);
    return track.isFavorite;
  }
  return false;
}

export async function incrementPlayCount(id: string): Promise<void> {
  const track = await getTrack(id);
  if (track) {
    track.playCount = (track.playCount || 0) + 1;
    await saveTrack(track);
  }
}

// Playlist operations
export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    const db = await getDB();
    if (db) {
      const playlists = await db.getAll('playlists');
      return playlists.sort((a, b) => b.dateCreated - a.dateCreated);
    }
  } catch (err) {
    console.warn('Erro ao carregar playlists do IndexedDB:', err);
  }
  return Array.from(memoryPlaylists.values()).sort((a, b) => b.dateCreated - a.dateCreated);
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  try {
    const db = await getDB();
    if (db) {
      return await db.get('playlists', id);
    }
  } catch (err) {
    console.warn('Erro ao buscar playlist:', err);
  }
  return memoryPlaylists.get(id);
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  memoryPlaylists.set(playlist.id, playlist);
  try {
    const db = await getDB();
    if (db) {
      await db.put('playlists', playlist);
    }
  } catch (err) {
    console.warn('Erro ao salvar playlist no IndexedDB:', err);
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  memoryPlaylists.delete(id);
  try {
    const db = await getDB();
    if (db) {
      await db.delete('playlists', id);
    }
  } catch (err) {
    console.warn('Erro ao deletar playlist do IndexedDB:', err);
  }
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const playlist = await getPlaylist(playlistId);
  if (playlist && !playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
    playlist.dateUpdated = Date.now();
    await savePlaylist(playlist);
  }
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const playlist = await getPlaylist(playlistId);
  if (playlist) {
    playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
    playlist.dateUpdated = Date.now();
    await savePlaylist(playlist);
  }
}

// Settings operations
export async function getSettings<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    if (db) {
      const val = await db.get('settings', key);
      return val !== undefined ? val : defaultValue;
    }
  } catch (err) {
    console.warn('Erro ao buscar configuração:', err);
  }
  return memorySettings.has(key) ? memorySettings.get(key) : defaultValue;
}

export async function saveSettings<T>(key: string, value: T): Promise<void> {
  memorySettings.set(key, value);
  try {
    const db = await getDB();
    if (db) {
      await db.put('settings', value, key);
    }
  } catch (err) {
    console.warn('Erro ao salvar configuração:', err);
  }
}

// Curated demo cover arts (high aesthetic SVG data URIs)
function createAestheticCover(title: string, subtitle: string, color1: string, color2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
      <radialGradient id="r" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
      </radialGradient>
    </defs>
    <rect width="500" height="500" fill="url(#g)"/>
    <rect width="500" height="500" fill="url(#r)"/>
    <!-- Vinyl grooves -->
    <circle cx="250" cy="250" r="220" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
    <circle cx="250" cy="250" r="180" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-dasharray="8 12"/>
    <circle cx="250" cy="250" r="130" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <circle cx="250" cy="250" r="70" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <circle cx="250" cy="250" r="30" fill="rgba(10,12,20,0.85)"/>
    <circle cx="250" cy="250" r="8" fill="#ffffff"/>
    <!-- Typography -->
    <text x="40" y="420" font-family="system-ui, sans-serif" font-weight="800" font-size="28" fill="#ffffff" letter-spacing="1">${title}</text>
    <text x="40" y="450" font-family="system-ui, sans-serif" font-weight="500" font-size="16" fill="rgba(255,255,255,0.75)" letter-spacing="0.5">${subtitle}</text>
    <text x="440" y="70" text-anchor="end" font-family="monospace" font-size="13" fill="rgba(255,255,255,0.6)">MASTERIZAÇÃO RESONANCE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Initial seed & Portuguese localization migration
export async function seedInitialDataIfEmpty(): Promise<Track[]> {
  const existingTracks = await getAllTracks();
  if (existingTracks.length > 0) {
    // Migrate any demo/existing tracks to Portuguese if previously saved in English
    let updated = false;
    for (const t of existingTracks) {
      if (t.id === 'track-demo-1' || t.title === 'Neon Odyssey' || t.title.toLowerCase().includes('neon odyssey')) {
        t.title = 'Odisseia Neon';
        t.artist = 'Estúdio Resonance';
        t.album = 'Protocolo Aura';
        t.genre = 'Synthwave / Eletrônica';
        t.coverUrl = createAestheticCover('ODISSEIA NEON', 'ESTÚDIO RESONANCE', '#0f2027', '#203a43');
        await saveTrack(t);
        updated = true;
      } else if (t.id === 'track-demo-2' || t.title === 'Velvet Midnight' || t.title.toLowerCase().includes('velvet midnight')) {
        t.title = 'Meia-Noite de Veludo';
        t.artist = 'Unidade Fita Cassete';
        t.album = 'Sonhos Analógicos Vol. 1';
        t.genre = 'Lo-Fi Relaxante';
        t.coverUrl = createAestheticCover('MEIA-NOITE DE VELUDO', 'UNIDADE CASSETE', '#2c3e50', '#fd746c');
        await saveTrack(t);
        updated = true;
      } else if (
        t.id === 'track-demo-3' ||
        t.title === 'Cyberpulse Drift' ||
        t.title.toLowerCase().includes('cyberpulse') ||
        t.artist === 'Vector Subsystem' ||
        t.album === 'Glitch Horizons' ||
        t.album.toLowerCase().includes('glitch horizons')
      ) {
        t.title = 'Deriva Ciberpulso';
        t.artist = 'Subsistema Vetorial';
        t.album = 'Horizontes Glitch';
        t.genre = 'Ambiente Cibernético';
        t.coverUrl = createAestheticCover('DERIVA CIBERPULSO', 'SUBSISTEMA VETORIAL', '#1a2a6c', '#b21f1f');
        await saveTrack(t);
        updated = true;
      } else {
        // General text check for translation
        let changed = false;
        if (t.artist === 'Vector Subsystem') {
          t.artist = 'Subsistema Vetorial';
          changed = true;
        }
        if (t.album === 'Glitch Horizons') {
          t.album = 'Horizontes Glitch';
          changed = true;
        }
        if (t.artist === 'Resonance Studio') {
          t.artist = 'Estúdio Resonance';
          changed = true;
        }
        if (t.album === 'Aura Protocol') {
          t.album = 'Protocolo Aura';
          changed = true;
        }
        if (t.artist === 'Tape Deck Unit') {
          t.artist = 'Unidade Fita Cassete';
          changed = true;
        }
        if (t.album === 'Analog Dreams Vol. 1') {
          t.album = 'Sonhos Analógicos Vol. 1';
          changed = true;
        }
        if (changed) {
          await saveTrack(t);
          updated = true;
        }
      }
    }

    // Migrate starter playlist if saved with English name
    const existingPlaylists = await getAllPlaylists();
    for (const pl of existingPlaylists) {
      if (pl.id === 'pl-starter-1' && (pl.title === 'Nightfall Vibes' || pl.title.includes('Nightfall'))) {
        pl.title = 'Vibrações Noturnas';
        pl.description = 'Seleção inicial para testar o player, equalizador e os visualizadores de áudio.';
        await savePlaylist(pl);
      }
    }

    return updated ? await getAllTracks() : existingTracks;
  }

  try {
    // Generate 3 royalty-free procedural starter tracks
    const [blob1, blob2, blob3] = await Promise.all([
      generateDemoTrackBlob('synthwave'),
      generateDemoTrackBlob('lofi'),
      generateDemoTrackBlob('cyber'),
    ]);

    const demoTracks: Track[] = [
      {
        id: 'track-demo-1',
        title: 'Odisseia Neon',
        artist: 'Estúdio Resonance',
        album: 'Protocolo Aura',
        genre: 'Synthwave / Eletrônica',
        year: 2026,
        duration: 24,
        audioBlob: blob1,
        coverUrl: createAestheticCover('ODISSEIA NEON', 'ESTÚDIO RESONANCE', '#0f2027', '#203a43'),
        lyrics: `[00:01.00] Luzes de neon refletem no asfalto\n[00:06.00] Ondas sintéticas no ar da noite\n[00:12.00] A velocidade do som nos conduz\n[00:18.00] Sintonia pura sem fim`,
        dateAdded: Date.now() - 3600000 * 2,
        playCount: 14,
        isFavorite: true,
        isDemo: true,
      },
      {
        id: 'track-demo-2',
        title: 'Meia-Noite de Veludo',
        artist: 'Unidade Fita Cassete',
        album: 'Sonhos Analógicos Vol. 1',
        genre: 'Lo-Fi Relaxante',
        year: 2026,
        duration: 24,
        audioBlob: blob2,
        coverUrl: createAestheticCover('MEIA-NOITE DE VELUDO', 'UNIDADE CASSETE', '#2c3e50', '#fd746c'),
        lyrics: `[00:02.00] Café morno e chuva na janela\n[00:08.00] O estalar suave do vinil\n[00:14.00] Uma frequência que acalma a mente`,
        dateAdded: Date.now() - 3600000,
        playCount: 8,
        isFavorite: true,
        isDemo: true,
      },
      {
        id: 'track-demo-3',
        title: 'Deriva Ciberpulso',
        artist: 'Subsistema Vetorial',
        album: 'Horizontes Glitch',
        genre: 'Ambiente Cibernético',
        year: 2026,
        duration: 24,
        audioBlob: blob3,
        coverUrl: createAestheticCover('DERIVA CIBERPULSO', 'SUBSISTEMA VETORIAL', '#1a2a6c', '#b21f1f'),
        lyrics: `[00:01.00] Conexões no hiperespaço\n[00:07.00] Frequências baixas reverberam\n[00:13.00] O ritmo do núcleo pulsa`,
        dateAdded: Date.now(),
        playCount: 5,
        isFavorite: false,
        isDemo: true,
      },
    ];

    for (const t of demoTracks) {
      await saveTrack(t);
    }

    // Create starter playlist
    const starterPlaylist: Playlist = {
      id: 'pl-starter-1',
      title: 'Vibrações Noturnas',
      description: 'Seleção inicial para testar o player, equalizador e os visualizadores de áudio.',
      coverUrl: demoTracks[0].coverUrl,
      trackIds: demoTracks.map((t) => t.id),
      dateCreated: Date.now(),
      dateUpdated: Date.now(),
      accentColor: '#06b6d4',
    };
    await savePlaylist(starterPlaylist);

    return demoTracks;
  } catch (err) {
    console.error('Falha ao gerar faixas de demonstração:', err);
    return [];
  }
}

// Backup & Export JSON
export async function exportLibraryJSON(): Promise<string> {
  const tracks = await getAllTracks();
  const playlists = await getAllPlaylists();

  // Export metadata (blobs are excluded from simple JSON export to keep file light, but titles/playlists/tags stay intact)
  const exportData = {
    appName: 'Resonance — Sistema de Áudio Independente',
    version: '1.0',
    exportDate: new Date().toISOString(),
    playlists,
    tracks: tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      genre: t.genre,
      year: t.year,
      duration: t.duration,
      lyrics: t.lyrics,
      dateAdded: t.dateAdded,
      playCount: t.playCount,
      isFavorite: t.isFavorite,
      coverUrl: t.coverUrl?.startsWith('data:') ? t.coverUrl : undefined,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}
