import { Component } from 'react';
import { exportAllData } from '../utils/backup';

// Sans ErrorBoundary, la moindre erreur de rendu = écran blanc total,
// d'autant plus déroutant que le service worker sert l'app depuis le cache.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--bg, #FAFAFA)', zIndex: 9999 }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>😵</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink, #0F172A)', marginBottom: 8 }}>
          Oups, l'app a planté
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3, #94A3B8)', marginBottom: 4, maxWidth: 320 }}>
          Tes données sont intactes. Recharge l'app — et si le problème persiste,
          exporte une sauvegarde avant toute manipulation.
        </p>
        <p style={{ fontSize: 11, color: 'var(--ink-3, #94A3B8)', marginBottom: 24, fontFamily: 'monospace', maxWidth: 320, wordBreak: 'break-word' }}>
          {String(this.state.error?.message || this.state.error)}
        </p>
        <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 280 }}>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'var(--red, #C0392B)' }}
          >
            Recharger l'app
          </button>
          <button
            onClick={() => exportAllData()}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--surface, #fff)', color: 'var(--ink-2, #475569)', border: '1px solid var(--line, #EEF0F3)' }}
          >
            💾 Exporter mes données
          </button>
        </div>
      </div>
    );
  }
}
