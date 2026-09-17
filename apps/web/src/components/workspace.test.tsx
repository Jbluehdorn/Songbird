// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { createSong } from '@songbird/song-core';
import { HarmonizerPage } from '../features/harmonizer/HarmonizerPage';
import { LearnPage } from '../features/learn/LearnPage';
import { Dashboard } from '../shell/Dashboard';

afterEach(cleanup);

describe('honest and keyboard-accessible feature boundaries', () => {
  it('offers the approved tool tiles as labelled keyboard-operable links', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    const harmonizer = screen.getByRole('link', { name: 'Harmonizer' });
    const chords = screen.getByRole('link', { name: 'Chord Finder' });
    expect(harmonizer).toHaveAttribute('href', '/harmonizer');
    expect(harmonizer).toHaveAccessibleDescription('Add harmony to your melody.');
    expect(chords).toHaveAttribute('href', '/chord-finder');
    expect(chords).toHaveAccessibleDescription('Find a progression that fits.');
    expect(screen.queryByText('Open workspace')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    await userEvent.tab();
    expect(harmonizer).toHaveFocus();
    await userEvent.tab();
    expect(chords).toHaveFocus();
  });

  it('does not present capture or transcription as working', () => {
    render(
      <MemoryRouter>
        <HarmonizerPage stage="entry" song={createSong('ui')} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Import WAV or MP3' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Record a melody' })).toBeDisabled();
    expect(
      screen.getByText('Musical tools are not available in this build'),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: /Open Chord Finder/ })).toHaveAttribute(
      'href',
      '/chord-finder/entry',
    );
  });

  it('keeps the original tool/stage in the learning return link', async () => {
    const song = createSong('lesson');
    song.workspace.helpReturn = { tool: 'harmonizer', stage: 'builder' };
    const before = structuredClone(song);
    render(
      <MemoryRouter>
        <LearnPage topic="keys" song={song} />
      </MemoryRouter>,
    );
    const back = screen.getByRole('link', { name: /Back to Harmonizer/ });
    await userEvent.tab();
    expect(back).toHaveFocus();
    expect(back).toHaveAttribute('href', '/harmonizer/builder');
    expect(song).toEqual(before);
    expect(
      screen.getByText(/Audible examples and try-it activities are not available/),
    ).toBeVisible();
  });

  it('returns dashboard learning to the dashboard across topic navigation', async () => {
    const song = createSong('dashboard-lesson');
    const before = structuredClone(song);
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/learn', state: { learningOrigin: 'dashboard' } }]}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/learn" element={<LearnPage song={song} />} />
          <Route path="/learn/keys" element={<LearnPage topic="keys" song={song} />} />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('link', { name: /^What is a key/ }));
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
      'href',
      '/',
    );
    await userEvent.click(screen.getByRole('link', { name: 'Browse all topics' }));
    await userEvent.click(screen.getByRole('link', { name: 'Back to dashboard' }));
    expect(screen.getByRole('link', { name: 'Harmonizer' })).toBeVisible();
    expect(song).toEqual(before);
  });

  it('uses the visible tool origin even if a read-only snapshot remembers another tool', () => {
    const song = createSong('read-only-help');
    song.workspace.helpReturn = { tool: 'harmonizer', stage: 'builder' };
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/learn/harmony',
            state: { learningOrigin: { tool: 'chord-finder', stage: 'progression' } },
          },
        ]}
      >
        <LearnPage topic="harmony" song={song} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Back to Chord Finder' })).toHaveAttribute(
      'href',
      '/chord-finder/progression',
    );
  });
});
