import { useState } from 'react';
import './index.css';
import BottomNav from './components/BottomNav';
import Aujourdhui from './pages/Aujourdhui';
import Agenda from './pages/Agenda';
import Stats from './pages/Stats';
import Banques from './pages/Banques';

export default function App() {
  const [page, setPage] = useState('today');

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <main className="flex-1 overflow-hidden min-h-0">
        {page === 'today' && <div className="h-full overflow-auto"><Aujourdhui /></div>}
        {page === 'agenda' && <Agenda />}
        {page === 'stats' && <div className="h-full overflow-auto"><Stats /></div>}
        {page === 'banques' && <Banques />}
      </main>
      <BottomNav current={page} onChange={setPage} />
    </div>
  );
}
