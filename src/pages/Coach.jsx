import { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Send, Key, AlertTriangle, Info, Lightbulb, ShieldAlert, RefreshCw, Bell, BellOff } from 'lucide-react';
import { analyzeData, buildSystemPrompt } from '../utils/dataAnalyst';
import { callCoach, hasServerKey } from '../utils/coachApi';
import { getNotificationStatus, subscribeToNotifications, unsubscribeFromNotifications } from '../utils/notifications';
import { formatDate } from '../utils/date';

const API_KEY_STORAGE = 'fk_perplexity_key';
const BILANS_KEY      = 'fk_coach_bilans';

// Calculées à la demande (et non au chargement du module) : une PWA iOS peut
// rester en mémoire plusieurs jours, les constantes seraient figées sur la
// date d'ouverture.
const todayStr   = () => formatDate(new Date());

function cleanOldSessions() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = `fk_coach_session_${formatDate(cutoff)}`;
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('fk_coach_session_') && k < cutoffStr) toDelete.push(k);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
  } catch { /* storage indisponible */ }
}

function saveBilan(text) {
  try {
    const today   = todayStr();
    const clean   = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,3} /g, '').slice(0, 300);
    const bilans  = JSON.parse(localStorage.getItem(BILANS_KEY) || '[]');
    const others  = bilans.filter(b => b.date !== today);
    others.unshift({ date: today, resume: clean });
    localStorage.setItem(BILANS_KEY, JSON.stringify(others.slice(0, 14)));
  } catch { /* storage indisponible */ }
}

function getBilanContext() {
  try {
    const bilans = JSON.parse(localStorage.getItem(BILANS_KEY) || '[]');
    const past   = bilans.filter(b => b.date !== todayStr()).slice(0, 5);
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
    danger:  { Icon: ShieldAlert,   color: 'var(--red)',    bg: '#FFF1F1' },
    warning: { Icon: AlertTriangle, color: '#D97706',       bg: '#FFFBEB' },
    info:    { Icon: Info,          color: 'var(--cyan)',   bg: '#F0FFFE' },
    insight: { Icon: Lightbulb,     color: '#7C3AED',       bg: '#F5F3FF' },
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

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  const text   = isUser ? msg.text : stripMd(msg.text);
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
          Le coach IA utilise Perplexity Sonar (~$1 / million de tokens).
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
          Activer le Coach IA
        </button>
      </div>
      <p className="text-xs text-center" style={{ color: 'var(--ink-3)' }}>
        La clé est stockée uniquement sur ton appareil.
      </p>
    </div>
  );
}

const NOTIF_STATUS_LABELS = {
  'unsupported':            { label: 'Non supporté sur cet appareil',     color: 'var(--ink-3)' },
  'denied':                 { label: 'Bloqué dans les réglages iPhone',    color: 'var(--red)'   },
  'default':                { label: 'Non activé',                         color: 'var(--ink-3)' },
  'granted-not-subscribed': { label: 'Permission accordée, non inscrit',  color: '#D97706'       },
  'subscribed':             { label: '✓ Actif — rappels quotidiens + bilan hebdo', color: '#16A34A' },
};

