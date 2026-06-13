import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { computeStreak, getMonthStats, getLast30DaysStats, getCigaretteFreeDays, getJournalForDate, getSportMonthStats, computeSportStreak, getSportLast30Days, getHeatmapData } from '../utils/stats';
import Card from '../components/Card';
import Modal from '../components/Modal';

// Heatmap type GitHub : 1 colonne par semaine, 1 case par jour (lun → dim)
const HEAT_COLORS = ['var(--line-2)', '#F4C7C0', '#E89A8E', '#D4675A', '#C0392B'];

function Heatmap({ days, onSelect }) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return (
    <div>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 flex-1">
            {week.map(d => (
              <button
                key={d.date}
                onClick={() => onSelect(d.date)}
                title={`${d.date} — ${d.count} activité${d.count > 1 ? 's' : ''}`}
                style={{ aspectRatio: '1 / 1', width: '100%', borderRadius: 3, background: HEAT_COLORS[d.level], border: 'none', padding: 0 }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[9px] text-gray-400">Moins</span>
        {HEAT_COLORS.map((c, i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />
        ))}
        <span className="text-[9px] text-gray-400">Plus</span>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, color }) {
  return (
    <div className="flex-1 bg-white rounded-card shadow-card p-3 text-center">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs font-medium text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Stats() {
  const [streak, setStreak] = useState(0);
  const [monthStats, setMonthStats] = useState({ tiktok: 0, fightfocus: 0, marque: 0, projets: {} });
  const [daily, setDaily] = useState([]);
  const [cigFree, setCigFree] = useState(0);
  const [detailDate, setDetailDate] = useState(null);
  const [detailJournal, setDetailJournal] = useState(null);
  const [sportMonth, setSportMonth] = useState({ club: 0, gym: 0, maison: 0, autre: 0, total: 0, totalDuree: 0, topType: null });
  const [sportStreak, setSportStreak] = useState(0);
  const [sportDaily, setSportDaily] = useState([]);
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    setStreak(computeStreak());
    setMonthStats(getMonthStats());
    setDaily(getLast30DaysStats());
    setCigFree(getCigaretteFreeDays());
    setSportMonth(getSportMonthStats());
    setSportStreak(computeSportStreak());
    setSportDaily(getSportLast30Days());
    setHeatmap(getHeatmapData(12));
  }, []);

  const openDetail = (dateStr) => {
    setDetailDate(dateStr);
    setDetailJournal(getJournalForDate(dateStr));
  };

  const handleBarClick = (data) => {
    if (!data?.activePayload?.[0]?.payload?.date) return;
    const dateStr = data.activePayload[0].payload.date;
    setDetailDate(dateStr);
    setDetailJournal(getJournalForDate(dateStr));
  };

  const chartData = daily.map(d => ({ ...d, name: d.date.slice(5) }));
  const sportChartData = sportDaily.map(d => ({ ...d, name: d.date.slice(5) }));
  const projetEntries = Object.entries(monthStats.projets || {});

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-nav">
      <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>

      {/* Streak */}
      <Card className="flex items-center gap-3">
        <div className="text-4xl">🔥</div>
        <div>
          <div className="text-3xl font-bold" style={{ color: 'var(--red)' }}>{streak}</div>
          <div className="text-sm text-gray-500">jours consécutifs avec au moins 1 tâche</div>
        </div>
      </Card>

      {/* Heatmap 12 semaines */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Activité — 12 dernières semaines
        </h2>
        <Card className="p-3">
          <Heatmap days={heatmap} onSelect={openDetail} />
          <p className="text-[10px] text-gray-400 text-center mt-2">Tâches + sport par jour · toucher une case pour le détail</p>
        </Card>
      </section>

      {/* Monthly stats */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ce mois-ci</h2>
        <div className="flex gap-2">
          <StatBox label="Vidéos" value={monthStats.tiktok} color="#C0392B" sub="publiées" />
          <StatBox label="FightFocus" value={monthStats.fightfocus} color="var(--cyan)" sub="tâches" />
          <StatBox label="Marque" value={monthStats.marque} color="var(--orange)" sub="actions" />
        </div>

        {/* Project stats */}
        {projetEntries.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {projetEntries.map(([id, { count, nom }]) => (
              <div key={id} className="bg-white rounded-card shadow-card px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">📁 {nom}</span>
                <div className="text-right">
                  <span className="text-lg font-bold" style={{ color: '#8E44AD' }}>{count}</span>
                  <span className="text-xs text-gray-400 ml-1">tâche{count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prières 30 jours */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Prières — 30 derniers jours
        </h2>
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--ink-3)' }} tickLine={false} interval={6} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(v) => [v, 'Prières']} />
              <Bar dataKey="prieres" fill="#C0392B" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Cigarettes */}
      <Card className="flex items-center gap-3">
        <div className="text-3xl">🚭</div>
        <div>
          <div className="text-2xl font-bold text-green-500">{cigFree}</div>
          <div className="text-sm text-gray-500">jours sans cigarette sur les 30 derniers</div>
        </div>
      </Card>

      {/* Cigarettes 30 jours */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Cigarettes — 30 derniers jours
        </h2>
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--ink-3)' }} tickLine={false} interval={6} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(v) => [v, 'Cigarettes']} />
              <Bar dataKey="cigarettes" fill="var(--orange)" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Sport ce mois-ci */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sport ce mois-ci</h2>
        <div className="flex gap-2 mb-2">
          <StatBox label="Séances" value={sportMonth.total} color="var(--green)" />
          <StatBox label="Minutes" value={sportMonth.totalDuree} color="var(--green)" sub="total" />
          <StatBox label="Streak" value={sportStreak} color="var(--green)" sub="jours" />
        </div>
        {sportMonth.total > 0 && (
          <div className="flex gap-2">
            {sportMonth.club > 0 && (
              <div className="flex-1 bg-white rounded-card shadow-card px-3 py-2 text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--green)' }}>{sportMonth.club}</div>
                <div className="text-[10px] text-gray-500">🥊 Club</div>
              </div>
            )}
            {sportMonth.gym > 0 && (
              <div className="flex-1 bg-white rounded-card shadow-card px-3 py-2 text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--green)' }}>{sportMonth.gym}</div>
                <div className="text-[10px] text-gray-500">🏋️ Gym</div>
              </div>
            )}
            {sportMonth.maison > 0 && (
              <div className="flex-1 bg-white rounded-card shadow-card px-3 py-2 text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--green)' }}>{sportMonth.maison}</div>
                <div className="text-[10px] text-gray-500">🏠 Maison</div>
              </div>
            )}
            {sportMonth.autre > 0 && (
              <div className="flex-1 bg-white rounded-card shadow-card px-3 py-2 text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--green)' }}>{sportMonth.autre}</div>
                <div className="text-[10px] text-gray-500">✅ Autre</div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Sport 30 jours */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Sport — 30 derniers jours
        </h2>
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={sportChartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--ink-3)' }} tickLine={false} interval={6} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(v, name, props) => [
                  props.payload.did ? (props.payload.duree ? `${props.payload.duree} min` : 'Oui') : 'Non',
                  'Sport',
                ]} />
              <Bar dataKey="did" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {sportChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.did ? 'var(--green)' : 'var(--line)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Activité globale */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Activité globale — 30 jours
        </h2>
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData} onClick={handleBarClick} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--ink-3)' }} tickLine={false} interval={6} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(v) => [v, 'Tâches']} />
              <Line type="monotone" dataKey="tachesFaites" stroke="#C0392B" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 text-center mt-1">Cliquer sur un point pour voir le détail</p>
        </Card>
      </section>

      {/* Detail modal */}
      <Modal
        open={!!detailDate}
        onClose={() => { setDetailDate(null); setDetailJournal(null); }}
        title={detailDate ? new Date(detailDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        footer={
          <button onClick={() => { setDetailDate(null); setDetailJournal(null); }}
            className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
            Fermer
          </button>
        }
      >
        {detailJournal ? (
          <div className="flex flex-col gap-3">
            {detailJournal.taches?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Tâches</p>
                {detailJournal.taches.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <span className="text-sm">{t.statut === 'fait' ? '✅' : '🔄'}</span>
                    <span className="text-sm text-gray-700 leading-snug">{t.label}</span>
                  </div>
                ))}
              </div>
            )}
            {detailJournal.habitudes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Habitudes</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>🙏 {detailJournal.habitudes.prieres || 0}</span>
                  <span>{detailJournal.habitudes.sport ? '🥊 ✓' : '🥊 —'}</span>
                  <span>🚬 {detailJournal.habitudes.cigarettes || 0}</span>
                </div>
                {detailJournal.habitudes.note && (
                  <p className="text-sm text-gray-600 mt-2 italic">{detailJournal.habitudes.note}</p>
                )}
              </div>
            )}
            {(!detailJournal.taches?.length && !detailJournal.habitudes) && (
              <p className="text-sm text-gray-400 italic">Aucune donnée pour cette journée.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Aucune donnée pour cette journée.</p>
        )}
      </Modal>
    </div>
  );
}
