import React, { useState, useMemo } from 'react';
import {
  Search,
  Music,
  Play,
  Heart,
  Clock,
  MoreVertical,
  Plus,
  Download,
  Trash2,
  Check,
  Disc,
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { addTrackToPlaylist, deleteTrack } from '../services/db';

interface TracksViewProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
  onRefreshData: () => Promise<void>;
  onNavigateToUpload: () => void;
}

export const TracksView: React.FC<TracksViewProps> = ({
  tracks,
  playlists,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onToggleFavorite,
  onRefreshData,
  onNavigateToUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'duration'>('recent');
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filter & Sort
  const filteredTracks = useMemo(() => {
    let result = tracks.filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'artist') {
      result.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (sortBy === 'duration') {
      result.sort((a, b) => b.duration - a.duration);
    } else {
      result.sort((a, b) => b.dateAdded - a.dateAdded);
    }

    return result;
  }, [tracks, searchQuery, sortBy]);

  const handleAddToPlaylist = async (playlistId: string, trackId: string, plTitle: string) => {
    await addTrackToPlaylist(playlistId, trackId);
    setActiveMenuTrackId(null);
    setFeedbackMsg(`Adicionada à playlist "${plTitle}"!`);
    setTimeout(() => setFeedbackMsg(null), 2500);
    await onRefreshData();
  };

  const handleDownload = (track: Track) => {
    if (!track.audioBlob) return;
    const url = URL.createObjectURL(track.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.artist} - ${track.title}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActiveMenuTrackId(null);
  };

  const handleDelete = async (trackId: string, title: string) => {
    if (confirm(`Excluir "${title}" da biblioteca?`)) {
      await deleteTrack(trackId);
      setActiveMenuTrackId(null);
      await onRefreshData();
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-cyan-500 text-black px-4 py-2 text-xs font-bold shadow-2xl animate-in slide-in-from-top">
          <Check className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Biblioteca de Músicas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tracks.length} {tracks.length === 1 ? 'música cadastrada' : 'músicas cadastradas'} no navegador
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar música, artista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0e101b] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0e101b] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="recent">Mais Recentes</option>
            <option value="title">Título (A-Z)</option>
            <option value="artist">Artista (A-Z)</option>
            <option value="duration">Mais Longas</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-[#0c0d16] border border-slate-800/80 overflow-hidden shadow-xl">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6 sm:col-span-5">Título</div>
          <div className="hidden sm:block sm:col-span-4">Álbum</div>
          <div className="col-span-3 sm:col-span-2 text-right flex items-center justify-end gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Duração</span>
          </div>
        </div>

        {/* Tracks List */}
        <div className="divide-y divide-slate-800/50">
          {filteredTracks.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma música encontrada para sua busca.</p>
              <button
                onClick={onNavigateToUpload}
                className="mt-3 px-4 py-1.5 rounded-xl bg-cyan-500 text-xs font-semibold text-black"
              >
                Fazer Upload de MP3
              </button>
            </div>
          ) : (
            filteredTracks.map((track, idx) => {
              const isCurrent = currentTrackId === track.id;
              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-800/40 transition group relative ${
                    isCurrent ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  {/* Track Number / Play Trigger */}
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => onPlayTrack(track, filteredTracks)}
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

                  {/* Title & Cover */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Disc className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 pr-1">
                      <h4
                        onClick={() => onPlayTrack(track, filteredTracks)}
                        className={`text-xs sm:text-sm font-semibold truncate cursor-pointer hover:underline ${
                          isCurrent ? 'text-cyan-400 font-bold' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="hidden sm:block sm:col-span-4 text-xs text-slate-400 truncate">
                    {track.album}
                  </div>

                  {/* Duration & Context Actions */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
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

                    {/* Context menu toggle */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)
                        }
                        className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuTrackId === track.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl bg-[#141624] border border-slate-700 shadow-2xl py-1 text-xs text-slate-200 animate-in fade-in">
                          <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                            Adicionar à Playlist
                          </div>
                          {playlists.length === 0 ? (
                            <div className="px-3 py-2 text-[11px] text-slate-500">
                              Nenhuma playlist criada
                            </div>
                          ) : (
                            playlists.map((pl) => (
                              <button
                                key={pl.id}
                                onClick={() => handleAddToPlaylist(pl.id, track.id, pl.title)}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-700/60 truncate flex items-center gap-2"
                              >
                                <Plus className="w-3 h-3 text-cyan-400" />
                                <span className="truncate">{pl.title}</span>
                              </button>
                            ))
                          )}

                          <div className="border-t border-slate-800 mt-1 pt-1">
                            {track.audioBlob && (
                              <button
                                onClick={() => handleDownload(track)}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-700/60 flex items-center gap-2"
                              >
                                <Download className="w-3 h-3 text-cyan-400" />
                                <span>Baixar Áudio MP3</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(track.id, track.title)}
                              className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Excluir da Biblioteca</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
