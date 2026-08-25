import BasePage from "@POMs/BasePage";
import {Page} from "@playwright/test";

export default class Homepage extends BasePage {

    constructor(page: Page) {
        super(page, "/");
    }

    getTitle() {
        return this.page.getByRole('heading', { level: 2 });
    }

}
