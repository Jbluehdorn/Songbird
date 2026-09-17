import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { songSchema, type SongProject } from '@songbird/song-core';
import { arrangedSong, withSource } from '../fixtures/song';

async function savedValue(page: Page): Promise<unknown> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('songbird');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction('snapshots', 'readonly');
          const request = transaction.objectStore('snapshots').get('current');
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const snapshot: unknown = request.result;
            resolve(
              snapshot && typeof snapshot === 'object' && 'document' in snapshot
                ? snapshot.document
                : null,
            );
          };
          transaction.oncomplete = () => db.close();
        };
      }),
  );
}

async function savedSong(page: Page): Promise<SongProject> {
  return songSchema.parse(await savedValue(page));
}

async function expectQuietShell(page: Page) {
  await expect(page.getByRole('banner').getByRole('status')).toHaveCount(0);
  await expect(
    page.getByText(
      /Saved on this device|Saving on this device|Local recovery is not a cloud backup|No recordings are sent to a server|Its place in your workspace is saved/,
    ),
  ).toHaveCount(0);
}

async function expectHamburgerToggle(toggle: Locator) {
  await expect(toggle).toHaveCSS('border-top-width', '0px');
  await expect(toggle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(await toggle.boundingBox()).toMatchObject({ width: 44, height: 44 });
  expect(await toggle.locator('svg').boundingBox()).toMatchObject({
    width: 20,
    height: 20,
  });
  await expect(toggle.locator('svg path')).toHaveAttribute(
    'd',
    'M4 6h16M4 12h16M4 18h16',
  );
}

async function seed(page: Page, document: unknown, audio = false) {
  await page.evaluate(
    ({ document, audio }) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('songbird');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction(['snapshots', 'audio'], 'readwrite');
          transaction.objectStore('snapshots').put({ slot: 'current', document });
          if (audio)
            transaction.objectStore('audio').put({
              id: 'audio-1',
              blob: new Blob(['synthetic storage fixture'], { type: 'audio/wav' }),
            });
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onabort = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
    { document, audio },
  );
}

async function openWorkspace(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Song name' })).toBeEnabled();
  await expect
    .poll(async () => songSchema.safeParse(await savedValue(page)).success)
    .toBe(true);
  await expect(page.getByRole('heading', { name: 'Songbird dashboard' })).toBeAttached();
  await expectQuietShell(page);
}

async function backToDashboard(page: Page) {
  await page
    .getByRole('complementary', { name: 'Shared song context' })
    .getByRole('link', { name: 'Back to dashboard' })
    .click();
  await expect(page.getByRole('link', { name: 'Harmonizer', exact: true })).toBeVisible();
}

test('names, navigation, per-tool stages and lesson return survive reopening', async ({
  page,
  context,
}) => {
  await openWorkspace(page);
  const songName = page.getByRole('textbox', { name: 'Song name' });
  await page.getByText('Song name', { exact: true }).click();
  await expect(songName).toBeFocused();
  await songName.fill('Morning sketch');
  await expect.poll(async () => (await savedSong(page)).name).toBe('Morning sketch');
  await page.getByRole('link', { name: 'Harmonizer', exact: true }).click();
  await page.getByRole('link', { name: 'Build harmony', exact: true }).click();
  const editIcon = songName.locator('..').locator('svg');
  await expect(editIcon).toBeVisible();
  const iconBox = await editIcon.boundingBox();
  await page.mouse.click(
    iconBox!.x + iconBox!.width / 2,
    iconBox!.y + iconBox!.height / 2,
  );
  await expect(songName).toBeFocused();
  await songName.fill('Morning light');
  await expect.poll(async () => (await savedSong(page)).name).toBe('Morning light');
  await expectQuietShell(page);
  await page.getByRole('link', { name: 'What is a key?', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What is a key?' })).toBeVisible();
  await expect.poll(async () => (await savedSong(page)).workspace.lesson).toBe('keys');
  await page.reload();
  await page.getByRole('link', { name: 'Back to Harmonizer' }).click();
  await expect(page).toHaveURL(/harmonizer\/builder$/);
  await backToDashboard(page);
  await page.getByRole('link', { name: 'Chord Finder', exact: true }).click();
  await page.getByRole('link', { name: 'Build chords', exact: true }).click();
  await expect
    .poll(async () => (await savedSong(page)).workspace.stages['chord-finder'])
    .toBe('progression');
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(
    reopened.getByRole('link', { name: 'Chord Finder', exact: true }),
  ).toBeVisible();
  await expect(reopened).toHaveURL(/\/$/);
  await expect(reopened.getByRole('textbox', { name: 'Song name' })).toHaveValue(
    'Morning light',
  );
  await reopened.getByRole('link', { name: 'Chord Finder', exact: true }).click();
  await expect(reopened).toHaveURL(/chord-finder\/progression$/);
  await backToDashboard(reopened);
  await reopened.getByRole('link', { name: 'Harmonizer', exact: true }).click();
  await expect(reopened).toHaveURL(/harmonizer\/builder$/);
  await expect
    .poll(async () => (await savedSong(reopened)).workspace)
    .toMatchObject({
      lastTool: 'harmonizer',
      activeView: 'tool',
      stages: { harmonizer: 'builder' },
    });
  const revision = (await savedSong(reopened)).revision;
  await reopened.getByRole('link', { name: 'Songbird dashboard', exact: true }).click();
  await expect(
    reopened.getByRole('link', { name: 'Harmonizer', exact: true }),
  ).toBeVisible();
  expect((await savedSong(reopened)).revision).toBe(revision);
});

test('enforces a single editing tab and allows explicit takeover after it closes', async ({
  page,
  context,
}) => {
  await openWorkspace(page);
  await page.getByRole('textbox', { name: 'Song name' }).fill('Shared song');
  await expect.poll(async () => (await savedSong(page)).name).toBe('Shared song');
  const reader = await context.newPage();
  await reader.goto('/');
  await expect(
    reader.getByRole('heading', { name: 'This tab is read-only.' }),
  ).toBeVisible();
  const readerSongName = reader.getByRole('textbox', { name: 'Song name' });
  await expect(readerSongName).toBeDisabled();
  await expect(readerSongName).not.toHaveAttribute('title', 'Edit song name');
  await expect(readerSongName.locator('..').locator('svg')).toHaveCount(0);
  await reader.getByRole('link', { name: 'Chord Finder', exact: true }).click();
  await reader.getByRole('link', { name: 'Build chords', exact: true }).click();
  await reader.getByRole('link', { name: 'How do harmony parts work?' }).click();
  await expect(
    reader.getByRole('link', { name: 'Back to Chord Finder' }),
  ).toHaveAttribute('href', '/chord-finder/progression');
  await reader.getByRole('link', { name: 'Back to Chord Finder' }).click();
  await reader.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(reader.getByRole('button', { name: 'Expand sidebar' })).toBeEnabled();
  expect((await savedSong(page)).workspace.stages['chord-finder']).toBe('entry');
  await page.close();
  await reader.getByRole('button', { name: 'Try editing here' }).click();
  await expect(readerSongName).toBeEnabled();
  await expect(readerSongName).toHaveAttribute('title', 'Edit song name');
  await expect(readerSongName.locator('..').locator('svg')).toBeVisible();
  await reader.getByRole('textbox', { name: 'Song name' }).fill('Now editing here');
  await expect.poll(async () => (await savedSong(reader)).name).toBe('Now editing here');
});

test('retains blobs, drafts, accepted/protected notes, and interrupted work', async ({
  page,
}) => {
  await openWorkspace(page);
  const fixture = withSource(arrangedSong());
  fixture.workspace.jobs = [
    {
      id: 'interrupted',
      kind: 'analysis',
      inputs: { source: 0, selection: 0 },
      status: 'running',
      message: null,
    },
  ];
  await seed(page, fixture, true);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Processing was interrupted.' }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Song name' }).fill('Recovered song');
  await expect.poll(async () => (await savedSong(page)).name).toBe('Recovered song');
  const recovered = await savedSong(page);
  expect(recovered.lead).toEqual(fixture.lead);
  expect(recovered.analysis).toEqual(fixture.analysis);
  expect(recovered.workspace.reviewDraft).toEqual(fixture.workspace.reviewDraft);
  expect(recovered.harmony).toEqual(fixture.harmony);
  expect(recovered.workspace.jobs[0]!.status).toBe('interrupted');
  const audio = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const open = indexedDB.open('songbird');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction('audio', 'readonly');
          const request = transaction.objectStore('audio').get('audio-1');
          request.onsuccess = () => {
            const value: { blob: Blob } = request.result;
            void value.blob.text().then(resolve, reject);
          };
          request.onerror = () => reject(request.error);
          transaction.oncomplete = () => db.close();
        };
      }),
  );
  expect(audio).toBe('synthetic storage fixture');
});

