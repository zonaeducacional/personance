import React from 'react';
import { Menu, UploadCloud, Sliders, Sparkles, Keyboard } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { RippleLogo } from './RippleLogo';
import { ViewTab } from '../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenFX: () => void;
  onOpenKeyboardHelp?: () => void;
  onNavigateToAdmin: () => void;
  currentTab: ViewTab;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenFX,
  onOpenKeyboardHelp,
  onNavigateToAdmin,
  currentTab,
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#080911]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-30 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center p-0.5">
            <div className="w-full h-full bg-[#0a0b13] rounded-[6px] flex items-center justify-center">
              <RippleLogo size={16} className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="text-xs font-bold text-white tracking-wider">RESØNANCE</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sistema de Áudio Independente • 100% Local no Navegador</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Keyboard Shortcuts Button */}
        {onOpenKeyboardHelp && (
          <button
            onClick={onOpenKeyboardHelp}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition hidden sm:flex items-center gap-1.5 text-xs font-medium"
            title="Atalhos do Teclado (Espaço, Setas, Teclas de Mídia)"
          >
            <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Atalhos</span>
          </button>
        )}

        {/* Audio FX Button */}
        <button
          onClick={onOpenFX}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition flex items-center gap-1.5 text-xs font-medium"
          title="Equalizador & Efeitos Sonoros"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Equalizador / FX</span>
        </button>

        {/* Quick Admin Studio Button */}
        <button
          onClick={onNavigateToAdmin}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
            currentTab === 'admin'
              ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
              : 'bg-[#121526] text-cyan-300 border-cyan-500/30 hover:bg-[#191d35]'
          }`}
          title="Abrir Área Admin & Upload"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Estúdio Admin</span>
        </button>
      </div>
    </header>
  );
};
