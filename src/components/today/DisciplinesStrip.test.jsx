import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DisciplinesStrip from './DisciplinesStrip';

function setup(over = {}) {
  const props = {
    hab: { prieres: 2, cigarettes: 0, note: '' },
    sportDone: false,
    sportLabel: '',
    prieresProps: {},
    cigsProps: {},
    onOpenSport: vi.fn(),
    onOpenNote: vi.fn(),
    ...over,
  };
  render(<DisciplinesStrip {...props} />);
  return props;
}

describe('DisciplinesStrip', () => {
  it('renders the prières count', () => {
    setup();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens the sport sheet', () => {
    const p = setup();
    fireEvent.click(screen.getByText('Sport'));
    expect(p.onOpenSport).toHaveBeenCalledOnce();
  });

  it('opens the note modal (empty note shows a placeholder label)', () => {
    const p = setup();
    fireEvent.click(screen.getByText('Note…'));
    expect(p.onOpenNote).toHaveBeenCalledOnce();
  });

  it('shows the sport label when a session is done', () => {
    setup({ sportDone: true, sportLabel: 'Gym' });
    expect(screen.getByText('✓ Gym')).toBeInTheDocument();
  });

  it('spreads the long-press handlers onto the prières chip', () => {
    const onClick = vi.fn();
    setup({ prieresProps: { onClick } });
    fireEvent.click(screen.getByText('🙏'));
    expect(onClick).toHaveBeenCalled();
  });
});
