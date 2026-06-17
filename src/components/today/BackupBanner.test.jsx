import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BackupBanner from './BackupBanner';

describe('BackupBanner', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<BackupBanner show={false} hasBackup={false} onExport={() => {}} onDismiss={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the first-backup copy when there is no prior backup', () => {
    render(<BackupBanner show hasBackup={false} onExport={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText(/Aucune sauvegarde encore/)).toBeInTheDocument();
  });

  it('shows the stale-backup copy when a backup exists', () => {
    render(<BackupBanner show hasBackup onExport={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText(/plus d'une semaine/)).toBeInTheDocument();
  });

  it('wires export and dismiss', () => {
    const onExport = vi.fn();
    const onDismiss = vi.fn();
    render(<BackupBanner show hasBackup onExport={onExport} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Exporter'));
    fireEvent.click(screen.getByLabelText('Ignorer'));
    expect(onExport).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
