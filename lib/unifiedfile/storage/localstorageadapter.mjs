/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import UnifiedFileStorageAdapter from "./unifiedfilestorageadapter.mjs";

export default class LocalStorageAdapter extends UnifiedFileStorageAdapter {

    static get id() {
        return 'local';
    }

    static get description() {
        return 'Local Filesystem Adapter';
    }

    //
    // responsibility
    //

    responsibleFor(uri) {
        return uri && uri.startsWith('fs:');
    }

    static async init() {
        return this;
    }
}
