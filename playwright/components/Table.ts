import { Locator } from "@playwright/test";

export default  class Table {

    private readonly table: Locator;
    private readonly tableRows: Locator;

    /**
     * @param table Locator to the `<table>` element
     */
    constructor(table: Locator, rowsLocator?: Locator) {
        this.table = table;
        this.tableRows = this.table.locator("> tbody > tr");
    }

    getTable() {
        return this.table;
    }

    getRows() {
        return this.tableRows;
    }

    getRow(index: number): Locator {
        return this.tableRows.nth(index);
    }

    /**
     * Returns the columns of the (index)-th row.
     */
    getRowColumns(index: number): Locator {
        return this.getRow(index).locator("td");
    }

}