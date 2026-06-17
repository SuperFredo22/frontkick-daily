import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionsImportantes from './ActionsImportantes';

function baseProps(over = {}) {
  return {
    bonus: [],
    showInput: false,
    onOpen: vi.fn(),
    onClose: vi.fn(),
    onAdd: vi.fn(),
    onAddQuick: vi.fn(),
    onRemove: vi.fn(),
    ...over,
  };
}

describe('ActionsImportantes', () => {
  it('logs a quick action in one tap', () => {
    const p = baseProps();
    render(<ActionsImportantes {...p} />);
    fireEvent.click(screen.getByText("🛠️ Travail sur l'app"));
    expect(p.onAddQuick).toHaveBeenCalledWith("🛠️ Travail sur l'app");
  });

  it('opens the free-text input via the + button', () => {
    const p = baseProps();
    render(<ActionsImportantes {...p} />);
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(p.onOpen).toHaveBeenCalledOnce();
  });

  it('adds a trimmed free-text action and closes', () => {
    const p = baseProps({ showInput: true });
    render(<ActionsImportantes {...p} />);
    fireEvent.change(screen.getByPlaceholderText(/Ce que tu as accompli/), { target: { value: '  Démarchage  ' } });
    fireEvent.click(screen.getByText('Ajouter'));
    expect(p.onAdd).toHaveBeenCalledWith('Démarchage');
    expect(p.onClose).toHaveBeenCalledOnce();
  });

  it('renders existing actions and removes them', () => {
    const p = baseProps({ bonus: [{ id: 1, texte: 'Bossé sur l\'app' }] });
    render(<ActionsImportantes {...p} />);
    expect(screen.getByText('Bossé sur l\'app')).toBeInTheDocument();
    fireEvent.click(screen.getByText('🗑️'));
    expect(p.onRemove).toHaveBeenCalledWith(1);
  });

  it('shows an empty hint when there is nothing logged', () => {
    render(<ActionsImportantes {...baseProps()} />);
    expect(screen.getByText(/Choisis une action rapide/)).toBeInTheDocument();
  });
});
