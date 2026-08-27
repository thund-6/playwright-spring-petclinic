// fixtures.ts
import { test as base, Page } from '@playwright/test';
import Homepage from '@POMs/Homepage';
import Specialties from '@POMs/Specialties';

type Pages = {
    homepage: Homepage;
    owners: Page;
    veterinarians: Page;
    petTypes: Page;
    specialties: Specialties;
}

const test = base.extend<Pages>({
    page: async ({ page }, use) => {
        await page.goto('/');
        await use(page);
    },    
    homepage: async ({ page }, use) => {
        const homepage = new Homepage(page);
        await homepage.goto();
        await use(homepage);
    },
    specialties: async ({ page }, use) => {
        const specialties = new Specialties(page);
        await specialties.goto();
        await use(specialties);
    }

});

export { test };
export { expect } from '@playwright/test';
