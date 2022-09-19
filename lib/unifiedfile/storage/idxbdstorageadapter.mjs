/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import UnifiedFileStorageAdapter from "./unifiedfilestorageadapter.mjs";
import { ErrNotImplemented }     from "../../errors.mjs";
import FileSource                from "../filesource.mjs";

//
// globals
//

const EXISTS_TIMEOUT = 100;
let   ipfs;

export default class IDXDBStorageAdapter extends UnifiedFileStorageAdapter {

    static get id() {
        return 'idxdb';
    }

    static get description() {
        return 'IDXDB Adapter';
    }

    //
    // API
    //

    async add(content, { filename, mimetype, credentials, onProgress, abortSignal, timeout, prevadd=false } = {}) {
        // const progress = onProgress ? (loaded) => onProgress(loaded, content.length) : () => {};
        // const result = await ipfs.add(content, { progress, signal: abortSignal, timeout });
        // return result;
    }

    async cid(content, { abortSignal } = {}) {
        // const result = await ipfs.add(content, { onlyHash: true, signal: abortSignal, timeout: EXISTS_TIMEOUT });
        // return result?.cid;
    }

    async createSource(cid, { filename, mimetype, credentials, use = false } = {}) {
        // if (!cid) throw ErrCIDMissing(filename);
        // const source = await FileSource.create({ uri: `ipfs:${cid}`, mimetype, credentials });
        // return source;
    }

    //
    // responsibility
    //

    responsibleFor(uri) {
        return uri && uri.startsWith('idxdb:');
    }

    static async init() {
        return this;
    }

}
