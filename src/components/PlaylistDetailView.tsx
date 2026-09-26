import React from 'react';
import {
  Play,
  Shuffle,
  Clock,
  Trash2,
  ArrowLeft,
  Music,
  Heart,
  Disc,
} from 'lucide-react';
import { Playlist, Track } from '../types';
import { removeTrackFromPlaylist } from '../services/db';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  allTracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onBack: () => void;
  onToggleFavorite: (trackId: string) => void;
  onRefreshData: () => Promise<void>;
  onNavigateToUpload: () => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  allTracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onPlayAll,
  onBack,
  onToggleFavorite,
  onRefreshData,
  onNavigateToUpload,
}) => {
  // Resolve tracks in order of playlist.trackIds
  const playlistTracks = playlist.trackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter((t): t is Track => t !== undefined);

  const totalDuration = playlistTracks.reduce((acc, t) => acc + t.duration, 0);

  const handleRemoveTrack = async (trackId: string) => {
    await removeTrackFromPlaylist(playlist.id, trackId);
    await onRefreshData();
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Playlists</span>
      </button>

      {/* Playlist Hero Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-[#121424] to-[#0c0d18] border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 shadow-2xl relative">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
              <Disc className="w-16 h-16 text-cyan-400" />
            </div>
          )}
          <div
            className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full ring-2 ring-white/20"
            style={{ backgroundColor: playlist.accentColor || '#06b6d4' }}
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            Playlist Personalizada
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {playlist.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            {playlist.description || 'Sem descrição.'}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-mono text-slate-400 pt-2">
            <span>{playlistTracks.length} faixas</span>
            <span>•</span>
            <span>
              {Math.floor(totalDuration / 60)} min {Math.floor(totalDuration % 60)} seg
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
            <button
              onClick={() => onPlayAll(playlistTracks, false)}
              disabled={playlistTracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Tocar Tudo</span>
            </button>

            <button
              onClick={() => onPlayAll(playlistTracks, true)}
              disabled={playlistTracks.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 disabled:opacity-50 disabled:pointer-events-none transition"
            >
              <Shuffle className="w-4 h-4 text-cyan-400" />
              <span>Ordem Aleatória</span>
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
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
          {playlistTracks.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Esta playlist ainda não tem músicas adicionadas.</p>
              <button
                onClick={onNavigateToUpload}
                className="mt-3 px-4 py-1.5 rounded-xl bg-cyan-500 text-xs font-semibold text-black"
              >
                Fazer Upload ou Adicionar Músicas
              </button>
            </div>
          ) : (
            playlistTracks.map((track, idx) => {
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
                      onClick={() => onPlayTrack(track, playlistTracks)}
                      className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-slate-400 group-hover:text-cyan-300 hover:bg-slate-800 transition"
                    >
                      {isCurrent && isPlaying ? (
                        <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm animate-pulse" />
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
                        onClick={() => onPlayTrack(track, playlistTracks)}
                        className={`text-xs sm:text-sm font-semibold truncate cursor-pointer hover:underline ${
                          isCurrent ? 'text-cyan-400 font-bold' : 'text-white'
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
                      className={`p-1.5 rounded-lg transition ${
                        track.isFavorite
                          ? 'text-rose-500'
                          : 'text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500' : ''}`} />
                    </button>

                    <span className="text-xs font-mono text-slate-400">
                      {Math.floor(track.duration / 60)}:
                      {Math.floor(track.duration % 60).toString().padStart(2, '0')}
                    </span>

                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                      title="Remover da playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
