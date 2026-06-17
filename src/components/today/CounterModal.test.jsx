import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CounterModal from './CounterModal';

function setup(props = {}) {
  const onChange = vi.fn();
  const onReset = vi.fn();
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <CounterModal
      open title="🙏 Prières" value={3}
      onChange={onChange} onReset={onReset} onSave={onSave} onClose={onClose}
      accent="var(--red)" {...props}
    />,
  );
  return { onChange, onReset, onSave, onClose };
}

describe('CounterModal', () => {
  it('renders the title and current value', () => {
    setup();
    expect(screen.getByText('🙏 Prières')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('increments and decrements via onChange', () => {
    const { onChange } = setup({ value: 3 });
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(onChange).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByRole('button', { name: '−' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('never decrements below zero', () => {
    const { onChange } = setup({ value: 0 });
    fireEvent.click(screen.getByRole('button', { name: '−' }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('wires the reset and save actions', () => {
    const { onReset, onSave } = setup();
    fireEvent.click(screen.getByText('Réinitialiser'));
    fireEvent.click(screen.getByText('Enregistrer'));
    expect(onReset).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <CounterModal open={false} title="x" value={0} onChange={() => {}} onReset={() => {}} onSave={() => {}} onClose={() => {}} accent="var(--red)" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
