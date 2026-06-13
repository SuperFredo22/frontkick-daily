import { useState, useEffect, lazy, Suspense } from 'react';
import './index.css';
import BottomNav from './components/BottomNav';
import PinLock, { isUnlocked } from './components/PinLock';
import SettingsModal from './components/SettingsModal';
import { syncBackup, syncBackupOnHide } from './utils/autoBackup';
import { applyTheme, watchSystemTheme } from './utils/theme';

// Code-splitting : recharts (Stats) et dnd-kit (Banques) ne sont chargés
// que si l'onglet est ouvert — premier chargement bien plus léger.
const Aujourdhui = lazy(() => import('./pages/Aujourdhui'));
const Agenda     = lazy(() => import('./pages/Agenda'));
const Stats      = lazy(() => import('./pages/Stats'));
const Banques    = lazy(() => import('./pages/Banques'));
const Coach      = lazy(() => import('./pages/Coach'));

const PAGES = ['today', 'agenda', 'stats', 'coach', 'banques'];

// Deep links des notifications push : /?page=coach&bilan=hebdo, /?page=today&open=sport…
// Lus une seule fois au démarrage puis retirés de l'URL.
function readBootParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const page  = params.get('page');
    const boot = {
      page:  PAGES.includes(page) ? page : 'today',
      open:  params.get('open'),
      bilan: params.get('bilan'),
    };
    if (page || boot.open || boot.bilan) window.history.replaceState({}, '', '/');
    return boot;
  } catch {
    return { page: 'today', open: null, bilan: null };
  }
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>Chargement…</span>
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const [boot] = useState(readBootParams);
  const [page, setPage] = useState(boot.page);
  const [pendingCompose, setPendingCompose] = useState(
    boot.open ? boot.open : boot.bilan === 'hebdo' ? 'bilan-hebdo' : null
  );
  const [showSettings, setShowSettings] = useState(false);

  // Thème clair/sombre
  useEffect(() => {
    applyTheme();
    return watchSystemTheme();
  }, []);

  // Sauvegarde auto (opt-in) : au lancement, toutes les 15 min, et à la mise
  // en arrière-plan (sendBeacon)
  useEffect(() => {
    if (!unlocked) return;
    syncBackup();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') syncBackupOnHide();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(() => syncBackup(), 15 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [unlocked]);

  if (!unlocked) {
    return <PinLock onUnlocked={() => setUnlocked(true)} />;
  }

  const handleCompose = (action) => {
    if (['tiktok', 'fightfocus', 'marque', 'projets'].includes(action)) {
      setPage('banques');
    } else if (action === 'agenda') {
      setPage('agenda');
    } else if (action === 'bonus') {
      setPage('today');
    }
    setPendingCompose(action);
  };

  const clearPending = () => setPendingCompose(null);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <main className="flex-1 overflow-hidden min-h-0" style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}>
        <Suspense fallback={<PageFallback />}>
          {page === 'today'   && <div className="h-full overflow-auto"><Aujourdhui pendingCompose={pendingCompose} onPendingConsumed={clearPending} onOpenSettings={() => setShowSettings(true)} /></div>}
          {page === 'agenda'  && <Agenda pendingCompose={pendingCompose} onPendingConsumed={clearPending} />}
          {page === 'stats'   && <div className="h-full overflow-auto"><Stats /></div>}
          {page === 'coach'   && <div className="h-full overflow-hidden flex flex-col"><Coach pendingCompose={pendingCompose} onPendingConsumed={clearPending} /></div>}
          {page === 'banques' && <Banques pendingCompose={pendingCompose} onPendingConsumed={clearPending} />}
        </Suspense>
      </main>
      <BottomNav current={page} onChange={setPage} onCompose={handleCompose} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
