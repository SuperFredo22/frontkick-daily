import { useState } from 'react';
import { addDays, startOfWeek, formatDate, formatDayShort, isSameDay } from '../utils/date';
import { useAgenda } from '../hooks/useAgenda';
import { useTravail } from '../hooks/useTravail';
import { workBlockForDate, totalWorkHours, formatHeures, hasWorkSchedule } from '../utils/travail';
import Modal from '../components/Modal';
import WorkScheduleModal from '../components/WorkScheduleModal';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6h à 23h

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function EventBlock({ event, onClick }) {
  const top = ((timeToMinutes(event.heureDebut) - 360) / 60) * 56;
  const height = Math.max(((timeToMinutes(event.heureFin) - timeToMinutes(event.heureDebut)) / 60) * 56, 28);
  const color = event.color || 'var(--red)';

  return (
    <div
      onClick={() => onClick(event)}
      className="absolute left-0 right-1 rounded-lg px-1.5 py-0.5 cursor-pointer text-white overflow-hidden"
      style={{ top, height, background: color, fontSize: 10, lineHeight: '13px', zIndex: 2 }}
    >
      <div className="font-semibold truncate">{event.heureDebut}</div>
      <div className="truncate opacity-90">{event.titre}</div>
    </div>
  );
}

// Bloc « travail » dérivé des horaires (semaine type + exceptions) : affiché
// derrière les RDV, cliquer dessus ouvre l'éditeur d'horaires sur ce jour.
function WorkBlock({ work, onClick }) {
  const debut = Math.max(timeToMinutes(work.debut), 360); // la grille démarre à 6h
  const fin = Math.min(timeToMinutes(work.fin), 24 * 60);
  if (fin <= debut) return null;
  const top = ((debut - 360) / 60) * 56;
  const height = Math.max(((fin - debut) / 60) * 56, 28);
  return (
    <div
      onClick={onClick}
      className="absolute left-0 right-1 rounded-lg px-1.5 py-0.5 cursor-pointer overflow-hidden"
      style={{
        top, height, zIndex: 1,
        background: 'var(--surface-3)',
        border: work.exception ? '1px dashed var(--orange)' : '1px dashed var(--line)',
        color: 'var(--ink-2)', fontSize: 10, lineHeight: '13px',
      }}
    >
      <div className="font-semibold truncate">💼 {work.debut}</div>
      <div className="truncate opacity-80">Travail</div>
    </div>
  );
}

const EMPTY_FORM = { titre: '', date: formatDate(new Date()), heureDebut: '', heureFin: '', lieu: '', note: '', recurrent: false };

