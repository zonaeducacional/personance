import React from 'react';
import { Play, Shuffle, Heart, Music, Clock, Disc } from 'lucide-react';
import { Track } from '../types';

interface FavoritesViewProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onToggleFavorite: (trackId: string) => void;
  onNavigateToUpload: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onPlayAll,
  onToggleFavorite,
  onNavigateToUpload,
}) => {
  const favoriteTracks = tracks.filter((t) => t.isFavorite);
  const totalDuration = favoriteTracks.reduce((acc, t) => acc + t.duration, 0);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-[#201018] via-[#160c14] to-[#0d0c16] border border-rose-500/25 shadow-xl relative overflow-hidden">
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-gradient-to-tr from-rose-950 to-pink-900 border border-rose-500/30 flex-shrink-0 shadow-2xl flex items-center justify-center">
          <Heart className="w-20 h-20 text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
            Coleção Especial
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Músicas Favoritas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Todas as faixas que você marcou com coração para acesso rápido a qualquer momento.
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-mono text-slate-400 pt-2">
            <span>{favoriteTracks.length} faixas</span>
            <span>•</span>
            <span>
              {Math.floor(totalDuration / 60)} min {Math.floor(totalDuration % 60)} seg
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
            <button
              onClick={() => onPlayAll(favoriteTracks, false)}
              disabled={favoriteTracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Tocar Favoritas</span>
            </button>

            <button
              onClick={() => onPlayAll(favoriteTracks, true)}
              disabled={favoriteTracks.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 disabled:opacity-50 disabled:pointer-events-none transition"
            >
              <Shuffle className="w-4 h-4 text-rose-400" />
              <span>Ordem Aleatória</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracks Table */}
      <div className="rounded-2xl bg-[#0c0d16] border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6 sm:col-span-6">Título</div>
          <div className="hidden sm:block sm:col-span-3">Álbum</div>
          <div className="col-span-5 sm:col-span-2 text-right flex items-center justify-end gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Duração</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {favoriteTracks.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Heart className="w-10 h-10 mx-auto mb-2 opacity-30 text-rose-500" />
              <p className="text-xs">Você ainda não favoritou nenhuma música.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Clique no ícone de coração em qualquer música para salvá-la aqui!
              </p>
            </div>
          ) : (
            favoriteTracks.map((track, idx) => {
              const isCurrent = currentTrackId === track.id;
              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-800/40 transition group relative ${
                    isCurrent ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => onPlayTrack(track, favoriteTracks)}
                      className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-slate-400 group-hover:text-cyan-300 hover:bg-slate-800 transition"
                    >
                      {isCurrent && isPlaying ? (
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm animate-pulse" />
                      ) : (
                        <span className="group-hover:hidden text-xs font-mono text-slate-500">
                          {idx + 1}
                        </span>
                      )}
                      <Play className="w-3.5 h-3.5 hidden group-hover:inline-block fill-current" />
                    </button>
                  </div>

                  <div className="col-span-6 sm:col-span-6 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Disc className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 pr-1">
                      <h4
                        onClick={() => onPlayTrack(track, favoriteTracks)}
                        className={`text-xs sm:text-sm font-semibold truncate cursor-pointer hover:underline ${
                          isCurrent ? 'text-rose-400 font-bold' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block sm:col-span-3 text-xs text-slate-400 truncate">
                    {track.album}
                  </div>

                  <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onToggleFavorite(track.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-slate-400 transition"
                      title="Desfavoritar"
                    >
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </button>

                    <span className="text-xs font-mono text-slate-400">
                      {Math.floor(track.duration / 60)}:
                      {Math.floor(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
