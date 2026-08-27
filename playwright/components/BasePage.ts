import { Locator, Page } from "@playwright/test";

export default abstract class BasePage {

    public readonly page: Page;
    protected readonly pageUrl: string;

    protected constructor(page: Page, pageUrl: string) {
        this.page = page;
        this.pageUrl = pageUrl;
    }

    async goto() {
        await this.page.goto(this.pageUrl);
    }

    abstract getTitle(): Locator;
}