function NotifCard() {
  const [status, setStatus]   = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    getNotificationStatus().then(setStatus).catch(() => setStatus('unsupported'));
  }, []);

  const isSubscribed  = status === 'subscribed';
  const isUnsupported = status === 'unsupported';
  const isDenied      = status === 'denied';

  const handleToggle = async () => {
    setError('');
    setLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromNotifications();
        setStatus('default');
      } else {
        await subscribeToNotifications();
        setStatus('subscribed');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const info = NOTIF_STATUS_LABELS[status] || NOTIF_STATUS_LABELS['default'];

  return (
    <div className="rounded-2xl p-4 mx-4" style={{ background: 'var(--line-2)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Bell size={15} style={{ color: isSubscribed ? '#16A34A' : 'var(--ink-3)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Notifications push</p>
      </div>
      <p className="text-xs mb-1" style={{ color: info.color, fontWeight: 600 }}>{info.label}</p>
      {!isSubscribed && !isUnsupported && !isDenied && (
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
          Reçois jusqu'à 9 rappels personnalisés par jour directement sur ton iPhone.{' '}
          <span style={{ color: 'var(--red)', fontWeight: 600 }}>App installée requise</span>{' '}
          (Ajouter à l'écran d'accueil) + iOS 16.4+.
        </p>
      )}
      {isDenied && (
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
          Autorise les notifications dans <strong>Réglages → Frontkick Daily → Notifications</strong>.
        </p>
      )}
      {isUnsupported && (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-3)' }}>
          Installe l'app (Ajouter à l'écran d'accueil depuis Safari) et assure-toi d'être sur iOS 16.4+.
        </p>
      )}
      {error && <p className="text-xs mb-2" style={{ color: 'var(--red)' }}>{error}</p>}
      {!isUnsupported && !isDenied && (
        <button
          onClick={handleToggle}
          disabled={loading}
          className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press"
          style={{
            background: isSubscribed ? 'transparent' : 'var(--red)',
            color: isSubscribed ? 'var(--ink-3)' : '#fff',
            border: isSubscribed ? '1px solid var(--line)' : 'none',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? '…' : isSubscribed ? (
            <span className="flex items-center justify-center gap-1.5"><BellOff size={13} /> Désactiver les notifications</span>
          ) : (
            <span className="flex items-center justify-center gap-1.5"><Bell size={13} /> Activer les notifications</span>
          )}
        </button>
      )}
    </div>
  );
}

const WEEKLY_PROMPT = "Fais-moi le bilan de ma semaine écoulée : tendances sport, prières, cigarettes et tâches accomplies. Donne-moi 2 victoires, 1 point faible, et 1 priorité concrète pour la semaine qui arrive.";

export default function Coach({ pendingCompose, onPendingConsumed }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  // null = en cours de vérification ; true = clé configurée sur Vercel (pas de setup nécessaire)
  const [serverKey, setServerKey] = useState(null);
  // Date à laquelle appartient la conversation en mémoire. Si la PWA reste
  // ouverte après minuit, on bascule vers la session du nouveau jour au lieu
  // d'écrire l'historique de la veille dans la clé du jour courant.
  const [sessionDate, setSessionDate] = useState(() => todayStr());
  const [messages, setMessages] = useState(() => {
    try {
      cleanOldSessions();
      const saved = localStorage.getItem(`fk_coach_session_${todayStr()}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const bottomRef = useRef(null);

  const analysis = useMemo(() => {
    try { return analyzeData(); } catch { return null; }
  }, []);

  const systemPrompt = useMemo(() => {
    return buildSystemPrompt(analysis) + getBilanContext();
  }, [analysis]);

  // Persist session vers la clé de SA date (et non un todayStr() recalculé)
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`fk_coach_session_${sessionDate}`, JSON.stringify(messages));
    }
  }, [messages, sessionDate]);

  // Bascule de jour : au retour au premier plan, si la date a changé, on
  // recharge la conversation du nouveau jour (vide → le bilan du jour réapparaît)
  useEffect(() => {
    const checkRollover = () => {
      const now = todayStr();
      if (now === sessionDate) return;
      setSessionDate(now);
      try {
        const saved = localStorage.getItem(`fk_coach_session_${now}`);
        setMessages(saved ? JSON.parse(saved) : []);
      } catch { setMessages([]); }
    };
    document.addEventListener('visibilitychange', checkRollover);
    window.addEventListener('focus', checkRollover);
    return () => {
      document.removeEventListener('visibilitychange', checkRollover);
      window.removeEventListener('focus', checkRollover);
    };
  }, [sessionDate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    hasServerKey().then(setServerKey);
  }, []);

  const ready = !!apiKey || serverKey === true;

  // Deep link « bilan hebdo » (notification du dimanche soir)
  useEffect(() => {
    if (pendingCompose !== 'bilan-hebdo') return;
    if (serverKey === null) return; // attendre de savoir si une clé existe
    onPendingConsumed?.();
    if (ready && !loading) sendMessage(WEEKLY_PROMPT);
  }, [pendingCompose, serverKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const chatHistory = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text,
  }));

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const reply = await callCoach(apiKey, systemPrompt, chatHistory, text.trim());
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

  const chatStarted = messages.length > 0;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-or-4 pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2">
          <Bot size={20} style={{ color: 'var(--red)' }} />
          <p className="text-base font-bold" style={{ color: 'var(--ink)' }}>Coach IA</p>
        </div>
        {apiKey && (
          <button
            onClick={() => {
              if (window.confirm('Effacer la clé API et réinitialiser le coach ?')) {
                localStorage.removeItem(API_KEY_STORAGE);
                localStorage.removeItem(`fk_coach_session_${sessionDate}`);
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

      {!ready && serverKey === null ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--ink-3)' }} />
        </div>
      ) : !ready ? (
        <div className="flex-1 overflow-auto">
          <SetupCard onSave={handleSave} />
          <p className="text-xs text-center px-6 mt-3" style={{ color: 'var(--ink-3)' }}>
            Astuce : ajoute la variable <strong>PERPLEXITY_API_KEY</strong> sur Vercel
            pour ne plus jamais avoir à coller de clé ici.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto flex flex-col gap-3 pb-3">

            {/* Panels visibles uniquement avant que la conversation démarre */}
            {!chatStarted && (
              <>
                <InsightsPanel alerts={analysis?.alerts || []} analysis={analysis} />
                <NotifCard />
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

            {/* Messages */}
            <div className="flex flex-col gap-2">
              {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
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

            {/* Bouton bilan — uniquement si pas encore de conversation aujourd'hui */}
            {!chatStarted && !loading && (
              <div className="px-4">
                <button
                  onClick={() => sendMessage('Bonjour ! Fais-moi un bilan rapide de ma situation actuelle et donne-moi 1 priorité concrète pour aujourd\'hui.')}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white btn-press"
                  style={{ background: 'var(--red)', letterSpacing: '0.01em' }}
                >
                  Démarre mon bilan du jour
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

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
