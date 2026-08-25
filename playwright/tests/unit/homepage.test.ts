import BaseTest, {GenerateTags} from "@components/BaseTest";
import {expect, test} from "@utils/Fixtures";
import Homepage from "@POMs/Homepage";
import Messages from "@utils/Messages"

@GenerateTags(__filename)
class HomepageTest extends BaseTest {

    protected tests(): void {

        test("Homepage title appears", async ({ page }) => {
            const homepage = new Homepage(page);
            await homepage.goto();

            await expect(homepage.getTitle()).toHaveText(Messages.get("welcome"));
        });

    }

}
new HomepageTest().run();
