import { useState } from 'react';
import './index.css';
import BottomNav from './components/BottomNav';
import Aujourdhui from './pages/Aujourdhui';
import Agenda from './pages/Agenda';
import Stats from './pages/Stats';
import Banques from './pages/Banques';

export default function App() {
  const [page, setPage] = useState('today');
  const [pendingCompose, setPendingCompose] = useState(null);

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
      <main className="flex-1 overflow-hidden min-h-0">
        {page === 'today'   && <div className="h-full overflow-auto"><Aujourdhui pendingCompose={pendingCompose} onPendingConsumed={clearPending} /></div>}
        {page === 'agenda'  && <Agenda pendingCompose={pendingCompose} onPendingConsumed={clearPending} />}
        {page === 'stats'   && <div className="h-full overflow-auto"><Stats /></div>}
        {page === 'banques' && <Banques pendingCompose={pendingCompose} onPendingConsumed={clearPending} />}
      </main>
      <BottomNav current={page} onChange={setPage} onCompose={handleCompose} />
    </div>
  );
}
