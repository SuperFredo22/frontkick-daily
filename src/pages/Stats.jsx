import { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import {
  Flame, Trophy, Lock, Award,
  // Icônes des badges (utils/gamification BADGES) : import nommé plutôt que
  // namespace — `import * as Icons` embarquait les ~1000 icônes lucide dans
  // le bundle initial.
  Swords, Target, Crosshair, Shield, Dumbbell, Activity, Wind, Heart, Star, Crown,
} from 'lucide-react';

const BADGE_ICONS = { Swords, Target, Crosshair, Flame, Shield, Dumbbell, Activity, Wind, Heart, Star, Crown };
import { getMonthStats, getLast30DaysStats, getCigaretteFreeDays, getJournalForDate, getSportMonthStats, computeSportStreak, getSportLast30Days } from '../utils/stats';
import { useProgression } from '../hooks/useProgression';
import { useCosmetics } from '../hooks/useCosmetics';
import { computeUnlocks } from '../utils/unlockables';
import { WEEKLY_TRAINING_GOAL } from '../utils/gamification';
import { Check, Lock as LockIcon, Palette, BadgeCheck } from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Jalons from '../components/Jalons';

function StatBox({ label, value, sub, color }) {
  return (
    <div className="flex-1 rounded-card p-3 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <div className="text-2xl font-bold font-display" style={{ color }}>{value}</div>
      <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--ink-2)' }}>{label}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{sub}</div>}
    </div>
  );
}

// ── Combatant progression hero ───────────────────────────────────────────────
function ProgressionHero({ prog }) {
  const { level, rank, intoLevel, levelSpan, toNext, progress, winStreak, bestStreak, totalXP } = prog;
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 22, padding: 20,
        background: 'var(--grad-surface)', border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div aria-hidden style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)' }} />
      <div className="flex items-center gap-4" style={{ position: 'relative' }}>
        <div
          className="flex flex-col items-center justify-center shrink-0"
          style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--grad-rank)', boxShadow: 'var(--glow-violet)' }}
        >
          <span className="font-display" style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em' }}>NIVEAU</span>
          <span className="font-display" style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{rank.name}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>{totalXP.toLocaleString('fr-FR')} XP au total</p>
          <div className="mt-2.5" style={{ position: 'relative', height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div className="xp-shimmer" style={{ position: 'absolute', inset: 0, width: `${Math.max(4, progress * 100)}%`, background: 'var(--grad-xp)', borderRadius: 6, transition: 'width 600ms ease' }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)' }}>{intoLevel}/{levelSpan} XP</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--orange)' }}>{toNext} XP → NV {level + 1}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4" style={{ position: 'relative' }}>
        <div className="flex-1 rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          <Flame size={18} className={winStreak > 0 ? 'flame-pulse' : ''} style={{ color: 'var(--orange)' }} />
          <div>
            <p className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{winStreak}</p>
            <p style={{ fontSize: 10, color: 'var(--ink-3)' }}>série en cours</p>
          </div>
        </div>
        <div className="flex-1 rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          <Trophy size={18} style={{ color: 'var(--violet)' }} />
          <div>
            <p className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{bestStreak}</p>
            <p style={{ fontSize: 10, color: 'var(--ink-3)' }}>record victoires</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Badge tile ────────────────────────────────────────────────────────────────
function BadgeTile({ badge }) {
  const Icon = BADGE_ICONS[badge.icon] || Award;
  return (
    <div
      className={`rounded-card p-3 flex flex-col items-center text-center ${badge.unlocked ? '' : 'badge-locked'}`}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${badge.unlocked ? badge.color : 'var(--line)'}`,
        boxShadow: badge.unlocked ? `0 0 18px -8px ${badge.color}` : 'none',
      }}
    >
      <div
        className="flex items-center justify-center mb-2"
        style={{ width: 42, height: 42, borderRadius: 12, background: badge.unlocked ? badge.color : 'var(--surface-2)' }}
      >
        {badge.unlocked
          ? <Icon size={20} color="#fff" strokeWidth={2.2} />
          : <Lock size={16} color="var(--ink-3)" />}
      </div>
      <p className="font-display" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15 }}>{badge.name}</p>
      <p style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.25 }}>{badge.desc}</p>
      {!badge.unlocked && (
        <div className="w-full mt-2" style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${badge.progress * 100}%`, background: badge.color, opacity: 0.8 }} />
        </div>
      )}
    </div>
  );
}

