import React from 'react';
import { Keyboard, X, Play, SkipForward, SkipBack, Volume2, FastForward, Rewind } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      key: 'Espaço',
      description: 'Reproduzir / Pausar faixa atual',
      icon: Play,
    },
    {
      key: '←  /  →',
      description: 'Retroceder / Avançar 5 segundos',
      detail: '(Segure Shift para 10 segundos)',
      icon: Rewind,
    },
    {
      key: '↑  /  ↓',
      description: 'Aumentar / Diminuir volume (±5%)',
      icon: Volume2,
    },
    {
      key: 'M',
      description: 'Ativar / Desativar modo mudo',
      icon: Volume2,
    },
    {
      key: 'Teclas de Mídia',
      description: 'Play/Pause, Próxima e Anterior (hardware/fone/lockscreen)',
      icon: FastForward,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0e101c] border border-cyan-500/30 p-6 shadow-2xl relative text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Atalhos do Teclado & Mídia</h3>
              <p className="text-[11px] text-slate-400">Controles rápidos via teclado e MediaSession API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {shortcuts.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#141624] border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{sc.description}</div>
                    {sc.detail && <div className="text-[10px] text-slate-400">{sc.detail}</div>}
                  </div>
                </div>
                <kbd className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-cyan-300 shadow-inner">
                  {sc.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
