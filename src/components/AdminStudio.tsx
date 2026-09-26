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
  FolderUp,
  Search,
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
  onNavigateToPlaylist?: (playlistId: string) => void;
}

export const AdminStudio: React.FC<AdminStudioProps> = ({
  tracks,
  playlists,
  onRefreshData,
  onPlayTrack,
  currentTrackId,
  isPlaying,
  onNavigateToPlaylist,
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
  const [playlistTrackSearch, setPlaylistTrackSearch] = useState('');
  const [playlistForm, setPlaylistForm] = useState<{
    id?: string;
    title: string;
    description: string;
    accentColor: string;
    trackIds: string[];
  }>({ title: '', description: '', accentColor: '#06b6d4', trackIds: [] });

  // Upload Destination State
  const [uploadDestMode, setUploadDestMode] = useState<'new_playlist' | 'existing_playlist' | 'none'>('new_playlist');
  const [newPlaylistName, setNewPlaylistName] = useState<string>('Minha Playlist');
  const [selectedUploadPlaylistId, setSelectedUploadPlaylistId] = useState<string>(playlists[0]?.id || 'none');

  // Success Feedback Banner
  const [completedUploadInfo, setCompletedUploadInfo] = useState<{
    count: number;
    playlistId?: string;
    playlistTitle?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonBackupInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Drag & Drop / File selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setCompletedUploadInfo(null);
    setUploadProgress({ total: files.length, done: 0, currentName: files[0].name });

    const newTrackIds: string[] = [];
    let detectedM3uName: string | null = null;

    // First check if an .m3u or .json was uploaded
    for (let i = 0; i < files.length; i++) {
      const name = files[i].name.toLowerCase();
      if (name.endsWith('.m3u') || name.endsWith('.m3u8')) {
        detectedM3uName = files[i].name.replace(/\.(m3u|m3u8)$/i, '');
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ total: files.length, done: i, currentName: file.name });

      // Skip playlist text files during audio decoding
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.m3u') || lowerName.endsWith('.m3u8') || lowerName.endsWith('.json')) {
        continue;
      }

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
          audioBlob: file, // Saved into IndexedDB!
          dateAdded: Date.now(),
          playCount: 0,
          isFavorite: false,
          isDemo: false,
        };

        await saveTrack(newTrack);
        newTrackIds.push(trackId);
      } catch (err) {
        console.error('Falha ao processar arquivo de áudio:', file.name, err);
      }
    }

    let finalPlId: string | undefined = undefined;
    let finalPlTitle: string | undefined = undefined;

    // 1. Create a brand new playlist with uploaded tracks
    if ((uploadDestMode === 'new_playlist' || detectedM3uName) && newTrackIds.length > 0) {
      const plTitle = detectedM3uName || newPlaylistName.trim() || `Playlist ${new Date().toLocaleDateString('pt-BR')}`;
      finalPlId = `pl-${Date.now()}`;
      finalPlTitle = plTitle;

      const newPl: Playlist = {
        id: finalPlId,
        title: plTitle,
        description: `Criada com ${newTrackIds.length} músicas em ${new Date().toLocaleDateString('pt-BR')}.`,
        accentColor: '#06b6d4',
        trackIds: newTrackIds,
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
        coverUrl: generateCoverGradient(plTitle, 'Playlist'),
      };
      await savePlaylist(newPl);
    }
    // 2. Add to existing playlist
    else if (uploadDestMode === 'existing_playlist' && selectedUploadPlaylistId !== 'none' && newTrackIds.length > 0) {
      const targetPl = playlists.find((p) => p.id === selectedUploadPlaylistId);
      if (targetPl) {
        targetPl.trackIds = [...targetPl.trackIds, ...newTrackIds];
        targetPl.dateUpdated = Date.now();
        await savePlaylist(targetPl);
        finalPlId = targetPl.id;
        finalPlTitle = targetPl.title;
      }
    }

    setUploadProgress({ total: files.length, done: files.length, currentName: 'Concluído com sucesso!' });
    await onRefreshData();

    setCompletedUploadInfo({
      count: newTrackIds.length,
      playlistId: finalPlId,
      playlistTitle: finalPlTitle,
    });

    setIsUploading(false);
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
      trackIds: playlistForm.trackIds,
      dateCreated: existing ? existing.dateCreated : Date.now(),
      dateUpdated: Date.now(),
      coverUrl: existing?.coverUrl || generateCoverGradient(playlistForm.title, 'Playlist'),
    };

    await savePlaylist(newPlaylist);
    setShowPlaylistModal(false);
    setPlaylistForm({ title: '', description: '', accentColor: '#06b6d4', trackIds: [] });
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

  // Import JSON backup
  const handleImportBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.playlists)) {
        for (const pl of data.playlists) {
          await savePlaylist(pl);
        }
      }
      if (Array.isArray(data.tracks)) {
        for (const t of data.tracks) {
          const existing = tracks.find((ex) => ex.id === t.id);
          if (!existing) {
            await saveTrack({
              ...t,
              dateAdded: t.dateAdded || Date.now(),
              playCount: t.playCount || 0,
              isFavorite: t.isFavorite || false,
            });
          }
        }
      }
      await onRefreshData();
      alert('Backup importado com sucesso!');
    } catch (e) {
      console.error('Erro ao importar backup:', e);
      alert('Arquivo de backup inválido.');
    }
  };

  const toggleModalTrack = (id: string) => {
    setPlaylistForm((prev) => ({
      ...prev,
      trackIds: prev.trackIds.includes(id)
        ? prev.trackIds.filter((tId) => tId !== id)
        : [...prev.trackIds, id],
    }));
  };

  const filteredModalTracks = tracks.filter((t) => {
    if (!playlistTrackSearch.trim()) return true;
    const q = playlistTrackSearch.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Hidden file input for JSON backup import */}
      <input
        type="file"
        ref={jsonBackupInputRef}
        accept=".json"
        className="hidden"
        onChange={(e) => handleImportBackup(e.target.files?.[0])}
      />

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
            Adicione músicas em MP3, crie playlists personalizadas e mantenha tudo armazenado com segurança no seu navegador via IndexedDB, sem precisar de nenhum servidor backend.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => jsonBackupInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Restaurar dados de backup"
          >
            <FolderUp className="w-4 h-4 text-cyan-400" />
            <span>Importar Backup</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
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
          className={`pb-3 px-2 font-semibold flex items-center gap-2 whitespace-nowrap transition border-b-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Fazer Upload (Músicas & Playlists)</span>
        </button>

        <button
          onClick={() => setActiveTab('tracks')}
          className={`pb-3 px-2 font-semibold flex items-center gap-2 whitespace-nowrap transition border-b-2 cursor-pointer ${
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
          className={`pb-3 px-2 font-semibold flex items-center gap-2 whitespace-nowrap transition border-b-2 cursor-pointer ${
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
          className={`pb-3 px-2 font-semibold flex items-center gap-2 whitespace-nowrap transition border-b-2 cursor-pointer ${
            activeTab === 'hosting'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Como Hospedar no GitHub Pages</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Destination Selector: New Playlist vs Existing Playlist vs None */}
          <div className="p-5 rounded-2xl bg-[#0f111d] border border-cyan-500/25 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <ListMusic className="w-4 h-4" />
              <span>Destino dos arquivos de áudio:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Create New Playlist */}
              <div
                onClick={() => setUploadDestMode('new_playlist')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  uploadDestMode === 'new_playlist'
                    ? 'border-cyan-400 bg-cyan-950/30 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-xs text-white mb-1">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Criar Nova Playlist</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cria uma playlist e coloca todas as músicas enviadas nela.
                  </p>
                </div>
              </div>

              {/* Option 2: Add to Existing Playlist */}
              <div
                onClick={() => setUploadDestMode('existing_playlist')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  uploadDestMode === 'existing_playlist'
                    ? 'border-cyan-400 bg-cyan-950/30 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-xs text-white mb-1">
                    <ListMusic className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Playlist Existente</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Adiciona as músicas a uma playlist que você já criou.
                  </p>
                </div>
              </div>

              {/* Option 3: General Library only */}
              <div
                onClick={() => setUploadDestMode('none')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  uploadDestMode === 'none'
                    ? 'border-cyan-400 bg-cyan-950/30 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-xs text-white mb-1">
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Apenas Biblioteca</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Salva na biblioteca geral de músicas sem vincular a playlist.
                  </p>
                </div>
              </div>
            </div>

            {/* Input for New Playlist Name */}
            {uploadDestMode === 'new_playlist' && (
              <div className="pt-2 animate-in fade-in">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nome da Nova Playlist a ser criada com estes arquivos:
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ex: Minha Seleção Especial, Álbum Completo..."
                  className="w-full sm:max-w-md bg-[#181a29] border border-cyan-500/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-300"
                />
              </div>
            )}

            {/* Selector for Existing Playlist */}
            {uploadDestMode === 'existing_playlist' && (
              <div className="pt-2 animate-in fade-in">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Selecione a playlist que receberá as músicas:
                </label>
                <select
                  value={selectedUploadPlaylistId}
                  onChange={(e) => setSelectedUploadPlaylistId(e.target.value)}
                  className="w-full sm:max-w-md bg-[#181a29] border border-cyan-500/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-300"
                >
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.title} ({pl.trackIds.length} faixas)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Success Banner if user just uploaded */}
          {completedUploadInfo && (
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {completedUploadInfo.count} música(s) enviada(s) com sucesso!
                  </h4>
                  {completedUploadInfo.playlistTitle && (
                    <p className="text-[11px] text-cyan-300">
                      Adicionadas à playlist <strong>"{completedUploadInfo.playlistTitle}"</strong>.
                    </p>
                  )}
                </div>
              </div>

              {completedUploadInfo.playlistId && onNavigateToPlaylist && (
                <button
                  onClick={() => onNavigateToPlaylist(completedUploadInfo.playlistId!)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Ir para a Playlist & Tocar</span>
                </button>
              )}
            </div>
          )}

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
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.m3u,.m3u8"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-4 shadow-lg shadow-cyan-500/10">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Arraste e solte seus arquivos de música (MP3, WAV, etc.) aqui
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              Suporta MP3, WAV, OGG, M4A, FLAC e playlists M3U. Os arquivos e capas originais são salvos de forma 100% offline no IndexedDB do navegador.
            </p>

            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all pointer-events-none"
            >
              Selecionar Arquivos de Música
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
                  style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Mais Músicas</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0e101c] border border-slate-800 divide-y divide-slate-800/60 overflow-hidden shadow-xl">
            {tracks.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Music className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
                <p className="text-xs">Nenhuma música adicionada ainda.</p>
              </div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  className={`p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition ${
                    currentTrackId === track.id ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  {/* Left: Play button + Artwork + Metadata */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>

                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Disc className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
                        title="Baixar arquivo de áudio"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => openEditTrack(track)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
                      title="Editar informações da música"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteTrack(track.id, track.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
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
                setPlaylistForm({ title: '', description: '', accentColor: '#06b6d4', trackIds: [] });
                setPlaylistTrackSearch('');
                setShowPlaylistModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition cursor-pointer"
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
                  {onNavigateToPlaylist && (
                    <button
                      onClick={() => onNavigateToPlaylist(pl.id)}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </button>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setPlaylistForm({
                          id: pl.id,
                          title: pl.title,
                          description: pl.description || '',
                          accentColor: pl.accentColor || '#06b6d4',
                          trackIds: pl.trackIds || [],
                        });
                        setPlaylistTrackSearch('');
                        setShowPlaylistModal(true);
                      }}
                      className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleDeletePlaylist(pl.id, pl.title)}
                      className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOW TO HOST ON GITHUB PAGES */}
      {activeTab === 'hosting' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-[#0f111d] border border-cyan-500/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Guia de Publicação no GitHub Pages</h3>
                <p className="text-xs text-slate-400">
                  Como manter este player online e sincronizado no GitHub Pages
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 leading-relaxed">
              <strong>Como o Resonance funciona sem servidor?</strong> Todo o processamento (áudio, visualizadores, playlists e dados de MP3) utiliza as APIs nativas do navegador (IndexedDB e Web Audio API). Portanto, ele é um aplicativo 100% estático que roda direto do GitHub Pages.
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <h4 className="font-bold text-white">Passos para ativar no GitHub:</h4>
              <ol className="list-decimal pl-5 space-y-2 text-slate-400">
                <li>No seu repositório no GitHub, abra a aba <strong>Settings</strong> &rarr; <strong>Pages</strong>.</li>
                <li>Em <strong>Source</strong>, selecione <strong>GitHub Actions</strong>.</li>
                <li>O fluxo automático configurado no projeto compilará e colocará no ar o player com o suporte offline e o novo logo de ondas no lago.</li>
              </ol>
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
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
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

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Letra da Música (LRC ou texto)</label>
                <textarea
                  rows={4}
                  value={editForm.lyrics}
                  onChange={(e) => setEditForm({ ...editForm, lyrics: e.target.value })}
                  placeholder="[00:05.00] Linha 1 da letra..."
                  className="w-full bg-[#181a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingTrack(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTrackEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYLIST CREATE / EDIT MODAL WITH TRACK SELECTOR */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f111d] border border-cyan-500/30 p-6 shadow-2xl relative text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {playlistForm.id ? 'Editar Playlist' : 'Criar Nova Playlist'}
              </h3>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                        playlistForm.accentColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {playlistForm.accentColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Track Selection in Playlist Modal */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Escolher músicas ({playlistForm.trackIds.length} selecionadas):
                  </label>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={playlistTrackSearch}
                    onChange={(e) => setPlaylistTrackSearch(e.target.value)}
                    placeholder="Filtrar músicas..."
                    className="w-full bg-[#181a29] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-800/40">
                  {filteredModalTracks.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-3 text-center">Nenhuma música encontrada.</p>
                  ) : (
                    filteredModalTracks.map((t) => {
                      const isChecked = playlistForm.trackIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleModalTrack(t.id)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition ${
                            isChecked ? 'bg-cyan-950/30 text-cyan-300' : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition ${
                              isChecked ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs truncate flex-1">{t.title}</span>
                          <span className="text-[10px] text-slate-500 truncate">{t.artist}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlaylist}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition cursor-pointer"
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
