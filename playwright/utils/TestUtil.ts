import Table from "@components/Table";
import { Locator, Page } from "@playwright/test";
import { expect } from "./Fixtures";

export default class TestUtil {

    /**
     * For testing all values in a table.
     * @param page
     * @param data Data that's expected to be in the table (order of elements matters - must match the order of elements in the table)
     * @param table
     * @param columnVerifier
     */
    static async testTable<T extends Record<string, any>>(page: Page, data: T[], table: Table, columnVerifier: ColumnVerifier<T>) {
        await expect(table.getTable()).toBeVisible();
        await expect(table.getRows()).toHaveCount(data.length);
        for (const [i, entity] of data.entries()) {
            const columns = table.getRowColumns(i);
            await columnVerifier(page, columns, entity);
        }
    }

}

/**
 * Method to test columns of a table.
 *
 * Usage:
 * ```ts
 * static verifyFooColumns = async (page, columns, entity) => {
 *     expect(LocatorUtil.getTableCellByHeader(columns, "foo")).toBe(entity.foo);
 * }
 * ```
 *
 * OPTIONAL: You can specify a type parameter of the entity to use autocomplete and TS type checking.
 * Otherwise, entity will default to type `Record<string, any>`.
 * ```ts
 * static verifyFooColumns<FooEntityType> = async (page, columns, entity) => {
 *     // "entity" will now have autocomplete and TS type checking
 * }
 * ```
 *
 *
 * @param page
 * @param columns Columns of one row of the table
 * @param entity The entity that is supposed to appear in the table
 */
export type ColumnVerifier<T = Record<string, any>> = (
    page: Page,
    columns: Locator,
    entity: T
) => Promise<void>;