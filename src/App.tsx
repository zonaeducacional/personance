/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAllTracks,
  getAllPlaylists,
  seedInitialDataIfEmpty,
  toggleFavorite as dbToggleFavorite,
  incrementPlayCount,
  getSettings,
  saveSettings,
} from './services/db';
import { audioEngine } from './services/audioEngine';
import { Track, Playlist, ViewTab, VisualizerMode, EqualizerSettings, RepeatMode } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { TracksView } from './components/TracksView';
import { PlaylistsView } from './components/PlaylistsView';
import { PlaylistDetailView } from './components/PlaylistDetailView';
import { FavoritesView } from './components/FavoritesView';
import { AdminStudio } from './components/AdminStudio';
import { BottomPlayer } from './components/BottomPlayer';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { AudioFXModal } from './components/AudioFXModal';
import { QueueDrawer } from './components/QueueDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');

  // Modals & Drawers
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);
  const [isFXModalOpen, setIsFXModalOpen] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // FX & Visualizer
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>({
    bass: 2,
    mid: 0,
    treble: 2,
    bassBoost: false,
    stereoExpander: false,
    playbackRate: 1.0,
  });

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Object URL tracking for cleanup
  const currentObjectUrlRef = useRef<string | null>(null);

  // Refresh DB data
  const loadData = useCallback(async () => {
    try {
      let loadedTracks = await getAllTracks();
      if (loadedTracks.length === 0) {
        loadedTracks = await seedInitialDataIfEmpty();
      }
      const loadedPlaylists = await getAllPlaylists();

      setTracks(loadedTracks);
      setPlaylists(loadedPlaylists);

      // Load saved settings
      const savedEq = await getSettings<EqualizerSettings | null>('eq_settings', null);
      if (savedEq) setEqSettings(savedEq);
      const savedVis = await getSettings<VisualizerMode | null>('visualizer_mode', null);
      if (savedVis) setVisualizerMode(savedVis);
    } catch (err) {
      console.error('Falha ao inicializar biblioteca de áudio:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Audio element events setup
  useEffect(() => {
    const audio = audioEngine.getAudioElement();

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue, queueIndex, repeatMode, isShuffle]);

  // Play a specific track
  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[]) => {
      const audio = audioEngine.getAudioElement();

      // Revoke previous blob URL if needed
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }

      let src = '';
      if (track.audioBlob) {
        src = URL.createObjectURL(track.audioBlob);
        currentObjectUrlRef.current = src;
      } else if (track.audioUrl) {
        src = track.audioUrl;
      }

      if (!src) return;

      audio.src = src;
      audio.volume = isMuted ? 0 : volume;

      // Update queue
      if (newQueue) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((t) => t.id === track.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      } else if (queue.length === 0) {
        setQueue([track]);
        setQueueIndex(0);
      }

      setCurrentTrack(track);

      try {
        audioEngine.initWebAudio();
        audioEngine.applyEqualizer(eqSettings);
        await audio.play();
        setIsPlaying(true);

        // Track stats
        await incrementPlayCount(track.id);
      } catch (err) {
        console.warn('Playback gesture required or interrupted:', err);
      }
    },
    [volume, isMuted, eqSettings, queue]
  );

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const audio = audioEngine.getAudioElement();
    if (!currentTrack && tracks.length > 0) {
      playTrack(tracks[0], tracks);
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audioEngine.resumeContext();
      audio.play().catch(console.warn);
    }
  }, [currentTrack, tracks, isPlaying, playTrack]);

  // Next Track
  const handleNext = useCallback(() => {
    if (repeatMode === 'one' && currentTrack) {
      const audio = audioEngine.getAudioElement();
      audio.currentTime = 0;
      audio.play().catch(console.warn);
      return;
    }

    if (queue.length === 0) return;

    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const nextTrack = queue[nextIdx];
    if (nextTrack) {
      setQueueIndex(nextIdx);
      playTrack(nextTrack);
    }
  }, [repeatMode, currentTrack, queue, queueIndex, isShuffle, playTrack]);

  // Previous Track
  const handlePrev = useCallback(() => {
    const audio = audioEngine.getAudioElement();
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }

    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      setQueueIndex(prevIdx);
      playTrack(prevTrack);
    }
  }, [queue, queueIndex, playTrack]);

  // Seek
  const handleSeek = useCallback((newTime: number) => {
    const audio = audioEngine.getAudioElement();
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // Seek Relative (arrow keys: ArrowLeft/ArrowRight, or media keys seek backward/forward)
  const handleSeekRelative = useCallback(
    (offsetSeconds: number) => {
      const audio = audioEngine.getAudioElement();
      const maxDur = duration || audio.duration || 0;
      const current = audio.currentTime;
      const target = Math.max(0, Math.min(maxDur, current + offsetSeconds));
      audio.currentTime = target;
      setCurrentTime(target);
    },
    [duration]
  );

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    const audio = audioEngine.getAudioElement();
    audio.volume = isMuted ? 0 : newVol;
  };

  // Volume relative change (ArrowUp / ArrowDown)
  const handleVolumeChangeRelative = useCallback(
    (delta: number) => {
      setVolume((prev) => {
        const nextVol = Math.max(0, Math.min(1, Math.round((prev + delta) * 100) / 100));
        const audio = audioEngine.getAudioElement();
        audio.volume = isMuted ? 0 : nextVol;
        return nextVol;
      });
    },
    [isMuted]
  );

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      const audio = audioEngine.getAudioElement();
      audio.volume = newMuted ? 0 : volume;
      return newMuted;
    });
  }, [volume]);

  // Global Keyboard Shortcut listener
  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onPrev: handlePrev,
    onNext: handleNext,
    onSeekRelative: handleSeekRelative,
    onVolumeChangeRelative: handleVolumeChangeRelative,
    onToggleMute: handleToggleMute,
    isEnabled: true,
  });

  // MediaSession API Synchronization
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: currentTrack.coverUrl
          ? [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/png' }]
          : [],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    const setAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        // Safe fallback for actions not supported in all browsers
      }
    };

    setAction('play', () => {
      const audio = audioEngine.getAudioElement();
      audioEngine.resumeContext();
      audio.play().catch(console.warn);
      setIsPlaying(true);
    });

    setAction('pause', () => {
      const audio = audioEngine.getAudioElement();
      audio.pause();
      setIsPlaying(false);
    });

    setAction('previoustrack', () => {
      handlePrev();
    });

    setAction('nexttrack', () => {
      handleNext();
    });

    setAction('seekbackward', (details) => {
      const offset = details.seekOffset || 5;
      handleSeekRelative(-offset);
    });

    setAction('seekforward', (details) => {
      const offset = details.seekOffset || 5;
      handleSeekRelative(offset);
    });

    setAction('seekto', (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        handleSeek(details.seekTime);
      }
    });

    setAction('stop', () => {
      const audio = audioEngine.getAudioElement();
      audio.pause();
      setIsPlaying(false);
    });
  }, [currentTrack, isPlaying, handlePrev, handleNext, handleSeekRelative, handleSeek]);

  // Sync MediaSession position state for OS lockscreens / media hubs
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    if (duration > 0 && isFinite(duration) && isFinite(currentTime)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: eqSettings.playbackRate || 1.0,
          position: Math.min(Math.max(0, currentTime), duration),
        });
      } catch (e) {
        // Ignore position sync errors
      }
    }
  }, [currentTime, duration, eqSettings.playbackRate]);

  // Toggle Shuffle
  const handleToggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  // Cycle Repeat Mode (off -> all -> one -> off)
  const handleCycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  // Toggle Favorite
  const handleToggleFavorite = async (trackId: string) => {
    const isFav = await dbToggleFavorite(trackId);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: isFav } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: isFav } : null));
    }
  };

  // Play all tracks from a playlist or list
  const handlePlayAll = (targetTracks: Track[], shuffle = false) => {
    if (targetTracks.length === 0) return;
    const playListQueue = shuffle ? [...targetTracks].sort(() => Math.random() - 0.5) : targetTracks;
    playTrack(playListQueue[0], playListQueue);
  };

  // Sleep Timer logic
  const handleSetSleepTimer = (minutes: number | null) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    setSleepTimerMinutes(minutes);

    if (minutes !== null && minutes > 0) {
      sleepTimerRef.current = setTimeout(() => {
        const audio = audioEngine.getAudioElement();
        audio.pause();
        setIsPlaying(false);
        setSleepTimerMinutes(null);
      }, minutes * 60 * 1000);
    }
  };

  // Update Equalizer Settings
  const handleUpdateEq = (newSettings: EqualizerSettings) => {
    setEqSettings(newSettings);
    audioEngine.applyEqualizer(newSettings);
    saveSettings('eq_settings', newSettings);
  };

  // Update Visualizer Mode
  const handleUpdateVisualizer = (newMode: VisualizerMode) => {
    setVisualizerMode(newMode);
    saveSettings('visualizer_mode', newMode);
  };

  // Open Playlist detail
  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setCurrentTab('playlist-detail');
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const favoritesCount = tracks.filter((t) => t.isFavorite).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07080e] text-slate-100 antialiased font-sans select-none">
      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={handleSelectPlaylist}
          onOpenNewPlaylist={() => {
            setCurrentTab('admin');
            setIsMobileMenuOpen(false);
          }}
          onOpenFX={() => setIsFXModalOpen(true)}
          favoritesCount={favoritesCount}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 bg-[#090b14] h-full shadow-2xl flex flex-col">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setIsMobileMenuOpen(false);
              }}
              playlists={playlists}
              selectedPlaylistId={selectedPlaylistId}
              onSelectPlaylist={(id) => {
                handleSelectPlaylist(id);
                setIsMobileMenuOpen(false);
              }}
              onOpenNewPlaylist={() => {
                setCurrentTab('admin');
                setIsMobileMenuOpen(false);
              }}
              onOpenFX={() => {
                setIsFXModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              favoritesCount={favoritesCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-gradient-to-b from-[#090b14] via-[#07080e] to-[#05060a]">
        {/* Top Header */}
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenFX={() => setIsFXModalOpen(true)}
          onOpenKeyboardHelp={() => setIsKeyboardHelpOpen(true)}
          onNavigateToAdmin={() => setCurrentTab('admin')}
          currentTab={currentTab}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {currentTab === 'home' && (
            <HomeView
              tracks={tracks}
              playlists={playlists}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              onTogglePlay={togglePlay}
              onSelectPlaylist={handleSelectPlaylist}
              onNavigateToAdmin={() => setCurrentTab('admin')}
              onToggleFavorite={handleToggleFavorite}
              visualizerMode={visualizerMode}
            />
          )}

          {currentTab === 'tracks' && (
            <TracksView
              tracks={tracks}
              playlists={playlists}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              onToggleFavorite={handleToggleFavorite}
              onRefreshData={loadData}
              onNavigateToUpload={() => setCurrentTab('admin')}
            />
          )}

          {currentTab === 'playlists' && (
            <PlaylistsView
              playlists={playlists}
              tracks={tracks}
              onSelectPlaylist={handleSelectPlaylist}
              onOpenNewPlaylist={() => setCurrentTab('admin')}
              onPlayPlaylist={(pl) => {
                const plTracks = pl.trackIds
                  .map((id) => tracks.find((t) => t.id === id))
                  .filter((t): t is Track => t !== undefined);
                handlePlayAll(plTracks, false);
              }}
            />
          )}

          {currentTab === 'playlist-detail' && selectedPlaylist && (
            <PlaylistDetailView
              playlist={selectedPlaylist}
              allTracks={tracks}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              onPlayAll={handlePlayAll}
              onBack={() => setCurrentTab('playlists')}
              onToggleFavorite={handleToggleFavorite}
              onRefreshData={loadData}
              onNavigateToUpload={() => setCurrentTab('admin')}
            />
          )}

          {currentTab === 'favorites' && (
            <FavoritesView
              tracks={tracks}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              onPlayAll={handlePlayAll}
              onToggleFavorite={handleToggleFavorite}
              onNavigateToUpload={() => setCurrentTab('admin')}
            />
          )}

          {currentTab === 'admin' && (
            <AdminStudio
              tracks={tracks}
              playlists={playlists}
              onRefreshData={loadData}
              onPlayTrack={(track) => playTrack(track, tracks)}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
            />
          )}
        </main>

        {/* Docked Bottom Mini Player */}
        <BottomPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={togglePlay}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isShuffle={isShuffle}
          onToggleShuffle={handleToggleShuffle}
          repeatMode={repeatMode}
          onCycleRepeat={handleCycleRepeat}
          onToggleFavorite={handleToggleFavorite}
          onOpenFullscreen={() => setIsFullscreenPlayerOpen(true)}
          onOpenFX={() => setIsFXModalOpen(true)}
          onOpenQueue={() => setIsQueueOpen(true)}
          visualizerMode={visualizerMode}
        />
      </div>

      {/* Fullscreen Player Modal */}
      <FullscreenPlayer
        isOpen={isFullscreenPlayerOpen}
        onClose={() => setIsFullscreenPlayerOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isShuffle={isShuffle}
        onToggleShuffle={handleToggleShuffle}
        repeatMode={repeatMode}
        onCycleRepeat={handleCycleRepeat}
        onToggleFavorite={handleToggleFavorite}
        visualizerMode={visualizerMode}
        onOpenFX={() => setIsFXModalOpen(true)}
      />

      {/* Audio FX & Equalizer Modal */}
      <AudioFXModal
        isOpen={isFXModalOpen}
        onClose={() => setIsFXModalOpen(false)}
        settings={eqSettings}
        onUpdateSettings={handleUpdateEq}
        visualizerMode={visualizerMode}
        onUpdateVisualizerMode={handleUpdateVisualizer}
        sleepTimerMinutes={sleepTimerMinutes}
        onSetSleepTimer={handleSetSleepTimer}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardHelpOpen}
        onClose={() => setIsKeyboardHelpOpen(false)}
      />

      {/* Playback Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentTrackId={currentTrack?.id}
        onPlayTrack={playTrack}
        onRemoveFromQueue={(idx) => {
          setQueue((prev) => prev.filter((_, i) => i !== idx));
        }}
        onClearQueue={() => {
          setQueue(currentTrack ? [currentTrack] : []);
          setQueueIndex(0);
        }}
      />
    </div>
  );
}
