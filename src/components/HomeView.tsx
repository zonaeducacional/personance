import React from 'react';
import { Play, Pause, Sparkles, Disc, Heart, UploadCloud, Radio, Flame, Plus } from 'lucide-react';
import { Track, Playlist, VisualizerMode } from '../types';
import { Visualizer } from './Visualizer';

interface HomeViewProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onTogglePlay: () => void;
  onSelectPlaylist: (playlistId: string) => void;
  onNavigateToAdmin: () => void;
  onToggleFavorite: (trackId: string) => void;
  visualizerMode: VisualizerMode;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tracks,
  playlists,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onSelectPlaylist,
  onNavigateToAdmin,
  onToggleFavorite,
  visualizerMode,
}) => {
  const heroTrack = currentTrack || tracks[0];

  return (
    <div className="space-y-8 pb-24 animate-in fade-in">
      {/* Hero Spotlight Section */}
      {heroTrack ? (
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/25 bg-gradient-to-r from-[#101426] via-[#0d1020] to-[#0a0c18] p-6 sm:p-10 shadow-2xl">
          {/* Ambient visualizer backdrop */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <Visualizer
              mode={visualizerMode === 'off' ? 'radial' : visualizerMode}
              isPlaying={isPlaying}
              accentColor="#06b6d4"
              className="w-full h-full"
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            {/* Spinning Vinyl Presentation */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex-shrink-0">
              <div
                className={`w-full h-full rounded-full p-2.5 bg-gradient-to-tr from-slate-900 to-slate-800 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 flex items-center justify-center ${
                  isPlaying && currentTrack?.id === heroTrack.id
                    ? 'animate-spin-slow'
                    : 'animate-spin-slow animate-spin-paused'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner">
                  {heroTrack.coverUrl ? (
                    <img
                      src={heroTrack.coverUrl}
                      alt={heroTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-cyan-400">
                      <Disc className="w-16 h-16" />
                    </div>
                  )}
                  {/* Spindle hole */}
                  <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-[#0a0c18] border border-white/50" />
                </div>
              </div>
            </div>

            {/* Track Info & Actions */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Em Destaque no Resonance</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {heroTrack.title}
              </h2>
              <p className="text-sm sm:text-base text-cyan-300/80 font-medium">
                {heroTrack.artist} • <span className="text-slate-400">{heroTrack.album}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
                <button
                  onClick={() => {
                    if (currentTrack?.id === heroTrack.id) {
                      onTogglePlay();
                    } else {
                      onPlayTrack(heroTrack, tracks);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying && currentTrack?.id === heroTrack.id ? (
                    <>
                      <Pause className="w-4 h-4 fill-black" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-black" />
                      <span>Reproduzir Agora</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onToggleFavorite(heroTrack.id)}
                  className={`p-3 rounded-2xl border transition ${
                    heroTrack.isFavorite
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-500'
                      : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                  title="Favoritar"
                >
                  <Heart className={`w-4 h-4 ${heroTrack.isFavorite ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-[#0f111d] border border-slate-800 text-center space-y-3">
          <UploadCloud className="w-12 h-12 text-cyan-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Sua biblioteca está vazia</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Faça upload de suas músicas em MP3 pelo Estúdio Admin para começar a ouvir suas faixas favoritas sem backend.
          </p>
          <button
            onClick={onNavigateToAdmin}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-xs font-bold text-black hover:bg-cyan-400 transition"
          >
            Abrir Área de Upload
          </button>
        </div>
      )}

      {/* Quick Playlists Hub */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Coleções & Playlists
            </h3>
          </div>
          <button
            onClick={onNavigateToAdmin}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar / Gerenciar</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group cursor-pointer rounded-2xl bg-[#0e101c] border border-slate-800/80 hover:border-cyan-500/40 p-3 transition-all hover:scale-[1.02] shadow-lg"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-2.5">
                {pl.coverUrl ? (
                  <img src={pl.coverUrl} alt={pl.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <Disc className="w-8 h-8" />
                  </div>
                )}
                <div
                  className="absolute top-2 right-2 w-3 h-3 rounded-full"
                  style={{ backgroundColor: pl.accentColor || '#06b6d4' }}
                />
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition">
                {pl.title}
              </h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {pl.trackIds.length} {pl.trackIds.length === 1 ? 'música' : 'músicas'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Added / Discover Tracks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Todas as Faixas Salvas ({tracks.length})
            </h3>
          </div>
          <button
            onClick={onNavigateToAdmin}
            className="text-xs text-cyan-400 hover:underline"
          >
            Fazer Upload de MP3 &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tracks.slice(0, 6).map((track) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track, tracks)}
              className="group cursor-pointer flex items-center gap-3 p-3 rounded-2xl bg-[#0e101c] border border-slate-800/80 hover:border-cyan-500/30 hover:bg-[#131526] transition-all"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <Disc className="w-5 h-5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                  <Play className="w-4 h-4 fill-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  className={`text-xs sm:text-sm font-bold truncate group-hover:text-cyan-300 transition ${
                    currentTrack?.id === track.id ? 'text-cyan-400' : 'text-white'
                  }`}
                >
                  {track.title}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(track.id);
                }}
                className={`p-2 rounded-lg transition ${
                  track.isFavorite
                    ? 'text-rose-500'
                    : 'text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