test('shows failed saves honestly, offers JSON recovery, and retries', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (
        fail &&
        this.name === 'snapshots' &&
        value &&
        typeof value === 'object' &&
        'document' in value
      ) {
        const document = value.document;
        if (
          document &&
          typeof document === 'object' &&
          'name' in document &&
          document.name === 'Keep this idea'
        ) {
          fail = false;
          throw new DOMException('Storage quota reached', 'QuotaExceededError');
        }
      }
      return key === undefined ? put.call(this, value) : put.call(this, value, key);
    };
  });
  await openWorkspace(page);
  await page.getByRole('textbox', { name: 'Song name' }).fill('Keep this idea');
  await expect(
    page.getByRole('heading', { name: 'Your latest changes are not saved.' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Your latest changes are not saved.',
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect((await savedSong(page)).name).toBe('');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download song data' }).click();
  const download = await downloading;
  const path = await download.path();
  expect(path).not.toBeNull();
  expect(JSON.parse(await readFile(path!, 'utf8')).name).toBe('Keep this idea');
  await page.getByRole('button', { name: 'Retry saving' }).click();
  await expect.poll(async () => (await savedSong(page)).name).toBe('Keep this idea');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expectQuietShell(page);
});

test('does not replace a newer schema or invent a successful recovery', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openWorkspace(page);
  const future = { ...(await savedSong(page)), schemaVersion: 99 };
  await seed(page, future);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Your saved song needs attention.' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('not supported');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await savedValue(page)).toEqual(future);
});

