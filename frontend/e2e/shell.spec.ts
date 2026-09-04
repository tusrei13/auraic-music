import { test, expect } from '@playwright/test';

test('home exposes the listening shell and empty player state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Feel the Aura/i })).toBeVisible();
  await expect(page.getByText('Vui lòng chọn một bài hát để bắt đầu')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tìm kiếm nhạc' })).toBeVisible();
});

test('search input is keyboard accessible', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Tìm kiếm nhạc' });
  await search.click();
  await search.fill('ambient');
  await expect(search).toHaveValue('ambient');
  await search.press('Escape');
  await expect(search).toHaveAttribute('aria-expanded', 'false');
});

test('voice search puts the recognized phrase into the search input', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeSpeechRecognition {
      static instance: FakeSpeechRecognition;
      onstart: (() => void) | null = null;
      onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null = null;
      onerror: ((event: { error: string; message: string }) => void) | null = null;
      onnomatch: (() => void) | null = null;
      onend: (() => void) | null = null;

      constructor() {
        FakeSpeechRecognition.instance = this;
      }

      start() {
        this.onstart?.();
      }

      stop() {
        this.onend?.();
      }

      abort() {
        this.onend?.();
      }
    }

    Object.defineProperty(window, 'SpeechRecognition', { value: FakeSpeechRecognition });
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: FakeSpeechRecognition });
    Object.defineProperty(window, '__emitSpeechResult', {
      value: (transcript: string) => FakeSpeechRecognition.instance.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript } }],
      }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Tìm kiếm bằng giọng nói' }).click();
  await page.evaluate(() => {
    (window as unknown as { __emitSpeechResult: (transcript: string) => void }).__emitSpeechResult('nhạc ambient');
  });

  await expect(page.getByRole('combobox', { name: 'Tìm kiếm nhạc' })).toHaveValue('nhạc ambient');
});

test('search keeps a visible keyboard focus indicator', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Tìm kiếm nhạc' });
  await search.focus();
  await expect(search).toBeFocused();
  await expect.poll(() => search.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('home remains usable on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Feel the Aura/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tìm kiếm nhạc' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('interactive controls expose accessible names and touch-safe bounds', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Tìm kiếm nhạc' });
  const box = await search.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await search.fill('ambient');
  await expect(page.getByRole('button', { name: 'Xóa nội dung tìm kiếm' })).toHaveAccessibleName('Xóa nội dung tìm kiếm');
});

test('disabled product surface keeps its route isolated', async ({ page }) => {
  await page.goto('/community');
  await expect(page).toHaveURL(/\/community$/);
  await expect(page.getByText('Trending now')).toHaveCount(0);
});
