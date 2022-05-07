/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import UnifiedFileStorageAdapter from "./unifiedfilestorageadapter.mjs";

export default class TorrentStorageAdapter extends UnifiedFileStorageAdapter {

    static get id() {
        return 'torrent';
    }

    static get description() {
        return 'Torrent Adapter';
    }

    //
    // responsibility
    //

    responsibleFor(uri) {
        return uri && uri.startsWith('torrent:');
    }

    static async init() {
        return this;
    }
}
