import { useStorage } from './useStorage';
import { tiktokInitial } from '../data/tiktok';
import { fightfocusInitial } from '../data/fightfocus';
import { marqueInitial } from '../data/marque';

export function useTikTok() {
  return useStorage('tiktok', tiktokInitial);
}

export function useFightFocus() {
  return useStorage('fightfocus', fightfocusInitial);
}

export function useMarque() {
  return useStorage('marque', marqueInitial);
}

export function useAllBanques() {
  const [tiktok, setTiktok] = useTikTok();
  const [fightfocus, setFightFocus] = useFightFocus();
  const [marque, setMarque] = useMarque();

  const markDone = (banque, id) => {
    const doneStatut = banque === 'tiktok' ? 'publiee' : 'fait';
    if (banque === 'tiktok') {
      setTiktok(prev => prev.map(item => item.id === id ? { ...item, statut: doneStatut } : item));
    } else if (banque === 'fightfocus') {
      setFightFocus(prev => prev.map(item => item.id === id ? { ...item, statut: doneStatut } : item));
    } else if (banque === 'marque') {
      setMarque(prev => prev.map(item => item.id === id ? { ...item, statut: doneStatut } : item));
    }
  };

  const getNextItem = (banque, reportedToday) => {
    let items;
    if (banque === 'tiktok') items = tiktok;
    else if (banque === 'fightfocus') items = fightfocus;
    else items = marque;

    const activeStatut = banque === 'tiktok' ? ['a_tourner'] : ['a_faire'];
    return items.find(item =>
      activeStatut.includes(item.statut) &&
      !reportedToday.includes(`${banque}_${item.id}`)
    ) || null;
  };

  return { tiktok, setTiktok, fightfocus, setFightFocus, marque, setMarque, markDone, getNextItem };
}
