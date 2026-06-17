import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useTikTok, useFightFocus, useMarque } from '../hooks/useBanques';
import { useProjets } from '../hooks/useProjets';
import BanqueList from '../components/banques/BanqueList';
import ProjetsList from '../components/banques/ProjetsList';
import { TABS } from '../data/banqueTabs';

// ─── Main Banques page ────────────────────────────────────────────────────────

export default function Banques({ pendingCompose, onPendingConsumed }) {
  const [activeTab, setActiveTab] = useState('tiktok');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tiktok, setTiktok] = useTikTok();
  const [fightfocus, setFightFocus] = useFightFocus();
  const [marque, setMarque] = useMarque();
  const [projets, setProjets] = useProjets();

  // One-shot compose command from the parent (FAB): switch to the right tab.
  // setState-in-effect is intentional (it's the command's side effect); the
  // command is consumed immediately so the effect doesn't loop.
  useEffect(() => {
    if (!pendingCompose) return;
    if (['tiktok', 'fightfocus', 'marque', 'projets'].includes(pendingCompose)) {
      setActiveTab(pendingCompose); // eslint-disable-line react-hooks/set-state-in-effect
      setFilterStatus('all');
      onPendingConsumed?.();
    }
  }, [pendingCompose, onPendingConsumed]);

  const setters = { tiktok: setTiktok, fightfocus: setFightFocus, marque: setMarque };
  const data = { tiktok, fightfocus, marque };

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  const filterOptions = activeTab === 'tiktok'
    ? [{ id: 'all', label: 'Toutes' }, { id: 'a_tourner', label: 'À tourner' }, { id: 'publiee', label: 'Publiées' }]
    : activeTab === 'projets'
    ? []
    : [{ id: 'all', label: 'Toutes' }, { id: 'a_faire', label: 'À faire' }, { id: 'fait', label: 'Faites' }];

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2 shadow-card" style={{ background: 'var(--surface)' }}>
          <Search size={15} color="var(--ink-3)" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--ink)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs leading-none" style={{ color: 'var(--ink-3)' }}>✕</button>
          )}
        </div>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setFilterStatus('all'); setSearchQuery(''); }}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold btn-press transition-colors"
            style={activeTab === t.id
              ? { background: t.color, color: 'white' }
              : { background: 'var(--line-2)', color: 'var(--ink-2)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      {filterOptions.length > 0 && (
        <div className="flex gap-2 items-center px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium btn-press"
              style={filterStatus === f.id
                ? { background: activeTabConfig?.color, color: 'white' }
                : { background: 'var(--line-2)', color: 'var(--ink-2)' }}
            >
              {f.label}
            </button>
          ))}
          <button
            className="ml-auto flex items-center gap-1 flex-shrink-0 btn-press"
            style={{ fontSize: 12, color: 'var(--ink-3)' }}
          >
            <SlidersHorizontal size={12} />
            Trier
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto px-4 pt-1 pb-nav" style={{ background: 'var(--bg)' }}>
        {activeTab !== 'projets' ? (
          <BanqueList
            key={activeTab}
            banque={activeTab}
            items={data[activeTab]}
            setItems={setters[activeTab]}
            searchQuery={searchQuery}
            filterStatus={filterStatus}
          />
        ) : (
          <ProjetsList projets={projets} setProjets={setProjets} />
        )}
      </div>
    </div>
  );
}