export default function Agenda() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [agenda, setAgenda] = useAgenda();
  const [travail, setTravail] = useTravail();
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [workModal, setWorkModal] = useState(null); // null | { focusDate?, focusLabel? }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekHours = totalWorkHours(travail, days.map(formatDate));

  const eventsForDay = (date) => {
    const dateStr = formatDate(date);
    return (agenda || []).filter(e => e.date === dateStr);
  };

  const openNew = (date, hour) => {
    setEditEvent(null);
    setForm({
      ...EMPTY_FORM,
      date: formatDate(date),
      heureDebut: `${String(hour).padStart(2, '0')}:00`,
      heureFin: `${String(hour + 1).padStart(2, '0')}:00`,
    });
    setShowForm(true);
  };

  const openEdit = (event) => {
    setEditEvent(event);
    setForm({ titre: event.titre, date: event.date, heureDebut: event.heureDebut, heureFin: event.heureFin, lieu: event.lieu || '', note: event.note || '', recurrent: event.recurrent || false });
    setShowForm(true);
  };

  const saveEvent = () => {
    if (!form.titre.trim()) return;
    if (editEvent) {
      setAgenda(prev => prev.map(e => {
        if (e.id === editEvent.id) return { ...e, ...form };
        if (editEvent.recurrent && e.recurrentId === editEvent.recurrentId) return { ...e, ...form, date: e.date };
        return e;
      }));
    } else {
      const id = Date.now();
      if (form.recurrent) {
        const events = [];
        for (let i = 0; i < 52; i++) {
          const d = new Date(form.date);
          d.setDate(d.getDate() + i * 7);
          events.push({ ...form, id: id + i, recurrentId: id, date: formatDate(d) });
        }
        setAgenda(prev => [...(prev || []), ...events]);
      } else {
        setAgenda(prev => [...(prev || []), { ...form, id }]);
      }
    }
    setShowForm(false);
  };

  const deleteEvent = () => {
    if (!editEvent) return;
    setAgenda(prev => prev.filter(e => e.id !== editEvent.id));
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Week navigation */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <button onClick={() => setWeekStart(w => addDays(w, -7))} className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--ink-2)' }}>‹</button>
        <div className="text-sm font-semibold text-center" style={{ color: 'var(--ink)' }}>
          {days[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} –{' '}
          {days[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          {weekHours > 0 && (
            <span className="block text-[10px] font-medium" style={{ color: 'var(--ink-3)' }}>
              💼 {formatHeures(weekHours)} de travail cette semaine
            </span>
          )}
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setWorkModal({})}
            className="w-8 h-8 flex items-center justify-center btn-press"
            title="Horaires de travail"
            style={{ fontSize: 14 }}
          >
            💼
          </button>
          <button onClick={() => setWeekStart(w => addDays(w, 7))} className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--ink-2)' }}>›</button>
        </div>
      </div>

      {/* Invite à renseigner ses horaires (une fois le planning vide) */}
      {!hasWorkSchedule(travail) && (
        <button
          onClick={() => setWorkModal({})}
          className="mx-4 mt-2 rounded-xl px-4 py-2 text-left btn-press"
          style={{ background: 'var(--surface)', border: '1px dashed var(--line)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
            💼 Renseigne tes horaires de travail : ils s'afficheront ici chaque semaine automatiquement.
          </p>
        </button>
      )}

      {/* Day headers */}
      <div className="flex" style={{ paddingLeft: 40, background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        {days.map(d => {
          const isToday = isSameDay(d, new Date());
          return (
            <div key={formatDate(d)} className="flex-1 text-center py-1.5">
              <div className="text-[10px] uppercase" style={{ color: 'var(--ink-3)' }}>{formatDayShort(d).split(' ')[0]}</div>
              <div className={`text-sm font-semibold ${isToday ? 'text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}
                style={isToday ? { background: 'var(--red)' } : { color: 'var(--ink-2)' }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto pb-nav">
        <div className="flex">
          {/* Hour labels */}
          <div className="w-10 flex-shrink-0">
            {HOURS.map(h => (
              <div key={h} className="h-14 flex items-start justify-end pr-1 pt-0.5" style={{ borderBottom: '1px solid var(--line-2)' }}>
                <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{h}h</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(d => {
            const dateStr = formatDate(d);
            const events = eventsForDay(d);
            const work = workBlockForDate(travail, dateStr);
            return (
              <div key={dateStr} className="flex-1 relative" style={{ borderLeft: '1px solid var(--line-2)' }}>
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="h-14 cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--line-2)' }}
                    onClick={() => openNew(d, h)}
                  />
                ))}
                {work && (
                  <WorkBlock
                    work={work}
                    onClick={() => setWorkModal({
                      focusDate: dateStr,
                      focusLabel: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
                    })}
                  />
                )}
                {events.map(event => (
                  <EventBlock key={event.id} event={event} onClick={openEdit} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editEvent ? 'Modifier le RDV' : 'Nouveau RDV'}
        footer={
          <div className="flex gap-2 w-full">
            {editEvent && (
              <button onClick={deleteEvent} className="py-2.5 px-4 rounded-lg bg-red-50 text-red-kick font-medium text-sm" style={{ color: 'var(--red)' }}>
                Supprimer
              </button>
            )}
            <button
              onClick={saveEvent}
              disabled={!form.titre.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
              style={{ background: 'var(--red)' }}
            >
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg font-medium text-sm" style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}>
              Annuler
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Titre *</span>
            <input
              autoFocus
              value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder="Titre du rendez-vous"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Date</span>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex-1">
              <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Début</span>
              <input type="time" value={form.heureDebut} onChange={e => setForm(f => ({ ...f, heureDebut: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex-1">
              <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Fin</span>
              <input type="time" value={form.heureFin} onChange={e => setForm(f => ({ ...f, heureFin: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Lieu (optionnel)</span>
            <input value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
              placeholder="Ex : Salle de sport" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Note (optionnel)</span>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} />
          </label>
          <label className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, recurrent: !f.recurrent }))}
              className="w-12 h-6 rounded-full relative transition-colors"
              style={{ background: form.recurrent ? 'var(--red)' : 'var(--line-2)' }}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform ${form.recurrent ? 'translate-x-6' : 'translate-x-0.5'}`}
                style={{ background: '#fff' }}
              />
            </button>
            <span className="text-sm" style={{ color: 'var(--ink-2)' }}>Récurrent chaque semaine</span>
          </label>
        </div>
      </Modal>

      {/* Horaires de travail (semaine type + exception du jour cliqué) */}
      <WorkScheduleModal
        open={workModal !== null}
        onClose={() => setWorkModal(null)}
        travail={travail}
        setTravail={setTravail}
        focusDate={workModal?.focusDate}
        focusLabel={workModal?.focusLabel}
      />
    </div>
  );
}
