import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VictoiresDuJour from './VictoiresDuJour';

const hab = { prieres: 2, cigarettes: 1 };

describe('VictoiresDuJour', () => {
  it('renders nothing when there are no completed or postponed tasks', () => {
    const { container } = render(
      <VictoiresDuJour tachesFaites={[]} tachesReportees={[]} hab={hab} sportDone={false} sportLabel="" onUndoFait={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('lists completed tasks and the habits summary', () => {
    render(
      <VictoiresDuJour
        tachesFaites={[{ id: 1, label: 'Tourner une vidéo', banque: 'tiktok', statut: 'fait' }]}
        tachesReportees={[]}
        hab={hab} sportDone sportLabel="Club MMA" onUndoFait={() => {}}
      />,
    );
    expect(screen.getByText('Tourner une vidéo')).toBeInTheDocument();
    expect(screen.getByText('🙏 2')).toBeInTheDocument();
    expect(screen.getByText('🥊 Club MMA')).toBeInTheDocument();
  });

  it('calls onUndoFait with the task when undo is clicked', () => {
    const onUndoFait = vi.fn();
    const task = { id: 7, label: 'Mission', banque: 'marque', statut: 'fait' };
    render(
      <VictoiresDuJour tachesFaites={[task]} tachesReportees={[]} hab={hab} sportDone={false} sportLabel="" onUndoFait={onUndoFait} />,
    );
    fireEvent.click(screen.getByText('↩️'));
    expect(onUndoFait).toHaveBeenCalledWith(task);
  });

  it('shows postponed tasks even without completed ones', () => {
    render(
      <VictoiresDuJour
        tachesFaites={[]}
        tachesReportees={[{ id: 2, label: 'Reportée', banque: 'tiktok', statut: 'reporte' }]}
        hab={hab} sportDone={false} sportLabel="" onUndoFait={() => {}}
      />,
    );
    expect(screen.getByText('Reportée')).toBeInTheDocument();
  });
});
