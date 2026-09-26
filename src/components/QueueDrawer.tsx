import React from 'react';
import { X, Play, Trash2, ListMusic, Music } from 'lucide-react';
import { Track } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrackId?: string;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  currentTrackId,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#0d0f1a] border-l border-cyan-500/20 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ListMusic className="w-4 h-4 text-cyan-400" />
          <span>Fila de Reprodução ({queue.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition"
            >
              Limpar
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">A fila de reprodução está vazia.</p>
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = track.id === currentTrackId;
            return (
              <div
                key={`${track.id}-${idx}`}
                className={`flex items-center justify-between p-2.5 rounded-xl transition group ${
                  isCurrent
                    ? 'bg-cyan-950/40 border border-cyan-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80'
                }`}
              >
                <div
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Music className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pr-2">
                    <h5
                      className={`text-xs font-semibold truncate ${
                        isCurrent ? 'text-cyan-400' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onRemoveFromQueue(idx)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                    title="Remover da fila"
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
  );
};
