import BaseTest, {AutoRun, GenerateTags} from "@components/BaseTest";
import {expect, test} from "@utils/Fixtures";
import Messages from "@utils/Messages";
import TestUtil from "@utils/TestUtil";

@AutoRun
@GenerateTags(__filename)
class SpecialtiesTest extends BaseTest {

    protected tests(): void {

        test("Specialties title appears", async ({ specialties }) => {
            await expect(specialties.getTitle()).toHaveText(Messages.get("specialties"));
        });

        test("Test table", async ({ specialties }) => {
            TestUtil.testTable(specialties.page, [], specialties.table, async (page, columns, entity) => {
                
            });
        });

    }

}
