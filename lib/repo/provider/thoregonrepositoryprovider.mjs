/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import ThoregonDirectoryProvider from "../../directory/provider/thoregondirectoryprovider.mjs";

export default class ThoregonRepositoryProvider extends ThoregonDirectoryProvider {

    get name() {
        // implement by subclass
    }

    async init() {
        // implement by subclass
    }

    async lookup(componentname) {
        // implement by subclass
    }
}
