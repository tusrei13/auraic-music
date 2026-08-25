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

test('home remains usable on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Feel the Aura/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tìm kiếm nhạc' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('disabled product surface keeps its route isolated', async ({ page }) => {
  await page.goto('/community');
  await expect(page).toHaveURL(/\/community$/);
  await expect(page.getByText('Trending now')).toHaveCount(0);
});
