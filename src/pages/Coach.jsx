import { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Send, Key, AlertTriangle, Info, Lightbulb, ShieldAlert, RefreshCw } from 'lucide-react';
import { analyzeData, buildSystemPrompt } from '../utils/dataAnalyst';
import { askCoach } from '../utils/perplexity';
import { formatDate } from '../utils/date';

const API_KEY_STORAGE = 'fk_perplexity_key';
const TODAY           = formatDate(new Date());
const SESSION_KEY     = `fk_coach_session_${TODAY}`;
const BILANS_KEY      = 'fk_coach_bilans';

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
          Activer le Coach principal
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

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
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

  const chatStarted = messages.length > 0;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-or-4 pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2">
          <Bot size={20} style={{ color: 'var(--red)' }} />
          <p className="text-base font-bold font-display" style={{ color: 'var(--ink)' }}>Coach principal</p>
        </div>
        {apiKey && (
          <button
            onClick={() => {
              if (window.confirm('Effacer la clé API et réinitialiser le coach ?')) {
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
              <InsightsPanel alerts={analysis?.alerts || []} analysis={analysis} />
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
