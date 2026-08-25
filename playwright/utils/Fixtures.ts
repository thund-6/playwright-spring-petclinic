// fixtures.ts
import { test as base } from '@playwright/test';

const test = base.extend({
    page: async ({ page }, use) => {
        await page.goto('/');
        await use(page);
    },
});

export { test };
export { expect } from '@playwright/test';
