import { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Send, Key, AlertTriangle, Info, Lightbulb, ShieldAlert, RefreshCw } from 'lucide-react';
import { analyzeData, buildSystemPrompt } from '../utils/dataAnalyst';
import { askCoach } from '../utils/perplexity';
import { extractStructured, parseSeance, parseIdees, saveSeanceToJournal } from '../utils/coachActions';
import { useTikTok } from '../hooks/useBanques';
import { formatDate } from '../utils/date';

const API_KEY_STORAGE = 'fk_perplexity_key';
const TODAY           = formatDate(new Date());
const SESSION_KEY     = `fk_coach_session_${TODAY}`;
const BILANS_KEY      = 'fk_coach_bilans';

// Actions à un tap — chacune envoie un prompt ciblé qui exploite les données
// de l'app (horaires de travail, prospects, historique des séances…). Les
// actions `seance` et `idees` demandent en plus un bloc JSON structuré que
// l'app sait transformer en action concrète (enregistrer la séance, ajouter
// les idées à la banque TikTok).
const QUICK_ACTIONS = [
  {
    id: 'plan', emoji: '⚡', label: "Plan d'attaque du jour",
    desc: 'Créneaux concrets autour du travail',
    prompt: "Fais-moi un plan d'attaque concret pour aujourd'hui : tiens compte de mes horaires de travail, de mon agenda, de mes missions en attente et de mes prospects à relancer. Propose des créneaux horaires réalistes dans mon temps libre, et termine par LA priorité numéro 1.",
  },
  {
    id: 'seance', emoji: '🥊', label: 'Prépare ma séance',
    desc: 'Selon ton matériel et tes dernières perfs',
    prompt: "Prépare-moi une séance pour aujourd'hui, adaptée à mon matériel (barre de traction, bandes 15/25/35 kg, poids du corps), à mes dernières séances détaillées (progresse par rapport aux charges précédentes) et à mon temps libre autour du travail. Explique la séance en 3-4 phrases max, puis termine par un bloc ```json exactement de cette forme : {\"seance\": {\"titre\": \"...\", \"lieu\": \"exterieur\", \"duree\": 30, \"materiel\": [\"Barre de traction\", \"Bande 25 kg\"], \"exercices\": [{\"nom\": \"...\", \"series\": 4, \"reps\": \"8\", \"charge\": \"bande 25 kg\"}]}}",
  },
  {
    id: 'idees', emoji: '🎬', label: '3 idées de vidéos',
    desc: 'Nouvelles, hors banque actuelle',
    prompt: "Propose-moi 3 idées de vidéos TikTok nouvelles qui ne sont pas déjà dans ma banque, en phase avec l'actualité du combat si possible. Une phrase d'angle pour chacune, puis termine par un bloc ```json exactement de cette forme : {\"idees\": [\"titre 1\", \"titre 2\", \"titre 3\"]}",
  },
  {
    id: 'relance', emoji: '📇', label: 'Messages de relance',
    desc: 'Prêts à envoyer à tes prospects',
    prompt: "Rédige-moi un court message de relance prêt à envoyer pour chacun de mes prospects à relancer (ou, s'il n'y en a pas de dus aujourd'hui, pour mes prospects ouverts les plus importants, max 3). Tiens compte de leurs notes. Ton direct et humain, pas de blabla commercial.",
  },
  {
    id: 'bilan', emoji: '📊', label: 'Bilan de la semaine',
    desc: 'Ce qui progresse, ce qui décroche',
    prompt: 'Fais le bilan de mes 7 derniers jours : ce qui progresse, ce qui décroche (sport, cigarettes, missions, prospects), et donne-moi 3 actions concrètes pour la semaine qui vient.',
  },
];

function saveBilan(text) {
  try {
    const clean   = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,3} /g, '').slice(0, 300);
    const bilans  = JSON.parse(localStorage.getItem(BILANS_KEY) || '[]');
    const others  = bilans.filter(b => b.date !== TODAY);
    others.unshift({ date: TODAY, resume: clean });
    localStorage.setItem(BILANS_KEY, JSON.stringify(others.slice(0, 14)));
  } catch { /* ignore storage errors */ }
}

