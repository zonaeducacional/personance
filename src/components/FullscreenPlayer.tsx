import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  FileText,
  Sliders,
  Disc,
  Sparkles,
} from 'lucide-react';
import { Track, VisualizerMode, RepeatMode } from '../types';
import { Visualizer } from './Visualizer';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
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
  visualizerMode: VisualizerMode;
  onOpenFX: () => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  isOpen,
  onClose,
  track,
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
  visualizerMode,
  onOpenFX,
}) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics'>('cover');

  if (!isOpen || !track) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07080f]/95 backdrop-blur-2xl text-slate-100 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
      {/* Dynamic ambient backdrop glow based on artwork */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, #8b5cf6 60%, transparent 100%)',
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          title="Minimizar player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
            Tocando Agora
          </span>
          <h4 className="text-xs text-slate-400 truncate max-w-xs">{track.album}</h4>
        </div>

        <button
          onClick={onOpenFX}
          className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition"
          title="Abrir Equalizador & Efeitos"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content (Artwork or Lyrics) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto w-full">
        {/* Toggle between Vinyl Cover and Lyrics */}
        <div className="flex items-center gap-2 mb-6 p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'cover'
                ? 'bg-cyan-500 text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Vinil & Visual</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'lyrics'
                ? 'bg-cyan-500 text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Letras</span>
          </button>
        </div>

        {activeTab === 'cover' ? (
          <div className="flex flex-col items-center w-full">
            {/* Vinyl record spinning presentation */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 my-2 flex items-center justify-center">
              {/* Outer Vinyl Disc */}
              <div
                className={`relative w-full h-full rounded-full shadow-2xl p-4 bg-gradient-to-tr from-[#11121d] via-[#1a1b2e] to-[#0c0d16] border border-white/10 ${
                  isPlaying ? 'animate-spin-slow' : 'animate-spin-slow animate-spin-paused'
                }`}
                style={{
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(6, 182, 212, 0.25)',
                }}
              >
                {/* Vinyl Grooves */}
                <div className="absolute inset-4 rounded-full border border-white/5" />
                <div className="absolute inset-8 rounded-full border border-white/5" />
                <div className="absolute inset-12 rounded-full border border-white/5" />
                <div className="absolute inset-16 rounded-full border border-white/5" />

                {/* Center Artwork Label */}
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative shadow-inner">
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Disc className="w-16 h-16 text-cyan-400" />
                    </div>
                  )}

                  {/* Spindle hole */}
                  <div className="absolute w-7 h-7 rounded-full bg-[#07080f] border-2 border-white/40 shadow-inner flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Audio Visualizer underneath */}
            <div className="w-full max-w-sm mt-6">
              <Visualizer
                mode={visualizerMode}
                isPlaying={isPlaying}
                accentColor="#06b6d4"
                className="w-full h-16 rounded-xl"
              />
            </div>
          </div>
        ) : (
          /* Lyrics View */
          <div className="w-full h-80 sm:h-96 rounded-2xl bg-white/5 border border-white/10 p-6 overflow-y-auto text-center flex flex-col items-center justify-center">
            {track.lyrics ? (
              <div className="space-y-4 max-w-md">
                {track.lyrics.split('\n').map((line, idx) => (
                  <p
                    key={idx}
                    className="text-sm sm:text-base font-medium text-slate-300 hover:text-white transition leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 flex flex-col items-center">
                <FileText className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma letra cadastrada para esta música.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Você pode adicionar a letra na Área Admin editando a faixa!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Track Title & Artist Info */}
        <div className="w-full flex items-center justify-between mt-6">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{track.title}</h2>
            <p className="text-sm text-cyan-300/80 truncate mt-0.5">{track.artist}</p>
          </div>

          <button
            onClick={() => onToggleFavorite(track.id)}
            className={`p-2.5 rounded-full transition ${
              track.isFavorite
                ? 'text-rose-500 bg-rose-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className={`w-6 h-6 ${track.isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="w-full mt-6 space-y-1.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 accent-cyan-400"
          />
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Playback Controls */}
        <div className="w-full flex items-center justify-between mt-6 px-4">
          {/* Shuffle */}
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-full transition ${
              isShuffle ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
            }`}
            title="Modo aleatório"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous */}
          <button
            onClick={onPrev}
            className="p-3 rounded-full hover:bg-white/10 text-slate-200 hover:text-white transition"
            title="Música anterior"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-black" />
            ) : (
              <Play className="w-7 h-7 fill-black ml-1" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            className="p-3 rounded-full hover:bg-white/10 text-slate-200 hover:text-white transition"
            title="Próxima música"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          {/* Repeat */}
          <button
            onClick={onCycleRepeat}
            className={`p-2 rounded-full transition relative ${
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
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-cyan-400 text-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Volume & Details Footer */}
        <div className="w-full flex items-center justify-between mt-8 pt-4 border-t border-white/5 px-2">
          <div className="flex items-center gap-2 w-40">
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

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>44.1kHz • Sem Perdas / Master</span>
          </div>
        </div>
      </div>
    </div>
  );
};
