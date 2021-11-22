/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class TestData {

    get location() {
        // implement by subclass
    }

    get scenario() {
        // implement by subclass
    }

    get description() {
        return '';
    }

    /**
     * deliver test data as they should be stored under 'approot.location'
     * @return {Promise<void>}
     */
    async data() {
        // implement by subclass
    }
}
