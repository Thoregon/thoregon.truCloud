/**
 * Top level (universe wide) object as entry point
 * to unified file descriptors and media services
 *
 * currently the mediathek is attached to an SSI
 *
 * todo:
 *  - introduce also public mediathek items (can be used universe wide by everybody)
 *  - introduce sharable mediatheks which can be used by
 *      - everybody (public access)
 *      - with credential
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import UnifiedFileDescriptor           from "./unifiedfiledescriptor.mjs";
import HttpsStorageAdapter             from "./storage/httpsstorageadapter.mjs";
import URLReferenceAdapter             from "./storage/urlreferenceadapter.mjs";
/*
import LocalStorageAdapter             from "./storage/localstorageadapter.mjs";
import IPFSStorageAdapter              from "./storage/ipfsstorageadapter.mjs";
import IDXDBStorageAdapter             from "./storage/idxbdstorageadapter.mjs";
*/

import { ErrFileStorageAdapterExists } from "../errors.mjs";

//
// consts
//

//
// adapter mapping
//

const displayAdapters = new Map();
const storageAdapters = new Map();

/**
 * MediathekBase
 *
 * baseclass for all mediatek objects
 */
export default class MediathekBase {

    constructor() {
        this.stopped        = true;
        this.defaultAdapter = undefined;
    }

    fileNameFromUrl(url) {
        if (!url) return;
        const i = url.lastIndexOf('/');
        return (i > -1) ? url.substring(i+1) : url;
    }

    //
    // init
    //

    static async open() {
        const mediathek = new this();
        try { await mediathek.start() } catch (e) { console.log("Mediathek could not be started", e) }
        return mediathek;
    }

    // add SFTP/SCP adapter
    async start() {
        // add default storage adapters provided by thoregon
        storageAdapters.set(HttpsStorageAdapter.id, await HttpsStorageAdapter.init());
        storageAdapters.set(URLReferenceAdapter.id, await URLReferenceAdapter.init());
        // storageAdapters.set(LocalStorageAdapter.id, await LocalStorageAdapter.init());
        // storageAdapters.set(IDXDBStorageAdapter.id, await IDXDBStorageAdapter.init());
        // storageAdapters.set(IPFSStorageAdapter.id,  await IPFSStorageAdapter.init());
        // storageAdapters.set(TorrentStorageAdapter.id, TorrentStorageAdapter);

        this.defaultAdapter = storageAdapters.get(HttpsStorageAdapter.id);  // todo [REFACTOR]: should be IPFS, add user setting
        this.stopped        = false;
    }

    async stop() {
        this.stopped = true;
    }

    //
    // utilities
    //

    getObjectUrl(surl) {
        if (surl.startsWith("file:")) {

        } else if (surl.startsWith("http:") || surl.startsWith("http:")) {
            const url = new URL(surl);
        }
    }

    //
    // API
    //

    get root() {
        return me?.mediathek;
    }

        get tags() {
            return me?.tags;
        }

    /*
        async getByCID(cid) {
            const ufd = await this.root.getCID(cid);
            return ufd;
        }
    */

    async add(content, { url = false, filename, mimetype, storage, credentials, mediathek = true, tags, timeout, onProgress = () => {} } = {}, abortSignal) {
        // no content, no UFD
        if (content == undefined || content === '') return;
        let uri;
        if (url) {
            uri = content;
        } else {
            const store = this.storageAdapter(HttpsStorageAdapter.id);
            ({ content, filename, mimetype, credentials } = await store.adjustItem(content, { filename, mimetype, storage, credentials, mediathek, tags, timeout, onProgress }));
            const res = await store.add(content, { filename, mimetype, credentials, tags, onProgress, abortSignal, timeout, mediathek });
            if (res.err) {
                console.log(">> Mediathek", res.err);
                return;
            }
            uri = res.uri;
        }

        // now create the unified file descriptor
        const ufd = await this.createUfd({ uri, name: filename, mimetype, mediathek });
        return ufd;
    }

    async createUfd({ uri, name: filename, mimetype, mediathek }) {
        // implement by subclass
    }

    // async getDataUrl(source) {
    //     const url = await source.getUrl();
    //     return this.getObjectUrl(url);
    // }

    async getDataUrlForURI(uri) {
        const store = this.getStorageAdapterFor(uri);
        if (!store) return;
        const { mimeType, dataUrl } = await store.asDataUrl(uri);
        return dataUrl;
    }

    //
    // Utils
    //

    abortController() {
        // const abortCtrl = new AbortController();
        // const abortSignal = abortCtrl.signal;
        return new AbortController();
    }

    //
    // storage adapters
    //

    storageAdapter(storage) {
        const Store =  this.getStorageAdapter(storage);
        if (Store) return Store;
        if (this.defaultAdapter) return this.defaultAdapter;
        throw ErrNoFileStorageAdapter(storage);
    }

    /**
     * add a storage adapter class
     *
     * @param adapter
     */
    addStorageAdapter(adapter) {
        if (storageAdapters.has(adapter.id)) throw ErrFileStorageAdapterExists(adapter.id);
        storageAdapters.set(adapter.id, adapter);
    }

    getStorageAdapterFor(uri) {
        const adapter = [...storageAdapters.values()].find(adapter => adapter.responsibleFor(uri));
        return adapter;
    }

    getStorageAdapter(id) {
        return storageAdapters.get(id);
    }

}
