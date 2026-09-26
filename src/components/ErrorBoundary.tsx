import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if (window.indexedDB) {
        window.indexedDB.deleteDatabase('resonance_music_db');
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.error('Erro ao resetar armazenamento:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#08090f] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#0f111a] border border-red-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-red-950/20 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Recuperação do Sistema Resonance
                </h1>
                <p className="text-xs text-red-300/80 font-mono mt-0.5">
                  Proteção contra tela branca ativada
                </p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Ocorreu um erro inesperado ao inicializar a interface de áudio. Isso pode acontecer devido a dados locais incompatíveis ou restrições de armazenamento do navegador.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3.5 bg-black/60 rounded-xl border border-white/5 font-mono text-xs text-red-300/90 overflow-x-auto max-h-36">
                <div className="font-semibold text-red-400 mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <div className="text-[11px] text-slate-400 opacity-80 whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-cyan-900/30 cursor-pointer active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Aplicativo
              </button>

              <button
                onClick={this.handleResetStorage}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/25 text-sm font-medium rounded-xl transition cursor-pointer active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Cache e Reiniciar
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400">
              <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Dica: Caso use GitHub Pages, verifique se a publicação aponta para o diretório de build <code>dist/</code>.</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
