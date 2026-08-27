import BasePage from "@components/BasePage";
import Table from "@components/Table";
import {Page} from "@playwright/test";

export default class Specialties extends BasePage {

    private readonly _table: Table;

    constructor(page: Page) {
        super(page, "/petclinic/specialties");
        this._table = new Table(this.page.locator("table"));
    }

    getTitle() {
        return this.page.getByRole('heading', { level: 2 });
    }

    public get table(): Table {
        return this._table;
    }

    // getTable(): Table {
    //     return this.table;
    // }

    // getHomeButton() {
        // return new Button
    // }

}
