import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import Card from './Card';
import { askCoach } from '../utils/perplexity';
import {
  lastCompletedWeekStart, collectWeekData, buildRevuePrompt,
  getRevues, saveRevue, canAutoAttempt, markAttempt,
} from '../utils/revueHebdo';
import { formatDate, addDays } from '../utils/date';

const API_KEY_STORAGE = 'fk_perplexity_key';

function weekLabel(weekStart) {
  const d1 = new Date(`${weekStart}T12:00:00`);
  const d2 = addDays(d1, 6);
  const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(d1)} – ${fmt(d2)}`;
}

// Revue hebdomadaire automatique : à l'ouverture des Stats, si la dernière
// semaine complète n'a pas encore sa revue et qu'une clé API est configurée,
// elle se génère toute seule (garde-fou : une tentative auto / 10 min). Les
// revues sont persistées et les précédentes restent consultables.
export default function RevueHebdo() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE) || '';
  const weekStart = lastCompletedWeekStart(new Date());
  const [revues, setRevues] = useState(getRevues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emptyWeek, setEmptyWeek] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const startedRef = useRef(false);

  const current = revues.find(r => r.weekStart === weekStart);
  const past = revues.filter(r => r.weekStart !== weekStart);

  const generate = useCallback(async (isAuto) => {
    if (!apiKey) return;
    if (isAuto && !canAutoAttempt()) return;
    const data = collectWeekData(weekStart);
    if (data.daysWithData === 0) { setEmptyWeek(true); return; }
    markAttempt();
    setLoading(true);
    setError('');
    try {
      const prev = collectWeekData(formatDate(addDays(new Date(`${weekStart}T12:00:00`), -7)));
      const { system, user } = buildRevuePrompt(data, prev);
      const texte = await askCoach(apiKey, system, [], user);
      saveRevue(weekStart, texte);
      setRevues(getRevues());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, weekStart]);

  // Génération automatique à l'ouverture — une seule fois par montage.
  useEffect(() => {
    if (startedRef.current || current) return;
    startedRef.current = true;
    generate(true);
  }, [current, generate]);

  // Rien à montrer du tout : pas de clé et aucune revue passée.
  if (!apiKey && revues.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>
          📜 Revue de la semaine
        </h2>
        <Card className="p-4">
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
            Chaque semaine terminée, une analyse écrite de tes 7 jours apparaîtra ici automatiquement.
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--ink-3)' }}>
            Configure ta clé API dans l'onglet Assistant (bouton central) pour l'activer.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
          📜 Revue de la semaine
        </h2>
        <span className="text-xs font-semibold" style={{ color: 'var(--ink-3)' }}>{weekLabel(weekStart)}</span>
      </div>

      <Card className="p-4">
        {current ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
            {current.texte}
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 py-2">
            <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--ink-3)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Rédaction de ta revue de la semaine…</p>
          </div>
        ) : emptyWeek ? (
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
            Aucune donnée sur la semaine du {weekLabel(weekStart)} — la revue apparaîtra dès ta première semaine renseignée.
          </p>
        ) : error ? (
          <>
            <p className="text-xs mb-2" style={{ color: 'var(--red)' }}>La génération a échoué : {error}</p>
            <button
              onClick={() => generate(false)}
              className="w-full py-2 rounded-lg text-xs font-bold btn-press"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}
            >
              Réessayer
            </button>
          </>
        ) : (
          <button
            onClick={() => generate(false)}
            className="w-full py-2.5 rounded-lg text-sm font-bold btn-press"
            style={{ background: 'var(--grad-fire)', color: '#fff' }}
          >
            ✨ Générer la revue de la semaine
          </button>
        )}
      </Card>

      {past.length > 0 && (
        <>
          <button
            onClick={() => setShowPast(s => !s)}
            className="w-full mt-2 py-2 rounded-lg text-xs font-medium btn-press"
            style={{ background: 'var(--line-2)', color: 'var(--ink-3)' }}
          >
            {showPast ? 'Masquer les revues précédentes' : `Revues précédentes (${past.length})`}
          </button>
          {showPast && (
            <div className="flex flex-col gap-2 mt-2">
              {past.map(r => (
                <Card key={r.weekStart} className="p-4">
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>{weekLabel(r.weekStart)}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>{r.texte}</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
