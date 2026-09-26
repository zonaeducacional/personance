import React from 'react';
import { Plus, ListMusic, Disc, Play } from 'lucide-react';
import { Playlist, Track } from '../types';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  onSelectPlaylist: (playlistId: string) => void;
  onOpenNewPlaylist: () => void;
  onPlayPlaylist: (playlist: Playlist) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  onSelectPlaylist,
  onOpenNewPlaylist,
  onPlayPlaylist,
}) => {
  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Minhas Playlists
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Suas seleções e coleções de áudio salvas localmente
          </p>
        </div>

        <button
          onClick={onOpenNewPlaylist}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {playlists.map((pl) => {
          return (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group cursor-pointer rounded-2xl bg-[#0e101c] border border-slate-800/80 hover:border-cyan-500/40 p-3.5 transition-all hover:scale-[1.02] shadow-xl relative flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-3">
                  {pl.coverUrl ? (
                    <img
                      src={pl.coverUrl}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                      <Disc className="w-12 h-12" />
                    </div>
                  )}

                  {/* Play Hover Overlay Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPlaylist(pl);
                    }}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/30 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all"
                    title="Reproduzir playlist inteira"
                  >
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </button>

                  <div
                    className="absolute top-2 left-2 w-3 h-3 rounded-full shadow-md"
                    style={{ backgroundColor: pl.accentColor || '#06b6d4' }}
                  />
                </div>

                <h3 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition">
                  {pl.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {pl.description || 'Playlist personalizada'}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-cyan-400">
                {pl.trackIds.length} {pl.trackIds.length === 1 ? 'música' : 'músicas'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