// ── Rewards (équipables) ──────────────────────────────────────────────────────
function ThemeCard({ theme, equipped, onEquip }) {
  return (
    <button
      onClick={() => theme.unlocked && onEquip(theme.id)}
      disabled={!theme.unlocked}
      className="rounded-card p-3 text-left btn-press"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${equipped ? 'var(--red)' : 'var(--line)'}`,
        boxShadow: equipped ? '0 0 18px -8px var(--red)' : 'none',
        opacity: theme.unlocked ? 1 : 0.55,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ width: 38, height: 24, borderRadius: 8, background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})` }} />
        <div className="flex-1 min-w-0">
          <p className="font-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{theme.name}</p>
        </div>
      </div>
      <p style={{ fontSize: 10.5, color: 'var(--ink-3)', lineHeight: 1.3, minHeight: 26 }}>{theme.desc}</p>
      <div className="mt-1.5">
        {!theme.unlocked ? (
          <span className="flex items-center gap-1" style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)' }}>
            <LockIcon size={11} /> Niveau {theme.unlockLevel}
          </span>
        ) : equipped ? (
          <span className="flex items-center gap-1" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--red)' }}>
            <Check size={12} /> Équipé
          </span>
        ) : (
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-2)' }}>Équiper</span>
        )}
      </div>
    </button>
  );
}

function TitleChip({ title, equipped, onEquip }) {
  return (
    <button
      onClick={() => title.unlocked && onEquip(title.id)}
      disabled={!title.unlocked}
      className="rounded-xl px-3 py-2 text-left btn-press flex items-center gap-2"
      style={{
        background: equipped ? 'var(--red-soft)' : 'var(--surface)',
        border: `1px solid ${equipped ? 'var(--red)' : 'var(--line)'}`,
        opacity: title.unlocked ? 1 : 0.5,
      }}
    >
      {title.unlocked
        ? <BadgeCheck size={15} style={{ color: equipped ? 'var(--red)' : 'var(--ink-3)' }} />
        : <LockIcon size={13} style={{ color: 'var(--ink-3)' }} />}
      <div className="min-w-0">
        <p className="font-display truncate" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{title.name}</p>
        <p className="truncate" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{title.unlocked ? (equipped ? 'Équipé' : 'Disponible') : title.desc}</p>
      </div>
    </button>
  );
}

function RewardsSection({ prog }) {
  const { themeId, titleId, equipTheme, equipTitle } = useCosmetics();
  const unlocks = computeUnlocks(prog);
  const themesUnlocked = unlocks.themes.filter(t => t.unlocked).length;
  const titlesUnlocked = unlocks.titles.filter(t => t.unlocked).length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--ink-3)' }}>
          <Palette size={13} /> Récompenses
        </h2>
        <span className="text-xs font-semibold" style={{ color: 'var(--red)' }}>{themesUnlocked + titlesUnlocked}/{unlocks.themes.length + unlocks.titles.length}</span>
      </div>

      <p className="text-xs mb-2" style={{ color: 'var(--ink-3)' }}>Thèmes d'accent — re-colorent toute l'app</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {unlocks.themes.map(t => (
          <ThemeCard key={t.id} theme={t} equipped={t.id === themeId} onEquip={equipTheme} />
        ))}
      </div>

      <p className="text-xs mb-2" style={{ color: 'var(--ink-3)' }}>Titres de combattant</p>
      <div className="grid grid-cols-2 gap-2">
        {unlocks.titles.map(t => (
          <TitleChip key={t.id} title={t} equipped={t.id === titleId} onEquip={equipTitle} />
        ))}
      </div>
    </section>
  );
}

