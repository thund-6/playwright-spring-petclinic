import {test} from "@playwright/test";

/**
 * Automatically generate tags for test classes by adding @GenerateTags(__filename) above class declaration.
 * Usage:
 * ```
 * import { GenerateTags } from "@util/AbstractTest";
 * @GenerateTags(__filename, [ "foo", "bar" ])
 * class TemplateTest extends BaseTest {
 * ```
 * @param filename the __filename Node.js variable
 * @param extraTags { string[] } Optional additional tags to be included after the PATH tags
 */
export function GenerateTags(filename: string, extraTags: string[] = []) {
    return function<T extends { new(...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            tags = [...BaseTest.tagsFromPath(filename), ...extraTags];
        };
    }
}

/**
 * Base test class that defines the structure of tests.
 * @param tags - If you don't use @GenerateTags(__filename), you must define tags manually
 * @param tests - A function containing Playwright `tests()`
 */
export default abstract class BaseTest {
    protected readonly tags!: string[];
    protected abstract tests(): void;


    run(): void {
        BaseTest.wrap(this.tags, () => {
            this.tests();
        });
    }

    /**
     * Wraps the tests in tags, letting us output stuff like "@UnitTests > @components > @UserReference" for easier navigation
     */
    static wrap(tags: string[], inner: () => void) {
        if (tags == null) { throw new Error("Tags are undefined. Either add @GenerateTags(__filename) above test class, or override 'tags'!"); }
        if (tags.length === 0) { inner(); return; }
        test.describe(`@${tags[0]}`, () => BaseTest.wrap(tags.slice(1), inner));
    }

    static tagsFromPath(filename: string): string[] {
        const parts = filename.split("/");
        const rootIndex = parts.indexOf("tests") + 1;
        return parts
            .slice(rootIndex)
            .map(part => part.replace(/\.test\.[jt]s$/, ""));
    }
}
