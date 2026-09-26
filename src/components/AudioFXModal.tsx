import React from 'react';
import { Sliders, Zap, Gauge, Eye, Clock, X, RotateCcw } from 'lucide-react';
import { EqualizerSettings, VisualizerMode } from '../types';

interface AudioFXModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EqualizerSettings;
  onUpdateSettings: (newSettings: EqualizerSettings) => void;
  visualizerMode: VisualizerMode;
  onUpdateVisualizerMode: (mode: VisualizerMode) => void;
  sleepTimerMinutes: number | null;
  onSetSleepTimer: (minutes: number | null) => void;
}

export const AudioFXModal: React.FC<AudioFXModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  visualizerMode,
  onUpdateVisualizerMode,
  sleepTimerMinutes,
  onSetSleepTimer,
}) => {
  if (!isOpen) return null;

  const handleBassChange = (val: number) => {
    onUpdateSettings({ ...settings, bass: val });
  };

  const handleMidChange = (val: number) => {
    onUpdateSettings({ ...settings, mid: val });
  };

  const handleTrebleChange = (val: number) => {
    onUpdateSettings({ ...settings, treble: val });
  };

  const toggleBassBoost = () => {
    onUpdateSettings({ ...settings, bassBoost: !settings.bassBoost });
  };

  const handleSpeedChange = (speed: number) => {
    onUpdateSettings({ ...settings, playbackRate: speed });
  };

  const handleReset = () => {
    onUpdateSettings({
      bass: 0,
      mid: 0,
      treble: 0,
      bassBoost: false,
      stereoExpander: false,
      playbackRate: 1.0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#0e101a] border border-cyan-500/20 p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Equalizador & Efeitos Sonoros</h2>
              <p className="text-xs text-slate-400">Equalizador de áudio, reforço de graves e temporizador</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition text-xs flex items-center gap-1"
              title="Resetar equalizador para neutro"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resetar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* 3-Band Equalizer Sliders */}
          <div className="rounded-xl bg-[#141624] border border-slate-800/80 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Equalizador Paramétrico
              </span>
              <span className="text-[11px] font-mono text-cyan-400">Processamento Web Audio</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Bass */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-slate-300 mb-2">Grave</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={settings.bass}
                  onChange={(e) => handleBassChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-cyan-400"
                />
                <span className="text-[11px] font-mono text-slate-400 mt-2">
                  {settings.bass > 0 ? `+${settings.bass}` : settings.bass} dB
                </span>
                <span className="text-[10px] text-slate-500">100 Hz</span>
              </div>

              {/* Mid */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-slate-300 mb-2">Médio</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={settings.mid}
                  onChange={(e) => handleMidChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-cyan-400"
                />
                <span className="text-[11px] font-mono text-slate-400 mt-2">
                  {settings.mid > 0 ? `+${settings.mid}` : settings.mid} dB
                </span>
                <span className="text-[10px] text-slate-500">1.2 kHz</span>
              </div>

              {/* Treble */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-slate-300 mb-2">Agudo</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={settings.treble}
                  onChange={(e) => handleTrebleChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-cyan-400"
                />
                <span className="text-[11px] font-mono text-slate-400 mt-2">
                  {settings.treble > 0 ? `+${settings.treble}` : settings.treble} dB
                </span>
                <span className="text-[10px] text-slate-500">6.0 kHz</span>
              </div>
            </div>

            {/* Bass Boost Toggle */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${settings.bassBoost ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-semibold text-white">Reforço Sub-Grave (+7dB)</div>
                  <div className="text-[10px] text-slate-400">Realce de frequências sub-graves</div>
                </div>
              </div>
              <button
                onClick={toggleBassBoost}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.bassBoost ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.bassBoost ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Playback Speed */}
          <div className="rounded-xl bg-[#141624] border border-slate-800/80 p-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Velocidade de Reprodução</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[0.75, 0.9, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                    settings.playbackRate === spd
                      ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Visualizer Mode */}
          <div className="rounded-xl bg-[#141624] border border-slate-800/80 p-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Modo do Visualizador</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'bars', label: 'Barras' },
                { id: 'wave', label: 'Onda' },
                { id: 'radial', label: 'Radial' },
                { id: 'aura', label: 'Aura' },
                { id: 'off', label: 'Oculto' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdateVisualizerMode(m.id as VisualizerMode)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium transition text-center ${
                    visualizerMode === m.id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Timer */}
          <div className="rounded-xl bg-[#141624] border border-slate-800/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Temporizador de Sono (Sleep Timer)</span>
              </div>
              {sleepTimerMinutes !== null && (
                <span className="text-[11px] font-mono text-emerald-400 font-semibold animate-pulse">
                  Ativo ({sleepTimerMinutes}m)
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Desligado', val: null },
                { label: '15 min', val: 15 },
                { label: '30 min', val: 30 },
                { label: '45 min', val: 45 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => onSetSleepTimer(item.val)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition ${
                    sleepTimerMinutes === item.val
                      ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
