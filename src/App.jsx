import { useState, useCallback, lazy, Suspense } from 'react';
import './index.css';
import BottomNav from './components/BottomNav';
import Aujourdhui from './pages/Aujourdhui';
import PinLock from './components/PinLock';
import { isUnlocked } from './utils/pinLock';
import SettingsModal from './components/SettingsModal';

// Pages secondaires chargées à la demande : Stats (recharts) et Agenda
// (dnd-kit) pèsent lourd — les sortir du bundle initial accélère le
// démarrage, « Aujourd'hui » restant la page d'atterrissage.
const Agenda  = lazy(() => import('./pages/Agenda'));
const Stats   = lazy(() => import('./pages/Stats'));
const Banques = lazy(() => import('./pages/Banques'));
const Coach   = lazy(() => import('./pages/Coach'));

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center">
      <span className="text-sm" style={{ color: 'var(--ink-3)' }}>Chargement…</span>
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const [page, setPage] = useState('today');
  const [pendingCompose, setPendingCompose] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Stable identity so child effects can list it as a dependency safely.
  // Declared before the early return so hook order stays constant.
  const clearPending = useCallback(() => setPendingCompose(null), []);

  if (!unlocked) {
    return <PinLock onUnlocked={() => setUnlocked(true)} />;
  }

  const handleCompose = (action) => {
    if (['tiktok', 'fightfocus', 'marque', 'projets'].includes(action)) {
      setPage('banques');
    } else if (action === 'agenda') {
      setPage('agenda');
    } else if (action === 'bonus' || action === 'video_tournee') {
      setPage('today');
    }
    setPendingCompose(action);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <main className="flex-1 overflow-hidden min-h-0" style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}>
        <Suspense fallback={<PageLoader />}>
          {page === 'today'   && <div className="h-full overflow-auto"><Aujourdhui pendingCompose={pendingCompose} onPendingConsumed={clearPending} onOpenSettings={() => setShowSettings(true)} onNavigate={setPage} /></div>}
          {page === 'agenda'  && <Agenda pendingCompose={pendingCompose} onPendingConsumed={clearPending} />}
          {page === 'stats'   && <div className="h-full overflow-auto"><Stats /></div>}
          {page === 'coach'   && <div className="h-full overflow-hidden flex flex-col"><Coach /></div>}
          {page === 'banques' && <Banques pendingCompose={pendingCompose} onPendingConsumed={clearPending} />}
        </Suspense>
      </main>
      <BottomNav current={page} onChange={setPage} onCompose={handleCompose} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
