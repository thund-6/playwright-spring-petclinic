import messages from './messages.json';

export default class Messages {

    /**
     * Returns the text for the given key from messages.json.
     * Throws an error if the key can't be found.
     * @param key
     */
    static get(key: string): string {
        const value = (messages as Record<string, string>)[key];
        if (value === undefined) {
            throw new Error(`Missing message key "${key}" in messages.json`);
        }
        return value;
    }
}
