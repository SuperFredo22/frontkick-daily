export default function BottomNav({ current, onChange }) {
  const tabs = [
    { id: 'today', label: "Aujourd'hui", icon: '☀️' },
    { id: 'agenda', label: 'Agenda', icon: '📅' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'banques', label: 'Banques', icon: '🗂️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', maxWidth: 480, margin: '0 auto' }}>
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
              current === tab.id ? 'text-red-kick' : 'text-gray-400'
            }`}
            style={{ color: current === tab.id ? 'var(--red)' : 'var(--ink-3)' }}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
