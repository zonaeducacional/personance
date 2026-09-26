import React, { useState, useRef } from 'react';
import {
  Play,
  Shuffle,
  Clock,
  Trash2,
  ArrowLeft,
  Music,
  Heart,
  Disc,
  Plus,
  UploadCloud,
  Check,
  Search,
  X,
} from 'lucide-react';
import { Playlist, Track } from '../types';
import { removeTrackFromPlaylist, savePlaylist, saveTrack } from '../services/db';
import { parseAudioFile } from '../services/id3Parser';

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
}) => {
  const [showAddTracksModal, setShowAddTracksModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(playlist.trackIds);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Resolve tracks in order of playlist.trackIds
  const playlistTracks = playlist.trackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter((t): t is Track => t !== undefined);

  const totalDuration = playlistTracks.reduce((acc, t) => acc + t.duration, 0);

  const handleRemoveTrack = async (trackId: string) => {
    await removeTrackFromPlaylist(playlist.id, trackId);
    await onRefreshData();
  };

  // Open modal and sync selection
  const handleOpenAddModal = () => {
    setSelectedTrackIds(playlist.trackIds);
    setSearchFilter('');
    setShowAddTracksModal(true);
  };

  // Save selected tracks to playlist
  const handleSaveSelectedTracks = async () => {
    playlist.trackIds = selectedTrackIds;
    playlist.dateUpdated = Date.now();
    await savePlaylist(playlist);
    await onRefreshData();
    setShowAddTracksModal(false);
    setUploadFeedback(`${selectedTrackIds.length} músicas atualizadas na playlist!`);
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  const toggleTrackSelection = (id: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  // Handle direct file upload to this playlist
  const handleDirectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadFeedback(`Enviando ${files.length} arquivo(s)...`);

    const newTrackIds: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const metadata = await parseAudioFile(file);
        const trackId = `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const newTrack: Track = {
          id: trackId,
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          genre: 'Local',
          year: metadata.year || new Date().getFullYear(),
          duration: metadata.duration,
          coverUrl: metadata.coverUrl,
          audioBlob: file,
          dateAdded: Date.now(),
          playCount: 0,
          isFavorite: false,
          isDemo: false,
        };

        await saveTrack(newTrack);
        newTrackIds.push(trackId);
      } catch (err) {
        console.error('Erro ao processar áudio:', file.name, err);
      }
    }

    if (newTrackIds.length > 0) {
      playlist.trackIds = [...playlist.trackIds, ...newTrackIds];
      playlist.dateUpdated = Date.now();
      await savePlaylist(playlist);
      await onRefreshData();
      setUploadFeedback(`${newTrackIds.length} música(s) adicionada(s) à playlist "${playlist.title}"!`);

      // Automatically start playing the newly added tracks if requested
      const updatedPlaylistTracks = playlist.trackIds
        .map((id) => allTracks.find((t) => t.id === id))
        .filter((t): t is Track => t !== undefined);
      if (updatedPlaylistTracks.length > 0) {
        onPlayAll(updatedPlaylistTracks, false);
      }
    }

    setIsUploading(false);
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  const filteredAllTracks = allTracks.filter((t) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* Hidden file input for direct upload */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
        className="hidden"
        onChange={(e) => handleDirectFiles(e.target.files)}
      />

      {/* Back Button & Feedback */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Playlists</span>
        </button>

        {uploadFeedback && (
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold animate-pulse border border-cyan-500/30">
            {uploadFeedback}
          </span>
        )}
      </div>

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
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-3">
            <button
              onClick={() => onPlayAll(playlistTracks, false)}
              disabled={playlistTracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Tocar Tudo</span>
            </button>

            <button
              onClick={() => onPlayAll(playlistTracks, true)}
              disabled={playlistTracks.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-cyan-400" />
              <span>Ordem Aleatória</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Músicas</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#161a2e] hover:bg-[#1c223c] text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>{isUploading ? 'Enviando...' : 'Subir Arquivos MP3'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Quick Zone on Playlist Detail */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleDirectFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-[#0a0c16]/50 hover:bg-[#0e1120] transition flex items-center justify-center gap-3 cursor-pointer text-slate-400 hover:text-cyan-300 text-xs text-center"
      >
        <UploadCloud className="w-5 h-5 text-cyan-400" />
        <span>Arraste arquivos de áudio aqui para adicionar diretamente a esta playlist</span>
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
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Music className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
              <p className="text-sm font-semibold text-slate-300">Esta playlist ainda não tem músicas adicionadas.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Você pode escolher músicas que já estão salvas na sua biblioteca ou fazer o upload de novos arquivos MP3 diretamente para cá.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition cursor-pointer"
                >
                  Selecionar da Biblioteca
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  Fazer Upload de MP3
                </button>
              </div>
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
                      className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-slate-400 group-hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
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
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        track.isFavorite ? 'text-rose-500' : 'text-slate-500 hover:text-white'
                      }`}
                      title="Favoritar"
                    >
                      <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Remover desta playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs font-mono text-slate-500 min-w-[36px] text-right">
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

      {/* Modal: Select Tracks from Library */}
      {showAddTracksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-xl w-full bg-[#0f111d] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Adicionar Músicas à Playlist</h3>
                <p className="text-xs text-slate-400">Selecione as músicas da sua biblioteca para incluir em "{playlist.title}"</p>
              </div>
              <button
                onClick={() => setShowAddTracksModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="my-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar por nome, artista ou álbum..."
                className="w-full bg-[#181b2e] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Track Checkboxes List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
              {filteredAllTracks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Nenhuma música encontrada com esse termo.
                </div>
              ) : (
                filteredAllTracks.map((t) => {
                  const isChecked = selectedTrackIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTrackSelection(t.id)}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                        isChecked ? 'bg-cyan-950/30 border border-cyan-500/30' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                          isChecked ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-slate-600 bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                        {t.coverUrl ? (
                          <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <Disc className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold truncate ${isChecked ? 'text-cyan-300' : 'text-white'}`}>
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {t.artist} • {t.album}
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">
                        {Math.floor(t.duration / 60)}:{Math.floor(t.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                {selectedTrackIds.length} selecionada(s)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddTracksModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSelectedTracks}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition cursor-pointer"
                >
                  Salvar Músicas na Playlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
