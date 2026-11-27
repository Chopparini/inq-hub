import { test, expect } from '@playwright/test';

const USER = process.env.LIVE_USER ?? 'handlowy';
const PASSWORD = process.env.LIVE_PASSWORD ?? 'demo123';

test('handlowiec loguje się i dodaje wycenę', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('Nazwa użytkownika').fill(USER);
  await page.getByPlaceholder('Hasło').fill(PASSWORD);
  await page.getByRole('button', { name: 'Zaloguj się' }).click();

  const quotes = page.getByText(/^WYC-/);
  await expect(quotes.first()).toBeVisible();
  const before = await quotes.count();

  await page.getByRole('button', { name: 'Dodaj wycenę' }).click();
  await page.getByPlaceholder('np. Nadruk jednokolorowy, dostawa w 2 partiach').fill('Test E2E');
  await page.getByRole('button', { name: 'Utwórz wycenę' }).click();

  await expect(page.getByText('Nowa wycena została dodana do bazy.')).toBeVisible();
  await expect(quotes).toHaveCount(before + 1);
});