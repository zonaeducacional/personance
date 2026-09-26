import React from 'react';
import {
  Compass,
  Music,
  ListMusic,
  Heart,
  Sliders,
  UploadCloud,
  Sparkles,
  Plus,
  Disc,
} from 'lucide-react';
import { ViewTab, Playlist } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
  onOpenNewPlaylist: () => void;
  onOpenFX: () => void;
  favoritesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onOpenNewPlaylist,
  onOpenFX,
  favoritesCount,
}) => {
  return (
    <aside className="w-64 bg-[#0a0b13] border-r border-slate-800/80 flex flex-col justify-between p-4 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0a0b13] rounded-[10px] flex items-center justify-center">
              <Disc className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider text-white">
              RESØNANCE
            </h1>
            <span className="text-[10px] font-mono text-cyan-400 tracking-widest block uppercase">
              Sistema de Áudio • PWA
            </span>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => onSelectTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
              currentTab === 'home'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Início / Explorar</span>
          </button>

          <button
            onClick={() => onSelectTab('tracks')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
              currentTab === 'tracks'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Músicas</span>
          </button>

          <button
            onClick={() => onSelectTab('playlists')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
              currentTab === 'playlists' || currentTab === 'playlist-detail'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            <span>Playlists</span>
          </button>

          <button
            onClick={() => onSelectTab('favorites')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
              currentTab === 'favorites'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Favoritas</span>
            </div>
            {favoritesCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
                {favoritesCount}
              </span>
            )}
          </button>
        </div>

        {/* Admin Studio Dedicated Action */}
        <div className="my-5 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => onSelectTab('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
              currentTab === 'admin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20'
                : 'bg-[#121526] text-cyan-300 border border-cyan-500/30 hover:bg-[#181c33] hover:border-cyan-400/50'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <div className="text-left flex-1">
              <div>Área Admin & MP3</div>
              <div className="text-[9px] font-normal text-cyan-200/80">Upload & Gerenciamento</div>
            </div>
          </button>
        </div>

        {/* Playlists Quick List */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Minhas Playlists
            </span>
            <button
              onClick={onOpenNewPlaylist}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Nova Playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {playlists.length === 0 ? (
              <p className="text-[11px] text-slate-600 px-2 py-1">Nenhuma playlist ainda</p>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs truncate transition flex items-center gap-2 ${
                    selectedPlaylistId === pl.id && currentTab === 'playlist-detail'
                      ? 'text-cyan-300 bg-slate-800/70 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pl.accentColor || '#06b6d4' }}
                  />
                  <span className="truncate">{pl.title}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls: Audio FX & PWA Install */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <button
          onClick={onOpenFX}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 transition"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Equalizador & Efeitos</span>
          </div>
          <Sparkles className="w-3 h-3 text-cyan-400" />
        </button>

        {/* In-App PWA Install Prompt Button */}
        <div className="flex justify-center">
          <PWAInstallButton />
        </div>
      </div>
    </aside>
  );
};