function getBilanContext() {
  try {
    const bilans = JSON.parse(localStorage.getItem(BILANS_KEY) || '[]');
    const past   = bilans.filter(b => b.date !== TODAY).slice(0, 5);
    if (!past.length) return '';
    return '\n\nHISTORIQUE — résumés bilans récents :\n' +
      past.map(b => `${b.date} : ${b.resume}`).join('\n');
  } catch { return ''; }
}

function stripMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,3} /g, '');
}

function AlertBadge({ level }) {
  const map = {
    danger:  { Icon: ShieldAlert,   color: 'var(--red)',    bg: 'var(--red-soft)' },
    warning: { Icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-soft)' },
    info:    { Icon: Info,          color: 'var(--cyan)',   bg: 'var(--cyan-soft)' },
    insight: { Icon: Lightbulb,     color: 'var(--violet)', bg: 'var(--violet-soft)' },
  };
  return map[level] || map.info;
}

function InsightsPanel({ alerts, analysis }) {
  if (!analysis) return null;
  return (
    <div className="flex flex-col gap-2 px-4 pt-3 pb-1">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
        Analyse — 30 derniers jours
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Prières/j', value: analysis.averages.prieres.toFixed(1) },
          { label: 'Cig/j',    value: analysis.averages.cigarettes.toFixed(1) },
          { label: 'Séances',  value: analysis.sport.sessions },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'var(--line-2)' }}>
            <p className="text-base font-bold" style={{ color: 'var(--ink)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{label}</p>
          </div>
        ))}
      </div>
      {alerts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {alerts.map((a, i) => {
            const { Icon, color, bg } = AlertBadge({ level: a.level });
            return (
              <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: bg }}>
                <Icon size={14} style={{ color, marginTop: 2, flexShrink: 0 }} />
                <p className="text-xs leading-snug" style={{ color: 'var(--ink)' }}>{a.msg}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Carte d'action sous une réponse du coach contenant une séance structurée.
function SeanceActionCard({ seance, saved, onSave }) {
  return (
    <div className="mx-4 rounded-2xl p-3" style={{ background: 'var(--surface)', border: '1px solid rgba(0,180,216,0.35)' }}>
      <p className="text-sm font-bold mb-1" style={{ color: 'var(--ink)' }}>
        🥊 {seance.seance_nom}{seance.duree_reelle ? ` · ${seance.duree_reelle} min` : ''}
      </p>
      {seance.exercices.map((e, i) => (
        <p key={i} className="text-xs" style={{ color: 'var(--ink-2)' }}>
          • {e.nom}{e.series ? ` — ${e.series} × ${e.reps || '?'}` : e.reps ? ` — ${e.reps}` : ''}{e.charge ? ` · ${e.charge}` : ''}
        </p>
      ))}
      {seance.materiel.length > 0 && (
        <p className="text-xs mt-1" style={{ color: 'var(--ink-3)' }}>Matériel : {seance.materiel.join(', ')}</p>
      )}
      <button
        onClick={onSave}
        disabled={saved}
        className="w-full mt-2 py-2 rounded-lg text-xs font-bold btn-press disabled:opacity-60"
        style={{ background: saved ? 'var(--green-soft)' : 'var(--cyan)', color: saved ? 'var(--green)' : '#06121A' }}
      >
        {saved ? '✓ Enregistrée comme sport du jour' : '💾 Enregistrer comme séance du jour'}
      </button>
    </div>
  );
}

// Carte d'action pour des idées de vidéos structurées.
function IdeesActionCard({ idees, added, onAdd }) {
  return (
    <div className="mx-4 rounded-2xl p-3 flex flex-col gap-1.5" style={{ background: 'var(--surface)', border: '1px solid rgba(255,87,87,0.35)' }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Ajouter à la banque TikTok</p>
      {idees.map((titre, i) => {
        const done = added.includes(i);
        return (
          <div key={i} className="flex items-center gap-2">
            <p className="text-xs flex-1 leading-snug" style={{ color: 'var(--ink-2)' }}>{titre}</p>
            <button
              onClick={() => onAdd(i)}
              disabled={done}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0 btn-press disabled:opacity-60"
              style={{ background: done ? 'var(--green-soft)' : 'var(--red)', color: done ? 'var(--green)' : '#fff' }}
            >
              {done ? '✓' : '＋ Ajouter'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Bulle de chat. Les messages du coach sont analysés : si un bloc JSON
// structuré est présent (séance, idées), il est masqué du texte et rendu
// comme carte d'action par le parent.
function ChatBubble({ msg, displayText }) {
  const isUser = msg.role === 'user';
  const text   = isUser ? (msg.label || msg.text) : stripMd(displayText ?? msg.text);
  if (!text) return null;
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4`}>
      <div
        className="rounded-2xl px-3.5 py-2.5"
        style={{
          maxWidth: '82%',
          background: isUser ? 'var(--red)' : 'var(--surface)',
          color:      isUser ? '#fff'       : 'var(--ink)',
          border:     isUser ? 'none'       : '1px solid var(--line)',
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius:  isUser ? 16 : 4,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function SetupCard({ onSave }) {
  const [key, setKey] = useState('');
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="rounded-2xl p-4" style={{ background: 'var(--line-2)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Key size={16} style={{ color: 'var(--red)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Clé API Perplexity</p>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--ink-3)' }}>
          L'assistant IA (actions rapides ici + revue hebdo automatique dans
          Progression) utilise Perplexity Sonar (~$1 / million de tokens).
          Génère ta clé sur <span style={{ color: 'var(--red)', fontWeight: 600 }}>perplexity.ai/settings/api</span>,
          puis colle-la ici.
        </p>
        <input
          type="password"
          placeholder="pplx-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 text-sm mb-3"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button
          onClick={() => key.trim() && onSave(key.trim())}
          className="w-full py-2.5 rounded-xl font-semibold text-sm text-white btn-press"
          style={{ background: 'var(--red)', opacity: key.trim() ? 1 : 0.4 }}
        >
          Activer l'assistant IA
        </button>
      </div>
      <p className="text-xs text-center" style={{ color: 'var(--ink-3)' }}>
        La clé est stockée uniquement sur ton appareil.
      </p>
    </div>
  );
}

export default function Coach() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const bottomRef = useRef(null);
  const [, setTiktok] = useTikTok();

  const analysis = useMemo(() => {
    try { return analyzeData(); } catch { return null; }
  }, []);

  const systemPrompt = useMemo(() => {
    return buildSystemPrompt(analysis) + getBilanContext();
  }, [analysis]);

  // Persist session
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const chatHistory = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text,
  }));

  // `label` : libellé court affiché à la place du prompt complet des actions
  // rapides (le prompt entier part quand même à l'API).
  async function sendMessage(text, label) {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim(), label }]);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const reply = await askCoach(apiKey, systemPrompt, chatHistory, text.trim());
      setMessages(prev => {
        const isFirstAI = prev.filter(m => m.role === 'model').length === 0;
        if (isFirstAI) saveBilan(reply);
        return [...prev, { role: 'model', text: reply }];
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = (key) => {
    localStorage.setItem(API_KEY_STORAGE, key);
    setApiKey(key);
  };

  // ── Actions structurées sur les réponses du coach ─────────────────────────

  const handleSaveSeance = (msgIndex, seance) => {
    const ok = saveSeanceToJournal(TODAY, seance);
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, seanceSaved: true } : m));
    if (!ok) setError('Une séance est déjà enregistrée aujourd\'hui — modifie-la depuis l\'écran Combat.');
  };

  const handleAddIdee = (msgIndex, ideeIndex, titre) => {
    setTiktok(prev => [
      ...prev,
      { id: Date.now(), titre, format: 'Idée coach', discipline: 'Tous', priorite: 'HAUTE', statut: 'a_tourner' },
    ]);
    setMessages(prev => prev.map((m, i) =>
      i === msgIndex ? { ...m, ideesAdded: [...(m.ideesAdded || []), ideeIndex] } : m
    ));
  };

  const chatStarted = messages.length > 0;

  const runQuickAction = (action) => sendMessage(action.prompt, `${action.emoji} ${action.label}`);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-or-4 pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2">
          <Bot size={20} style={{ color: 'var(--red)' }} />
          <p className="text-base font-bold font-display" style={{ color: 'var(--ink)' }}>Assistant IA</p>
        </div>
        {apiKey && (
          <button
            onClick={() => {
              if (window.confirm("Effacer la clé API et réinitialiser l'assistant ?")) {
                localStorage.removeItem(API_KEY_STORAGE);
                localStorage.removeItem(SESSION_KEY);
                setApiKey('');
                setMessages([]);
              }
            }}
            className="btn-press p-1.5 rounded-lg"
            style={{ color: 'var(--ink-3)' }}
          >
            <Key size={15} />
          </button>
        )}
      </div>

      {!apiKey ? (
        <div className="flex-1 overflow-auto">
          <SetupCard onSave={handleSave} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto flex flex-col gap-3 pb-3">

            {/* Panels visibles uniquement avant que la conversation démarre */}
            {!chatStarted && (
              <>
                <InsightsPanel alerts={analysis?.alerts || []} analysis={analysis} />

                {/* Actions à un tap — le cœur du coach */}
                <div className="px-4 flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
                    Que veux-tu que je prépare ?
                  </p>
                  {QUICK_ACTIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => runQuickAction(a)}
                      disabled={loading}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left btn-press"
                      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                    >
                      <span className="text-xl shrink-0">{a.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold" style={{ color: 'var(--ink)' }}>{a.label}</span>
                        <span className="block text-xs" style={{ color: 'var(--ink-3)' }}>{a.desc}</span>
                      </span>
                      <span style={{ color: 'var(--ink-3)' }}>›</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Divider */}
            {chatStarted && (
              <div className="flex items-center gap-2 px-4 pt-3">
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Conversation du jour</p>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
            )}

            {/* Messages + cartes d'action */}
            <div className="flex flex-col gap-2">
              {messages.map((m, i) => {
                if (m.role === 'user') return <ChatBubble key={i} msg={m} />;
                const { text: clean, data } = extractStructured(m.text);
                const seance = data ? parseSeance(data) : null;
                const idees  = !seance && data ? parseIdees(data) : null;
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <ChatBubble msg={m} displayText={clean} />
                    {seance && (
                      <SeanceActionCard
                        seance={seance}
                        saved={!!m.seanceSaved}
                        onSave={() => handleSaveSeance(i, seance)}
                      />
                    )}
                    {idees && (
                      <IdeesActionCard
                        idees={idees}
                        added={m.ideesAdded || []}
                        onAdd={(ideeIndex) => handleAddIdee(i, ideeIndex, idees[ideeIndex])}
                      />
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start px-4">
                  <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                    <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--ink-3)' }} />
                  </div>
                </div>
              )}
              {error && (
                <p className="text-xs px-4" style={{ color: 'var(--red)' }}>Erreur : {error}</p>
              )}
            </div>

            <div ref={bottomRef} />
          </div>

          {/* Actions rapides compactes une fois la conversation lancée */}
          {chatStarted && (
            <div className="flex gap-1.5 px-3 pb-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => runQuickAction(a)}
                  disabled={loading}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium btn-press disabled:opacity-50"
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
                >
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div
            className="flex items-end gap-2 px-3 py-2"
            style={{
              borderTop: '1px solid var(--line)',
              background: 'var(--bg)',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            }}
          >
            <textarea
              rows={1}
              placeholder="Pose une question à ton coach…"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
              }}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                outline: 'none',
                lineHeight: 1.4,
                maxHeight: 96,
                overflow: 'hidden',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="btn-press flex items-center justify-center shrink-0"
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: input.trim() && !loading ? 'var(--red)' : 'var(--line-2)',
                color: input.trim() && !loading ? '#fff' : 'var(--ink-3)',
                transition: 'background 150ms, color 150ms',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
