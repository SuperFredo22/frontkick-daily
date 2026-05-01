import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTikTok, useFightFocus, useMarque } from '../hooks/useBanques';
import Modal from '../components/Modal';

const TABS = [
  { id: 'tiktok', label: 'TikTok', color: '#C0392B', bg: '#FEF2F2' },
  { id: 'fightfocus', label: 'FightFocus', color: '#00b4d8', bg: '#E0F7FA' },
  { id: 'marque', label: 'Marque', color: '#E67E22', bg: '#FFF3E0' },
];

function SortableItem({ item, banque, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isDone = item.statut === 'publiee' || item.statut === 'fait';
  const tab = TABS.find(t => t.id === banque);

  const label = banque === 'tiktok'
    ? item.titre
    : banque === 'fightfocus'
    ? `${item.code} — ${item.description}`
    : item.description;

  const badge = banque === 'tiktok' ? item.priorite
    : banque === 'fightfocus' ? item.priorite
    : item.phase;

  return (
    <div ref={setNodeRef} style={style} className={`flex items-start gap-3 bg-white rounded-xl shadow-card p-3 mb-2 ${isDone ? 'opacity-50' : ''}`}>
      <span {...attributes} {...listeners} className="drag-handle text-gray-300 text-lg mt-0.5 flex-shrink-0 select-none">⠿</span>
      <div className="flex-1 min-w-0" onClick={() => onEdit(item)}>
        <p className={`text-sm font-medium text-gray-800 leading-snug ${isDone ? 'line-through' : ''}`}>{label}</p>
        <div className="flex items-center gap-2 mt-1">
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: tab.bg, color: tab.color }}>
              {badge}
            </span>
          )}
          <span className="text-[10px] text-gray-400">
            {isDone ? (item.statut === 'publiee' ? '✅ Publiée' : '✅ Fait') : (item.statut === 'a_tourner' ? 'À tourner' : 'À faire')}
          </span>
        </div>
      </div>
    </div>
  );
}

function BanqueList({ banque, items, setItems }) {
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const tab = TABS.find(t => t.id === banque);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const active = items.filter(i => i.statut !== 'publiee' && i.statut !== 'fait');
  const done = items.filter(i => i.statut === 'publiee' || i.statut === 'fait');
  const ordered = [...active, ...done];

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex(i => i.id === active.id);
    const newIndex = ordered.findIndex(i => i.id === over.id);
    const newOrdered = arrayMove(ordered, oldIndex, newIndex);
    setItems(newOrdered);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setShowAdd(false);
  };

  const openAdd = () => {
    setEditItem(null);
    if (banque === 'tiktok') setForm({ statut: 'a_tourner', priorite: 'HAUTE', discipline: 'Tous', format: '', titre: '' });
    else if (banque === 'fightfocus') setForm({ statut: 'a_faire', priorite: 'P1', code: '', description: '' });
    else setForm({ statut: 'a_faire', phase: 'Phase 1', description: '' });
    setShowAdd(true);
  };

  const save = () => {
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...form, id: editItem.id } : i));
    } else {
      const newId = Math.max(0, ...items.map(i => i.id)) + 1;
      setItems(prev => [...prev, { ...form, id: newId }]);
    }
    setEditItem(null);
    setShowAdd(false);
  };

  const remove = () => {
    setItems(prev => prev.filter(i => i.id !== editItem.id));
    setEditItem(null);
  };

  const isOpen = !!editItem || showAdd;

  return (
    <>
      <div className="flex items-center justify-between mb-3 sticky top-0 bg-bg pt-1 pb-2 z-10">
        <span className="text-sm text-gray-500">{active.length} à faire · {done.length} fait</span>
        <button
          onClick={openAdd}
          className="w-8 h-8 rounded-full text-white text-lg font-bold flex items-center justify-center shadow-md"
          style={{ background: tab.color }}
        >+</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ordered.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {ordered.map(item => (
            <SortableItem key={item.id} item={item} banque={banque} onEdit={openEdit} />
          ))}
        </SortableContext>
      </DndContext>

      {/* Edit/Add modal */}
      <Modal
        open={isOpen}
        onClose={() => { setEditItem(null); setShowAdd(false); }}
        title={editItem ? 'Modifier' : 'Nouvel item'}
        footer={
          <div className="flex gap-2 w-full">
            {editItem && (
              <button onClick={remove} className="py-2.5 px-4 rounded-lg bg-red-50 text-sm font-medium" style={{ color: '#C0392B' }}>
                Supprimer
              </button>
            )}
            <button
              onClick={save}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ background: tab.color }}
            >
              Enregistrer
            </button>
            <button onClick={() => { setEditItem(null); setShowAdd(false); }} className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {banque === 'tiktok' && (
            <>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Titre</span>
                <input value={form.titre || ''} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Titre de la vidéo" />
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Format</span>
                <input value={form.format || ''} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Liste/Talking head" />
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Discipline</span>
                <input value={form.discipline || ''} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="BJJ, MMA, Muay Thai..." />
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Priorité</span>
                <select value={form.priorite || 'HAUTE'} onChange={e => setForm(f => ({ ...f, priorite: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option>HAUTE</option><option>MOYENNE</option><option>FAIBLE</option>
                </select>
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Statut</span>
                <select value={form.statut || 'a_tourner'} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="a_tourner">À tourner</option><option value="publiee">Publiée</option>
                </select>
              </label>
            </>
          )}
          {banque === 'fightfocus' && (
            <>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Code</span>
                <input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: BUG-01" />
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Description</span>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3} />
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Priorité</span>
                <select value={form.priorite || 'P1'} onChange={e => setForm(f => ({ ...f, priorite: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option>P1</option><option>P2</option><option>P3</option>
                </select>
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Statut</span>
                <select value={form.statut || 'a_faire'} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="a_faire">À faire</option><option value="fait">Fait</option>
                </select>
              </label>
            </>
          )}
          {banque === 'marque' && (
            <>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Description</span>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3} />
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Phase</span>
                <select value={form.phase || 'Phase 1'} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option>Phase 1</option><option>Phase 2</option><option>Phase 3</option>
                </select>
              </label>
              <label>
                <span className="text-xs text-gray-500 block mb-1">Statut</span>
                <select value={form.statut || 'a_faire'} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="a_faire">À faire</option><option value="fait">Fait</option>
                </select>
              </label>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

export default function Banques() {
  const [activeTab, setActiveTab] = useState('tiktok');
  const [tiktok, setTiktok] = useTikTok();
  const [fightfocus, setFightFocus] = useFightFocus();
  const [marque, setMarque] = useMarque();

  const setters = { tiktok: setTiktok, fightfocus: setFightFocus, marque: setMarque };
  const data = { tiktok, fightfocus, marque };
  const tab = TABS.find(t => t.id === activeTab);

  return (
    <div className="flex flex-col h-screen">
      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === t.id ? 'border-b-2' : 'border-transparent text-gray-400'}`}
            style={activeTab === t.id ? { borderColor: t.color, color: t.color } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-4 pt-3 pb-nav" style={{ background: '#FAFAFA' }}>
        <BanqueList
          key={activeTab}
          banque={activeTab}
          items={data[activeTab]}
          setItems={setters[activeTab]}
        />
      </div>
    </div>
  );
}
