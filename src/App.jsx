import { useState } from 'react';
import './index.css';
import BottomNav from './components/BottomNav';
import Aujourdhui from './pages/Aujourdhui';
import Agenda from './pages/Agenda';
import Stats from './pages/Stats';
import Banques from './pages/Banques';
import Coach from './pages/Coach';
import PinLock, { isUnlocked } from './components/PinLock';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const [page, setPage] = useState('today');
  const [pendingCompose, setPendingCompose] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

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
        {page === 'today'   && <div className="h-full overflow-auto"><Aujourdhui pendingCompose={pendingCompose} onPendingConsumed={clearPending} onOpenSettings={() => setShowSettings(true)} /></div>}
        {page === 'agenda'  && <Agenda pendingCompose={pendingCompose} onPendingConsumed={clearPending} />}
        {page === 'stats'   && <div className="h-full overflow-auto"><Stats /></div>}
        {page === 'coach'   && <div className="h-full overflow-hidden flex flex-col"><Coach /></div>}
        {page === 'banques' && <Banques pendingCompose={pendingCompose} onPendingConsumed={clearPending} />}
      </main>
      <BottomNav current={page} onChange={setPage} onCompose={handleCompose} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