test('keeps desktop and mobile navigation usable without fake feature actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openWorkspace(page);
  await page.getByRole('link', { name: 'Harmonizer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Import WAV or MP3' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Record a melody' })).toBeDisabled();
  const desktop = await new AxeBuilder({ page }).analyze();
  expect(desktop.violations).toEqual([]);
  const screenshotDirectory = process.env.SONGBIRD_SCREENSHOTS;
  if (screenshotDirectory) {
    await mkdir(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: join(screenshotDirectory, 'shell-desktop.png'),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('textbox', { name: 'Song name' })).toBeVisible();
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await expect(
    page
      .getByRole('region', { name: 'Shared song context' })
      .getByText('No recording yet'),
  ).toBeVisible();
  await expectQuietShell(page);
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  const mobile = await new AxeBuilder({ page }).analyze();
  expect(mobile.violations).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  if (screenshotDirectory) {
    await page.screenshot({
      path: join(screenshotDirectory, 'shell-mobile.png'),
      fullPage: true,
    });
  }
  await page.getByRole('link', { name: 'What is a key?', exact: true }).click();
  await page.getByRole('link', { name: 'Browse all topics' }).click();
  await expect(
    page.getByRole('heading', { name: 'A little understanding goes a long way.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Harmonizer' })).toBeVisible();
});

test('releases editing on navigation away and restores it when returning', async ({
  page,
}) => {
  await openWorkspace(page);
  await page.getByRole('textbox', { name: 'Song name' }).fill('Coming back');
  await expect.poll(async () => (await savedSong(page)).name).toBe('Coming back');
  await page.goto('about:blank');
  await page.goBack();
  await expect(page.getByRole('textbox', { name: 'Song name' })).toBeEnabled();
  await expect(page.getByRole('textbox', { name: 'Song name' })).toHaveValue(
    'Coming back',
  );
});

test('learning from the dashboard keeps its return path through topics and refresh', async ({
  page,
}) => {
  await openWorkspace(page);
  await expect(page.locator('#main-content')).toBeFocused();
  await page.getByRole('link', { name: 'Browse learning topics', exact: true }).click();
  await page.getByRole('link', { name: /^What is a key/ }).click();
  await page.reload();
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Back to dashboard' }),
  ).toHaveAttribute('href', '/');
  await page.getByRole('link', { name: 'Browse all topics' }).click();
  await page.getByRole('link', { name: /^Pulse, meter/ }).click();
  await page.getByRole('main').getByRole('link', { name: 'Back to dashboard' }).click();
  await expect(page.getByRole('link', { name: 'Harmonizer', exact: true })).toBeVisible();
  await expect(page.locator('#main-content')).toBeFocused();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`keeps the ${colorScheme} dashboard and tool surfaces accessible at desktop and mobile sizes`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await openWorkspace(page);
    await expect(page.locator('html')).toHaveCSS('color-scheme', colorScheme);
    const screenshotDirectory = process.env.SONGBIRD_SCREENSHOTS;
    if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });
    for (const [name, width, height] of [
      ['desktop', 1440, 900],
      ['mobile', 390, 844],
      ['narrow', 320, 640],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.mouse.move(0, 0);
      const songName = page.getByRole('textbox', { name: 'Song name' });
      await expect(page.getByText('Song name', { exact: true })).toBeVisible();
      await expect(songName).toHaveAttribute('title', 'Edit song name');
      await expect(songName).toHaveCSS('border-top-style', 'solid');
      await expect(songName).toHaveCSS(
        'border-top-color',
        colorScheme === 'dark' ? 'rgb(100, 113, 128)' : 'rgb(131, 144, 161)',
      );
      await expect(songName.locator('..').locator('svg')).toBeVisible();
      expect(
        await songName.evaluate((element) => {
          const field = element.getBoundingClientRect();
          const icon = element
            .parentElement!.querySelector('svg')!
            .getBoundingClientRect();
          const contentRight =
            field.right - parseFloat(getComputedStyle(element).paddingRight);
          return (
            icon.left > contentRight &&
            icon.right < field.right &&
            icon.top > field.top &&
            icon.bottom < field.bottom
          );
        }),
      ).toBe(true);
      const mainBox = await page.getByRole('main').boundingBox();
      const headerBox = await page.getByRole('banner').boundingBox();
      expect(mainBox).not.toBeNull();
      expect(headerBox).not.toBeNull();
      const expectedWidth = Math.min(width - (width > 760 ? 80 : 48), 1040);
      expect(mainBox!.width).toBe(expectedWidth);
      expect(mainBox!.x).toBe((width - expectedWidth) / 2);
      expect(mainBox!.y - headerBox!.height).toBe(width > 760 ? 32 : 24);
      const navigation = page.getByRole('navigation', { name: 'Songbird tools' });
      await expect(navigation.getByRole('link')).toHaveCount(2);
      for (const [tool, blurb] of [
        ['Harmonizer', 'Add harmony to your melody.'],
        ['Chord Finder', 'Find a progression that fits.'],
      ] as const) {
        const tile = navigation.getByRole('link', { name: tool, exact: true });
        await expect(tile).toHaveAccessibleDescription(blurb);
        const box = await tile.boundingBox();
        expect(box).not.toBeNull();
        expect(
          Math.abs(box!.width - box!.height),
          `${colorScheme}/${name}/${tool} should be square`,
        ).toBeLessThan(1);
        expect(box!.width).toBeLessThanOrEqual(176);
        expect(
          await tile.evaluate((element) => {
            const frame = element.getBoundingClientRect();
            const icon = element.querySelector('svg')!.getBoundingClientRect();
            const title = element.querySelector('strong')!.getBoundingClientRect();
            const blurbId = element.getAttribute('aria-describedby')!;
            const blurb = document.getElementById(blurbId)!.getBoundingClientRect();
            return (
              [icon, title, blurb].every(
                (part) => Math.abs(part.left + part.right - frame.left - frame.right) < 2,
              ) && Math.abs(icon.top + blurb.bottom - frame.top - frame.bottom) < 2
            );
          }),
        ).toBe(true);
        await expect(tile).toHaveCSS('transition-property', 'none');
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      if (name !== 'narrow') {
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        if (screenshotDirectory)
          await page.screenshot({
            path: join(screenshotDirectory, `shell-dashboard-${colorScheme}-${name}.png`),
            fullPage: true,
          });
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('link', { name: 'Chord Finder', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Start here', exact: true })).toHaveCSS(
      'color',
      colorScheme === 'dark' ? 'rgb(94, 231, 255)' : 'rgb(0, 109, 133)',
    );
    const sidebar = page.getByRole('complementary', { name: 'Shared song context' });
    await expect(sidebar.getByRole('link')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Songbird tools' })).toHaveCount(0);
    await expect(
      page.getByRole('navigation', { name: 'Chord Finder stages' }),
    ).toBeVisible();
    await expect
      .poll(async () => (await savedSong(page)).workspace.lastTool)
      .toBe('chord-finder');
    await expectQuietShell(page);
    const beforeCollapse = await savedSong(page);
    const expandedMain = await page.getByRole('main').boundingBox();
    await page.mouse.move(0, 0);
    await expect(sidebar.getByRole('button')).toHaveCount(1);
    await expectHamburgerToggle(
      sidebar.getByRole('button', { name: 'Collapse sidebar' }),
    );
    await sidebar.getByRole('button', { name: 'Collapse sidebar' }).press('Enter');
    const expandButton = sidebar.getByRole('button', { name: 'Expand sidebar' });
    await expect(expandButton).toBeFocused();
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    await expect(expandButton).toHaveAttribute('aria-controls', 'shared-song-context');
    await expect(sidebar.locator('#shared-song-context')).toBeHidden();
    await expect(sidebar.getByRole('link', { name: 'Back to dashboard' })).toBeVisible();
    expect((await sidebar.boundingBox())!.width).toBe(64);
    expect((await page.getByRole('main').boundingBox())!.width).toBeGreaterThan(
      expandedMain!.width,
    );
    expect(await savedSong(page)).toEqual(beforeCollapse);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    if (screenshotDirectory)
      await page.screenshot({
        path: join(
          screenshotDirectory,
          `shell-sidebar-${colorScheme}-collapsed-desktop.png`,
        ),
        fullPage: true,
      });
    for (const width of [1024, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      expect((await sidebar.boundingBox())!.width).toBe(64);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await expandButton.press('Space');
    await expect(
      sidebar.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar.locator('#shared-song-context')).toBeVisible();
    expect((await sidebar.boundingBox())!.width).toBe(240);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    if (screenshotDirectory)
      await page.screenshot({
        path: join(
          screenshotDirectory,
          `shell-sidebar-${colorScheme}-expanded-desktop.png`,
        ),
        fullPage: true,
      });
    await sidebar.getByRole('button', { name: 'Collapse sidebar' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.mouse.move(0, 0);
    await expect(
      sidebar.locator('button[aria-controls="shared-song-context"]'),
    ).toBeHidden();
    await expect(sidebar.getByRole('button')).toHaveCount(1);
    const mobileToggle = sidebar.getByRole('button', { name: 'Expand sidebar' });
    const mobileContext = sidebar.locator('#mobile-shared-song-context');
    await expectHamburgerToggle(mobileToggle);
    await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileToggle).toHaveAttribute(
      'aria-controls',
      'mobile-shared-song-context',
    );
    await expect(mobileContext).toBeHidden();
    const homeBox = await sidebar
      .getByRole('link', { name: 'Back to dashboard' })
      .boundingBox();
    const toggleBox = await mobileToggle.boundingBox();
    expect(toggleBox!.y).toBe(homeBox!.y);
    expect(toggleBox!.x).toBeGreaterThan(homeBox!.x + homeBox!.width);
    await mobileToggle.press('Enter');
    await expect(sidebar.getByRole('button', { name: 'Collapse sidebar' })).toBeFocused();
    await expect(
      sidebar.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(mobileContext.getByText('No recording yet')).toBeVisible();
    await expectQuietShell(page);
    await expect(sidebar.getByRole('link', { name: 'Back to dashboard' })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    if (screenshotDirectory)
      await page.screenshot({
        path: join(screenshotDirectory, `shell-sidebar-${colorScheme}-mobile.png`),
        fullPage: true,
      });
    await page.setViewportSize({ width: 320, height: 640 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    await sidebar.getByRole('button', { name: 'Collapse sidebar' }).press('Space');
    await expect(mobileContext).toBeHidden();
    await expect(sidebar.getByRole('button', { name: 'Expand sidebar' })).toBeFocused();
    expect(await savedSong(page)).toEqual(beforeCollapse);
    await page.setViewportSize({ width: 1440, height: 900 });
    expect((await sidebar.boundingBox())!.width).toBe(64);
    await expect(sidebar.locator('#shared-song-context')).toBeHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('link', { name: 'How do harmony parts work?' }).click();
    await expect(
      page.getByRole('link', { name: 'Back to Chord Finder' }),
    ).toHaveAttribute('href', '/chord-finder/entry');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await backToDashboard(page);
  });
}

test('follows live browser appearance changes without saving a theme or honoring mockup overrides', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await openWorkspace(page);
  const before = await savedSong(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(13, 14, 17)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(245, 246, 250)');
  await page.goto('/?preview=dark');
  await expect(page.getByRole('link', { name: 'Harmonizer', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  expect(await savedSong(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});
