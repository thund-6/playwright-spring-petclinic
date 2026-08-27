import { Page } from "@playwright/test";

export default class APIUtil {

    static async mockApiCall(page: Page, url: string, data: Record<string, any>) {
        await page.route(url, async route => {
            await route.fulfill({ json: data });
        });
    }

    // /**
    //  * Will capture all calls to `url` on the current `page` and return `data`
    //  */
    // static async mockApiCall(page: Page, url: string, data: Record<string, any>) {
    //     await page.route(PlaywrightUtil.getApiUrl(url), async route => {
    //         await route.fulfill({ json: data });
    //     });
    // }

    // /**
    //  * Returns a url for use in the PlaywrightUtil.mockApiCall function.
    //  */
    // static getApiUrl(url: string) {
    //     return `*/**/${url.replace(/^\//, "")}**`;
    // }

}