/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import UnifiedFileStorageAdapter from "./unifiedfilestorageadapter.mjs";
import FileSource                from "../filesource.mjs";

import { ErrCIDMissing, ErrNotImplemented } from "../../errors.mjs";

//
// globals
//

const EXISTS_TIMEOUT = 100;
let   ipfs;

export default class IPFSStorageAdapter extends UnifiedFileStorageAdapter {

    static get id() {
        return 'ipfs';
    }

    static get description() {
        return 'IPFS Adapter';
    }

    //
    // API
    //

    async add(content, { filename, mimetype, credentials, onProgress, abortSignal, timeout, prevadd=false } = {}) {
        const progress = onProgress ? (loaded) => onProgress(loaded, content.length) : () => {};
        const result = await ipfs.add(content, { progress, signal: abortSignal, timeout });
        const cid = result?.cid;
        if (cid) {
            await ipfs.pin.add(cid);
            return { filename, mimetype, cid: result.cid.toString(), created: universe.now, _ipfs: result };
        }
        throw ErrCIDMissing(`IPFS add does not return a CID: ${filename ?? '<unnamed>'}`);
    }

    async cid(content, { abortSignal } = {}) {
        const result = await ipfs.add(content, { onlyHash: true, signal: abortSignal });
        return result?.cid?.toString();
    }

    async createSource(cid, { filename, mimetype, credentials, use = false } = {}) {
        if (!cid) throw ErrCIDMissing(filename);
        const source = await FileSource.initiate({ uri: `ipfs:${cid}`, mimetype, credentials, use });
        return source;
    }

    //
    // responsibility
    //

    responsibleFor(uri) {
        return uri && uri.startsWith('ipfs:');
    }

    static async init() {
        // todo: add a listener when the ipfs will be available
        if (!universe.heavymatter) return;

        ipfs = await universe.heavymatter.ipfs;
        // if !ipfs throw
        return this;
    }

}
