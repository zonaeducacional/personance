import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Music,
  ListMusic,
  Trash2,
  Edit3,
  Plus,
  FileCheck,
  Download,
  Share2,
  FolderArchive,
  HelpCircle,
  Play,
  Save,
  X,
  Sparkles,
  Check,
  Disc,
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { parseAudioFile, generateCoverGradient } from '../services/id3Parser';
import { saveTrack, deleteTrack, savePlaylist, deletePlaylist, exportLibraryJSON } from '../services/db';

interface AdminStudioProps {
  tracks: Track[];
  playlists: Playlist[];
  onRefreshData: () => Promise<void>;
  onPlayTrack: (track: Track) => void;
  currentTrackId?: string;
  isPlaying: boolean;
}

export const AdminStudio: React.FC<AdminStudioProps> = ({
  tracks,
  playlists,
  onRefreshData,
  onPlayTrack,
  currentTrackId,
  isPlaying,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'tracks' | 'playlists' | 'hosting'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number; currentName: string }>({
    total: 0,
    done: 0,
    currentName: '',
  });

  // Track Edit Modal
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    artist: string;
    album: string;
    genre: string;
    lyrics: string;
    coverUrl?: string;
  }>({ title: '', artist: '', album: '', genre: '', lyrics: '' });

  // Playlist Create / Edit Modal
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistForm, setPlaylistForm] = useState<{
    id?: string;
    title: string;
    description: string;
    accentColor: string;
  }>({ title: '', description: '', accentColor: '#06b6d4' });

  // Target playlist when uploading
  const [selectedUploadPlaylistId, setSelectedUploadPlaylistId] = useState<string>('none');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Drag & Drop / File selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ total: files.length, done: 0, currentName: files[0].name });

    const newTrackIds: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ total: files.length, done: i, currentName: file.name });

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
          audioBlob: file, // Saved directly into IndexedDB!
          dateAdded: Date.now(),
          playCount: 0,
          isFavorite: false,
          isDemo: false,
        };

        await saveTrack(newTrack);
        newTrackIds.push(trackId);
      } catch (err) {
        console.error('Failed to parse or save audio file:', file.name, err);
      }
    }

    // Add to chosen playlist if selected
    if (selectedUploadPlaylistId !== 'none' && newTrackIds.length > 0) {
      const targetPl = playlists.find((p) => p.id === selectedUploadPlaylistId);
      if (targetPl) {
        targetPl.trackIds = [...targetPl.trackIds, ...newTrackIds];
        targetPl.dateUpdated = Date.now();
        await savePlaylist(targetPl);
      }
    }

    setUploadProgress({ total: files.length, done: files.length, currentName: 'Concluído!' });
    await onRefreshData();

    setTimeout(() => {
      setIsUploading(false);
      setActiveTab('tracks');
    }, 1200);
  };

  // Delete Track
  const handleDeleteTrack = async (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja excluir a música "${title}" da sua biblioteca?`)) {
      await deleteTrack(id);
      await onRefreshData();
    }
  };

  // Open Edit Modal
  const openEditTrack = (track: Track) => {
    setEditingTrack(track);
    setEditForm({
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre || '',
      lyrics: track.lyrics || '',
      coverUrl: track.coverUrl,
    });
  };

  // Save Track Edits
  const handleSaveTrackEdit = async () => {
    if (!editingTrack) return;
    const updated: Track = {
      ...editingTrack,
      title: editForm.title.trim() || 'Sem Título',
      artist: editForm.artist.trim() || 'Artista Desconhecido',
      album: editForm.album.trim() || 'Álbum',
      genre: editForm.genre.trim(),
      lyrics: editForm.lyrics,
      coverUrl: editForm.coverUrl || editingTrack.coverUrl,
    };
    await saveTrack(updated);
    setEditingTrack(null);
    await onRefreshData();
  };

  // Custom cover upload for track
  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditForm((prev) => ({ ...prev, coverUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Save New/Edited Playlist
  const handleSavePlaylist = async () => {
    if (!playlistForm.title.trim()) return;

    const plId = playlistForm.id || `pl-${Date.now()}`;
    const existing = playlists.find((p) => p.id === plId);

    const newPlaylist: Playlist = {
      id: plId,
      title: playlistForm.title.trim(),
      description: playlistForm.description.trim(),
      accentColor: playlistForm.accentColor,
      trackIds: existing ? existing.trackIds : [],
      dateCreated: existing ? existing.dateCreated : Date.now(),
      dateUpdated: Date.now(),
      coverUrl: existing?.coverUrl || generateCoverGradient(playlistForm.title, 'Playlist'),
    };

    await savePlaylist(newPlaylist);
    setShowPlaylistModal(false);
    setPlaylistForm({ title: '', description: '', accentColor: '#06b6d4' });
    await onRefreshData();
  };

  // Delete Playlist
  const handleDeletePlaylist = async (id: string, title: string) => {
    if (confirm(`Deseja excluir a playlist "${title}"? As músicas continuarão salvas na biblioteca.`)) {
      await deletePlaylist(id);
      await onRefreshData();
    }
  };

  // Download track file
  const handleDownloadTrack = (track: Track) => {
    if (!track.audioBlob) return;
    const url = URL.createObjectURL(track.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.artist} - ${track.title}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export JSON backup
  const handleExportBackup = async () => {
    const jsonStr = await exportLibraryJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resonance-library-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#121526] via-[#101221] to-[#0c0d18] border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-2 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Área Administrativa & Estúdio Local</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gerenciador de Músicas & Playlists
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Adicione músicas em MP3, edite metadados, crie coleções e mantenha tudo armazenado com segurança no seu navegador via IndexedDB, sem precisar de nenhum servidor backend.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            title="Exportar backup da biblioteca em JSON"
          >
            <FolderArchive className="w-4 h-4 text-cyan-400" />
            <span>Exportar Backup</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-6 overflow-x-auto pb-1 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 px-2 font-semibold flex items-center gap-2 whitespace-nowrap transition border-b-2 ${
            activeTab === 'upload'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Fazer Upload (MP3)</span>
        </button>

        <button
          onClick={() => setActiveTab('tracks')}
          className={`pb-3 px-2 font-semibold flex items-center gap-2 whitespace-nowrap transition border-b-2 ${
            activeTab === 'tracks'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Gerenciar Músicas ({tracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`pb-3 px-2 font-semibold flex items-center gap-2 whitespace-nowrap transition border-b-2 ${
            activeTab === 'playlists'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Gerenciar Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hosting')}
          className={`pb-3 px-2 font-semibold flex items-center gap-2 whitespace-nowrap transition border-b-2 ${
            activeTab === 'hosting'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Como Hospedar (Nekoweb / GitHub Pages)</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Target Playlist Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0f111d] border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-200 block">Adicionar diretamente a uma Playlist:</label>
              <span className="text-[11px] text-slate-400">As músicas enviadas entrarão automaticamente na playlist selecionada</span>
            </div>
            <select
              value={selectedUploadPlaylistId}
              onChange={(e) => setSelectedUploadPlaylistId(e.target.value)}
              className="bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="none">Nenhuma (apenas na biblioteca geral)</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.title}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="group relative cursor-pointer flex flex-col items-center justify-center p-12 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-3xl bg-gradient-to-b from-[#101323] to-[#0c0e18] hover:from-[#14182e] hover:to-[#0f1220] transition-all text-center"
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-4 shadow-lg shadow-cyan-500/10">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Arraste e solte seus arquivos de música aqui
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              Suporta MP3, WAV, OGG, M4A, FLAC. O sistema extrai automaticamente o nome da música, artista, álbum, duração e capa embutida no arquivo!
            </p>

            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all pointer-events-none"
            >
              Selecionar Arquivos do Computador / Celular
            </button>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-5 rounded-2xl bg-[#0f111d] border border-cyan-500/30 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold text-white mb-2">
                <span>Processando: {uploadProgress.currentName}</span>
                <span className="font-mono text-cyan-400">
                  {uploadProgress.done} / {uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#0f111d] border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <Disc className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">100% Armazenamento Local</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                As músicas ficam salvas diretamente no banco de dados IndexedDB do seu navegador. Nada vai para servidores externos de terceiros.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f111d] border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Tagging Inteligente</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Leitura de ID3v2: capas originais, artista e título são decodificados nativamente, com capas dinâmicas geradas se o arquivo não tiver arte.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f111d] border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <FileCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Pronto para PWA & Offline</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Instale o app pelo botão no topo e escute todas as músicas mesmo sem conexão com a internet ou em viagens.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE TRACKS */}
      {activeTab === 'tracks' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total de faixas salvas: {tracks.length}</span>
            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Mais Músicas</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0e101b] border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
            {tracks.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma música cadastrada ainda.</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-3 px-4 py-2 rounded-xl bg-cyan-500 text-xs font-semibold text-black"
                >
                  Fazer Upload Agora
                </button>
              </div>
            ) : (
              tracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-800/40 transition group"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 text-center text-xs font-mono text-slate-500">{idx + 1}</span>

                    <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                          <Music className="w-5 h-5" />
                        </div>
                      )}
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                        title="Tocar música"
                      >
                        <Play className="w-5 h-5 fill-white text-white" />
                      </button>
                    </div>

                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            currentTrackId === track.id ? 'text-cyan-400' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        {track.isDemo && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {track.artist} • {track.album}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block text-xs font-mono text-slate-500 mr-2">
                      {Math.floor(track.duration / 60)}:
                      {Math.floor(track.duration % 60).toString().padStart(2, '0')}
                    </span>

                    {track.audioBlob && (
                      <button
                        onClick={() => handleDownloadTrack(track)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                        title="Baixar arquivo de áudio"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => openEditTrack(track)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                      title="Editar informações da música"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteTrack(track.id, track.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Excluir música"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE PLAYLISTS */}
      {activeTab === 'playlists' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total de playlists: {playlists.length}</span>
            <button
              onClick={() => {
                setPlaylistForm({ title: '', description: '', accentColor: '#06b6d4' });
                setShowPlaylistModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Playlist</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="p-4 rounded-2xl bg-[#0e101b] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-3">
                    {pl.coverUrl ? (
                      <img src={pl.coverUrl} alt={pl.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                        <ListMusic className="w-8 h-8" />
                      </div>
                    )}
                    <div
                      className="absolute bottom-2 left-2 w-3 h-3 rounded-full"
                      style={{ backgroundColor: pl.accentColor || '#06b6d4' }}
                    />
                  </div>

                  <h3 className="text-sm font-bold text-white truncate">{pl.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {pl.description || 'Sem descrição cadastrada.'}
                  </p>
                  <span className="text-[11px] font-mono text-cyan-400 mt-2 block">
                    {pl.trackIds.length} {pl.trackIds.length === 1 ? 'música' : 'músicas'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setPlaylistForm({
                        id: pl.id,
                        title: pl.title,
                        description: pl.description || '',
                        accentColor: pl.accentColor || '#06b6d4',
                      });
                      setShowPlaylistModal(true);
                    }}
                    className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDeletePlaylist(pl.id, pl.title)}
                    className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOW TO HOST ON NEKOWEB / GITHUB PAGES */}
      {activeTab === 'hosting' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-[#0f111d] border border-cyan-500/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Guia de Hospedagem Estática Sem Backend</h3>
                <p className="text-xs text-slate-400">
                  Como publicar este app no Nekoweb ou GitHub Pages gratuitamente
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 leading-relaxed">
              <strong>Como este app funciona sem backend?</strong> Todo o processamento (reprodução de áudio, sintetizadores, equalizadores paramétricos e armazenamento de arquivos MP3) utiliza as APIs nativas do navegador (IndexedDB e Web Audio API). Portanto, ele é um aplicativo 100% estático (HTML, CSS e JS)!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Nekoweb */}
              <div className="p-5 rounded-2xl bg-[#141626] border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold">1</span>
                  Hospedagem no Nekoweb
                </h4>
                <p className="text-xs text-slate-400">
                  O Nekoweb é um serviço gratuito para páginas estáticas e personalizadas.
                </p>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Execute o comando de build na sua máquina ou terminal: <code className="px-1.5 py-0.5 rounded bg-black text-cyan-300">npm run build</code></li>
                  <li>Uma pasta chamada <code className="px-1.5 py-0.5 rounded bg-black text-cyan-300">dist/</code> será gerada contendo <code className="text-white">index.html</code> e a pasta <code className="text-white">assets/</code>.</li>
                  <li>Acesse o painel do Nekoweb (<code className="text-cyan-300">nekoweb.org</code>) e abra o File Manager.</li>
                  <li>Arraste e envie todos os arquivos de dentro da pasta <code className="text-white">dist/</code> para a raiz do seu site no Nekoweb.</li>
                  <li>Pronto! Seu player estará no ar com suporte a PWA e upload local!</li>
                </ol>
              </div>

              {/* GitHub Pages */}
              <div className="p-5 rounded-2xl bg-[#141626] border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                  Hospedagem no GitHub Pages
                </h4>
                <p className="text-xs text-slate-400">
                  Publique diretamente do seu repositório no GitHub sem custo.
                </p>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                  <li>No seu repositório GitHub, vá em <strong>Settings &gt; Pages</strong>.</li>
                  <li>Na seção <em>Build and deployment</em>, você pode usar <strong>GitHub Actions</strong> ou fazer deploy da branch <code className="text-cyan-300">gh-pages</code>.</li>
                  <li>O projeto já está configurado com <code className="px-1.5 py-0.5 rounded bg-black text-cyan-300">base: './'</code> no <code className="text-white">vite.config.ts</code>, garantindo que nenhum caminho de arquivo quebre em subdiretórios!</li>
                  <li>Após o deploy, você pode acessar seu player em <code className="text-cyan-300">https://seu-usuario.github.io/seu-repo/</code>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRACK EDIT MODAL */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0f111d] border border-cyan-500/30 p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Editar Metadados da Música</h3>
              <button
                onClick={() => setEditingTrack(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Cover preview & upload */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0">
                  {editForm.coverUrl ? (
                    <img src={editForm.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Music className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                  >
                    Alterar Imagem da Capa
                  </button>
                  <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleCustomCoverUpload}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP ou SVG</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Título da Música</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Artista</label>
                <input
                  type="text"
                  value={editForm.artist}
                  onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                  className="w-full bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Álbum</label>
                  <input
                    type="text"
                    value={editForm.album}
                    onChange={(e) => setEditForm({ ...editForm, album: e.target.value })}
                    className="w-full bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Gênero</label>
                  <input
                    type="text"
                    value={editForm.genre}
                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                    className="w-full bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Letra (Opcional)</label>
                <textarea
                  rows={4}
                  value={editForm.lyrics}
                  onChange={(e) => setEditForm({ ...editForm, lyrics: e.target.value })}
                  placeholder="Cole aqui a letra da música..."
                  className="w-full bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingTrack(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTrackEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYLIST CREATE / EDIT MODAL */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f111d] border border-cyan-500/30 p-6 shadow-2xl relative text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {playlistForm.id ? 'Editar Playlist' : 'Criar Nova Playlist'}
              </h3>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nome da Playlist</label>
                <input
                  type="text"
                  placeholder="Ex: Treino Intenso, Lo-Fi Madrugada"
                  value={playlistForm.title}
                  onChange={(e) => setPlaylistForm({ ...playlistForm, title: e.target.value })}
                  className="w-full bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Breve descrição da sua playlist..."
                  value={playlistForm.description}
                  onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
                  className="w-full bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Cor de Destaque</label>
                <div className="flex items-center gap-2">
                  {['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPlaylistForm({ ...playlistForm, accentColor: color })}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                        playlistForm.accentColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {playlistForm.accentColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlaylist}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
              >
                Salvar Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
