import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Maximize2,
  Sliders,
  ListMusic,
  Disc,
} from 'lucide-react';
import { Track, VisualizerMode, RepeatMode } from '../types';
import { Visualizer } from './Visualizer';

interface BottomPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onCycleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenFullscreen: () => void;
  onOpenFX: () => void;
  onOpenQueue: () => void;
  visualizerMode: VisualizerMode;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
  onToggleFavorite,
  onOpenFullscreen,
  onOpenFX,
  onOpenQueue,
  visualizerMode,
}) => {
  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090b14]/90 backdrop-blur-xl border-t border-cyan-500/20 px-3 sm:px-6 py-2.5 shadow-2xl">
      {/* Top micro seekbar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 cursor-pointer group">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 relative group-hover:h-1.5 transition-all"
          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3 min-w-0 w-1/4 sm:w-1/3">
          <div
            onClick={onOpenFullscreen}
            className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex-shrink-0 cursor-pointer group shadow-md"
            title="Expandir player"
          >
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform ${
                  isPlaying ? 'scale-105' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                <Disc className="w-6 h-6" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>

          <div className="min-w-0 pr-1">
            <h4
              onClick={onOpenFullscreen}
              className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-cyan-300 transition"
            >
              {currentTrack.title}
            </h4>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          <button
            onClick={() => onToggleFavorite(currentTrack.id)}
            className={`p-1.5 rounded-lg transition hidden sm:inline-block ${
              currentTrack.isFavorite
                ? 'text-rose-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Favoritar"
          >
            <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Center: Controls & Timeline */}
        <div className="flex flex-col items-center flex-1 max-w-lg">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-lg transition hidden sm:inline-block ${
                isShuffle ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Aleatório"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Prev */}
            <button
              onClick={onPrev}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white transition"
              title="Anterior"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black flex items-center justify-center shadow-md shadow-cyan-500/30 hover:scale-105 active:scale-95 transition"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white transition"
              title="Próxima"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Repeat */}
            <button
              onClick={onCycleRepeat}
              className={`p-1.5 rounded-lg transition relative hidden sm:inline-block ${
                repeatMode !== 'off'
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`Repetição: ${
                repeatMode === 'off'
                  ? 'Desativada'
                  : repeatMode === 'all'
                  ? 'Todas as Faixas'
                  : 'Faixa Atual (1)'
              }`}
            >
              <Repeat className="w-4 h-4" />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-cyan-400 text-black rounded-full w-3 h-3 flex items-center justify-center">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Time scrubber on medium+ screens */}
          <div className="hidden sm:flex items-center gap-2 w-full mt-1">
            <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="flex-1 h-1 accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-slate-400 w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Audio FX, Visualizer Preview, Volume, Queue */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/4 sm:w-1/3">
          {/* Mini Visualizer in the bar */}
          <div
            onClick={onOpenFX}
            className="hidden md:block w-20 h-7 rounded-lg overflow-hidden bg-slate-900/60 border border-slate-800 cursor-pointer"
            title="Clique para abrir Equalizador e Modos"
          >
            <Visualizer
              mode={visualizerMode === 'off' ? 'bars' : visualizerMode}
              isPlaying={isPlaying}
              accentColor="#06b6d4"
              className="w-full h-full"
            />
          </div>

          {/* Equalizer FX Button */}
          <button
            onClick={onOpenFX}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
            title="Equalizador & FX"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Queue Button */}
          <button
            onClick={onOpenQueue}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Fila de Reprodução"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2 w-24">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 accent-cyan-400"
            />
          </div>

          {/* Fullscreen Expand */}
          <button
            onClick={onOpenFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Expandir para tela cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
