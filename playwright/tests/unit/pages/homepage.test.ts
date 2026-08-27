import BaseTest, {AutoRun, GenerateTags} from "@components/BaseTest";
import {expect, test} from "@utils/Fixtures";
import Homepage from "@POMs/Homepage";
import Messages from "@utils/Messages"

@AutoRun
@GenerateTags(__filename)
class HomepageTest extends BaseTest {

    protected tests(): void {

        test("Homepage title appears", async ({ homepage }) => {
            await expect(homepage.getTitle()).toHaveText(Messages.get("welcome"));
        });

    }

}
