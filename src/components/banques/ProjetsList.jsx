import { useState } from 'react';
import Modal from '../Modal';
import ItemMenu from './ItemMenu';
import { PROJET_PALETTE } from '../../hooks/useProjets';

// ─── Projets tab ─────────────────────────────────────────────────────────────

const PROJET_FORM_EMPTY = { nom: '', emoji: '📁', couleur: PROJET_PALETTE[0], echeance: '', taches: [] };

// Days remaining until a deadline (null if none). Negative = overdue.
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 864e5);
}

function DeadlineChip({ echeance }) {
  const days = daysUntil(echeance);
  if (days === null) return null;
  const overdue = days < 0;
  const soon = days >= 0 && days <= 3;
  const color = overdue ? 'var(--red)' : soon ? 'var(--orange)' : 'var(--ink-3)';
  const label = overdue ? `Retard ${-days}j` : days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `J-${days}`;
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color, border: `1px solid var(--line)` }}>
      ⏳ {label}
    </span>
  );
}

function ProjetTaskRow({ tache, projetCouleur, onModifier, onDejaFait, onSupprimer }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDejaFait = tache.statut === 'deja_fait';
  const isDone = tache.statut === 'fait';

  return (
    <>
      <div className={`flex items-center gap-2 py-2 px-2 rounded-lg ${isDejaFait ? 'opacity-40' : ''}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: isDone || isDejaFait ? '#D1D5DB' : projetCouleur }} />
        <span className={`flex-1 text-sm text-gray-700 leading-snug ${(isDone || isDejaFait) ? 'line-through text-gray-400' : ''}`}>
          {tache.description}
        </span>
        {isDejaFait && <span className="text-[10px] text-gray-300">Déjà réalisé</span>}
        <button onClick={() => setMenuOpen(true)} className="w-6 h-6 flex items-center justify-center text-gray-400 text-xs rounded hover:bg-gray-100 flex-shrink-0">
          ···
        </button>
      </div>

      <ItemMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        itemLabel={tache.description}
        color={projetCouleur}
        onModifier={() => onModifier?.(tache)}
        onDejaFait={() => onDejaFait(tache.id)}
        onSupprimer={() => onSupprimer(tache.id)}
      />
    </>
  );
}

function ProjetCard({ projet, onEdit, onDelete, onUpdateTaches }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [showDoneTask, setShowDoneTasks] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');

  const activeTaches = (projet.taches || []).filter(t => t.statut === 'a_faire');
  const doneTaches   = (projet.taches || []).filter(t => t.statut === 'fait' || t.statut === 'deja_fait');
  const totalTaches  = (projet.taches || []).length;
  const pct          = totalTaches > 0 ? Math.round((doneTaches.length / totalTaches) * 100) : 0;
  const complete     = totalTaches > 0 && doneTaches.length === totalTaches;

  const addTask = () => {
    if (!newTask.trim()) return;
    const id = Math.max(0, ...(projet.taches || []).map(t => t.id)) + 1;
    onUpdateTaches([...(projet.taches || []), { id, description: newTask.trim(), statut: 'a_faire' }]);
    setNewTask('');
    setShowAddTask(false);
  };

  const markTaskDejaFait = (tacheId) => {
    onUpdateTaches(projet.taches.map(t => t.id === tacheId ? { ...t, statut: 'deja_fait' } : t));
  };

  const removeTask = (tacheId) => {
    onUpdateTaches(projet.taches.filter(t => t.id !== tacheId));
  };

  const openEditTask = (tache) => { setEditTask(tache); setEditTaskText(tache.description); };

  const saveEditTask = () => {
    if (!editTaskText.trim()) return;
    onUpdateTaches(projet.taches.map(t => t.id === editTask.id ? { ...t, description: editTaskText.trim() } : t));
    setEditTask(null);
    setEditTaskText('');
  };

  return (
    <div className="bg-white rounded-xl shadow-card mb-3 overflow-hidden relative">
      {/* Left color bar */}
      <div className="absolute left-0 top-0 bottom-0" style={{ width: 3, background: projet.couleur }} />
      {/* Project header */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: projet.couleur + '22' }}>
          {projet.emoji}
        </div>
        <div className="flex-1 min-w-0" onClick={() => setExpanded(v => !v)}>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-gray-800 truncate">{projet.nom}</p>
            <DeadlineChip echeance={projet.echeance} />
          </div>
          {totalTaches > 0 ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1" style={{ height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: projet.couleur, transition: 'width 400ms ease' }} />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: complete ? 'var(--green)' : 'var(--ink-3)' }}>
                {complete ? '✓ 100%' : `${pct}%`}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400">{activeTaches.length} tâche{activeTaches.length !== 1 ? 's' : ''} restante{activeTaches.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 flex items-center justify-center text-gray-400 text-sm">
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={() => onEdit(projet)} className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs rounded hover:bg-gray-100">
            ✏️
          </button>
          <button onClick={() => onDelete(projet.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-xs" style={{ color: 'var(--red)' }}>
            🗑️
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 px-3 pb-2 pt-1">
          {activeTaches.map(t => (
            <ProjetTaskRow key={t.id} tache={t} projetCouleur={projet.couleur}
              onModifier={openEditTask} onDejaFait={markTaskDejaFait} onSupprimer={removeTask} />
          ))}

          {doneTaches.length > 0 && (
            <button onClick={() => setShowDoneTasks(v => !v)}
              className="text-xs text-gray-300 mt-1 mb-1 hover:text-gray-500">
              {showDoneTask ? '▼' : '▶'} {doneTaches.length} réalisé{doneTaches.length !== 1 ? 's' : ''}
            </button>
          )}
          {showDoneTask && doneTaches.map(t => (
            <ProjetTaskRow key={t.id} tache={t} projetCouleur={projet.couleur}
              onModifier={openEditTask} onDejaFait={markTaskDejaFait} onSupprimer={removeTask} />
          ))}

          {showAddTask ? (
            <div className="flex gap-2 mt-2">
              <input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setShowAddTask(false); }}
                placeholder="Description de la tâche..." className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
              <button onClick={addTask} disabled={!newTask.trim()}
                className="px-3 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-40"
                style={{ background: projet.couleur }}>OK</button>
            </div>
          ) : (
            <button onClick={() => setShowAddTask(true)}
              className="mt-2 text-sm flex items-center gap-1.5 font-medium" style={{ color: projet.couleur }}>
              + Ajouter une tâche
            </button>
          )}
        </div>
      )}
      {/* Edit task modal */}
      <Modal
        open={!!editTask}
        onClose={() => { setEditTask(null); setEditTaskText(''); }}
        title="Modifier la tâche"
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={saveEditTask} disabled={!editTaskText.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
              style={{ background: projet.couleur }}>
              Enregistrer
            </button>
            <button onClick={() => { setEditTask(null); setEditTaskText(''); }}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </div>
        }
      >
        <textarea
          autoFocus value={editTaskText}
          onChange={e => setEditTaskText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEditTask(); } }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          rows={3}
        />
      </Modal>
    </div>
  );
}

export default function ProjetsList({ projets, setProjets }) {
  const [showForm, setShowForm] = useState(false);
  const [editProjet, setEditProjet] = useState(null);
  const [form, setForm] = useState(PROJET_FORM_EMPTY);

  const openAdd = () => { setEditProjet(null); setForm(PROJET_FORM_EMPTY); setShowForm(true); };
  const openEdit = (p) => { setEditProjet(p); setForm({ ...p }); setShowForm(true); };

  const save = () => {
    if (!form.nom.trim()) return;
    if (editProjet) {
      setProjets(prev => prev.map(p => p.id === editProjet.id ? { ...p, nom: form.nom, emoji: form.emoji, couleur: form.couleur, echeance: form.echeance || '' } : p));
    } else {
      const id = Math.max(0, ...(projets || []).map(p => p.id), 0) + 1;
      setProjets(prev => [...(prev || []), { id, nom: form.nom, emoji: form.emoji, couleur: form.couleur, echeance: form.echeance || '', taches: [] }]);
    }
    setShowForm(false);
  };

  const deleteProjet = (id) => setProjets(prev => prev.filter(p => p.id !== id));

  const updateTaches = (projetId, taches) => {
    setProjets(prev => prev.map(p => p.id === projetId ? { ...p, taches } : p));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3 sticky top-0 bg-bg pt-1 pb-2 z-10">
        <span className="text-sm text-gray-500">{(projets || []).length} projet{(projets || []).length !== 1 ? 's' : ''}</span>
        <button onClick={openAdd}
          className="w-8 h-8 rounded-full text-white text-lg font-bold flex items-center justify-center shadow-md"
          style={{ background: 'var(--violet)' }}>+</button>
      </div>

      {(projets || []).length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-400 text-sm">Aucun projet pour l'instant</p>
          <p className="text-gray-300 text-xs mt-1">Crée ton premier projet avec le bouton +</p>
        </div>
      )}

      {(projets || []).map(projet => (
        <ProjetCard
          key={projet.id}
          projet={projet}
          onEdit={openEdit}
          onDelete={deleteProjet}
          onUpdateTaches={(taches) => updateTaches(projet.id, taches)}
        />
      ))}

      {/* Create / Edit project modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editProjet ? 'Modifier le projet' : 'Nouveau projet'}
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={save} disabled={!form.nom.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
              style={{ background: 'var(--violet)' }}>
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <label>
            <span className="text-xs text-gray-500 block mb-1">Nom du projet *</span>
            <input autoFocus value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Lancement boutique" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </label>
          <div className="flex gap-3">
            <label className="flex-shrink-0">
              <span className="text-xs text-gray-500 block mb-1">Emoji</span>
              <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-xl text-center" maxLength={2} />
            </label>
            <label className="flex-1">
              <span className="text-xs text-gray-500 block mb-1">Échéance (optionnel)</span>
              <input type="date" value={form.echeance || ''} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-2">Couleur</span>
            <div className="flex gap-3">
              {PROJET_PALETTE.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, couleur: c }))}
                  className="w-8 h-8 rounded-full flex-shrink-0 transition-transform"
                  style={{
                    background: c,
                    transform: form.couleur === c ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: form.couleur === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none',
                  }} />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