export default function Stats() {
  const [prog] = useProgression();
  // Stats are derived from localStorage and computed once on mount via lazy
  // initialisers — no effect needed, and no flash of empty defaults.
  const [monthStats] = useState(getMonthStats);
  const [daily] = useState(getLast30DaysStats);
  const [cigFree] = useState(getCigaretteFreeDays);
  const [detailDate, setDetailDate] = useState(null);
  const [detailJournal, setDetailJournal] = useState(null);
  const [sportMonth] = useState(getSportMonthStats);
  const [sportStreak] = useState(computeSportStreak);
  const [sportDaily] = useState(getSportLast30Days);

  const handleBarClick = (data) => {
    if (!data?.activePayload?.[0]?.payload?.date) return;
    const dateStr = data.activePayload[0].payload.date;
    setDetailDate(dateStr);
    setDetailJournal(getJournalForDate(dateStr));
  };

  const chartData = daily.map(d => ({ ...d, name: d.date.slice(5) }));
  const sportChartData = sportDaily.map(d => ({ ...d, name: d.date.slice(5) }));
  const projetEntries = Object.entries(monthStats.projets || {});

  const tooltipStyle = { fontSize: 11, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', boxShadow: 'var(--shadow-lift)' };

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-nav">
      <h1 className="text-xl font-bold font-display" style={{ color: 'var(--ink)' }}>Progression</h1>

      {/* Combatant hero */}
      <ProgressionHero prog={prog} />

      {/* Objectifs & jalons */}
      <Jalons />

      {/* Badges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Badges</h2>
          <span className="text-xs font-semibold" style={{ color: 'var(--orange)' }}>{prog.badgesUnlocked}/{prog.badges.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {prog.badges.map(b => <BadgeTile key={b.id} badge={b} />)}
        </div>
      </section>

      {/* Récompenses équipables */}
      <RewardsSection prog={prog} />

      {/* Monthly stats */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>Ce mois-ci</h2>
        <div className="flex gap-2">
          <StatBox label="Vidéos" value={monthStats.tiktok} color="var(--red)" sub="publiées" />
          <StatBox label="FightFocus" value={monthStats.fightfocus} color="var(--cyan)" sub="missions" />
          <StatBox label="Marque" value={monthStats.marque} color="var(--orange)" sub="actions" />
        </div>

        {projetEntries.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {projetEntries.map(([id, { count, nom }]) => (
              <div key={id} className="rounded-card px-4 py-3 flex items-center justify-between" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>📁 {nom}</span>
                <div className="text-right">
                  <span className="text-lg font-bold font-display" style={{ color: 'var(--violet)' }}>{count}</span>
                  <span className="text-xs ml-1" style={{ color: 'var(--ink-3)' }}>mission{count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prières 30 jours */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>
          Prières — 30 derniers jours
        </h2>
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--ink-3)' }} tickLine={false} interval={6} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Prières']} />
              <Bar dataKey="prieres" fill="var(--violet)" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Cigarettes */}
      <Card className="flex items-center gap-3">
        <div className="text-3xl">🚭</div>
        <div>
          <div className="text-2xl font-bold font-display" style={{ color: 'var(--green)' }}>{cigFree}</div>
          <div className="text-sm" style={{ color: 'var(--ink-2)' }}>jours sans cigarette sur les 30 derniers</div>
        </div>
      </Card>

      {/* Objectif hebdo d'entraînement */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>Objectif d'entraînement — cette semaine</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold" style={{ fontSize: 16, color: 'var(--ink)' }}>
              {prog.weekTraining} / {WEEKLY_TRAINING_GOAL} séances
            </span>
            <span className="text-xs font-semibold" style={{ color: prog.weekTraining >= WEEKLY_TRAINING_GOAL ? 'var(--green)' : 'var(--cyan)' }}>
              {prog.weekTraining >= WEEKLY_TRAINING_GOAL ? '✓ Objectif atteint' : `${WEEKLY_TRAINING_GOAL - prog.weekTraining} restante${WEEKLY_TRAINING_GOAL - prog.weekTraining > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: WEEKLY_TRAINING_GOAL }).map((_, i) => (
              <div key={i} className="flex-1" style={{ height: 8, borderRadius: 4, background: i < prog.weekTraining ? 'var(--cyan)' : 'var(--surface-2)', border: '1px solid var(--line)' }} />
            ))}
          </div>
        </Card>
      </section>

      {/* Entraînement ce mois-ci */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>Entraînement ce mois-ci</h2>
        <div className="flex gap-2 mb-2">
          <StatBox label="Séances" value={sportMonth.total} color="var(--cyan)" />
          <StatBox label="Minutes" value={sportMonth.totalDuree} color="var(--cyan)" sub="total" />
          <StatBox label="Série" value={sportStreak} color="var(--cyan)" sub="jours" />
        </div>
        {sportMonth.total > 0 && (
          <div className="flex gap-2">
            {sportMonth.club > 0 && (
              <div className="flex-1 rounded-card px-3 py-2 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="text-lg font-bold font-display" style={{ color: 'var(--cyan)' }}>{sportMonth.club}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>🥊 Club</div>
              </div>
            )}
            {sportMonth.gym > 0 && (
              <div className="flex-1 rounded-card px-3 py-2 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="text-lg font-bold font-display" style={{ color: 'var(--cyan)' }}>{sportMonth.gym}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>🏋️ Gym</div>
              </div>
            )}
            {sportMonth.maison > 0 && (
              <div className="flex-1 rounded-card px-3 py-2 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="text-lg font-bold font-display" style={{ color: 'var(--cyan)' }}>{sportMonth.maison}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>🏠 Maison</div>
              </div>
            )}
            {sportMonth.autre > 0 && (
              <div className="flex-1 rounded-card px-3 py-2 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="text-lg font-bold font-display" style={{ color: 'var(--cyan)' }}>{sportMonth.autre}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>✅ Autre</div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Entraînement 30 jours */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>
          Entraînement — 30 derniers jours
        </h2>
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={sportChartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--ink-3)' }} tickLine={false} interval={6} />
              <Tooltip contentStyle={tooltipStyle}
                formatter={(v, name, props) => [
                  props.payload.did ? (props.payload.duree ? `${props.payload.duree} min` : 'Oui') : 'Non',
                  'Entraînement',
                ]} />
              <Bar dataKey="did" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {sportChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.did ? 'var(--cyan)' : 'var(--line)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Activité globale */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>
          Missions — 30 jours
        </h2>
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData} onClick={handleBarClick} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--ink-3)' }} tickLine={false} interval={6} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Missions']} />
              <Line type="monotone" dataKey="tachesFaites" stroke="var(--red)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-center mt-1" style={{ color: 'var(--ink-3)' }}>Touche un point pour voir le détail</p>
        </Card>
      </section>

      {/* Detail modal */}
      <Modal
        open={!!detailDate}
        onClose={() => { setDetailDate(null); setDetailJournal(null); }}
        title={detailDate ? new Date(detailDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        footer={
          <button onClick={() => { setDetailDate(null); setDetailJournal(null); }}
            className="w-full py-2.5 rounded-lg font-medium text-sm" style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
            Fermer
          </button>
        }
      >
        {detailJournal ? (
          <div className="flex flex-col gap-3">
            {detailJournal.taches?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink-3)' }}>Missions</p>
                {detailJournal.taches.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <span className="text-sm">{t.statut === 'fait' ? '✅' : '🔄'}</span>
                    <span className="text-sm leading-snug" style={{ color: 'var(--ink-2)' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            )}
            {detailJournal.habitudes && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink-3)' }}>Entraînement</p>
                <div className="flex gap-4 text-sm" style={{ color: 'var(--ink-2)' }}>
                  <span>🙏 {detailJournal.habitudes.prieres || 0}</span>
                  <span>{detailJournal.habitudes.sport ? '🥊 ✓' : '🥊 —'}</span>
                  <span>🚬 {detailJournal.habitudes.cigarettes || 0}</span>
                </div>
                {detailJournal.habitudes.note && (
                  <p className="text-sm mt-2 italic" style={{ color: 'var(--ink-2)' }}>{detailJournal.habitudes.note}</p>
                )}
              </div>
            )}
            {(!detailJournal.taches?.length && !detailJournal.habitudes) && (
              <p className="text-sm italic" style={{ color: 'var(--ink-3)' }}>Aucune donnée pour cette journée.</p>
            )}
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--ink-3)' }}>Aucune donnée pour cette journée.</p>
        )}
      </Modal>
    </div>
  );
}
