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

import Directory                       from "/thoregon.archetim/lib/directory.mjs";

import UnifiedFileDescriptor           from "./unifiedfiledescriptor.mjs";
import HttpsStorageAdapter             from "./storage/httpsstorageadapter.mjs";
import URLReferenceAdapter             from "./storage/urlreferenceadapter.mjs";
import LocalStorageAdapter             from "./storage/localstorageadapter.mjs";
import IPFSStorageAdapter              from "./storage/ipfsstorageadapter.mjs";
import IDXDBStorageAdapter             from "./storage/idxbdstorageadapter.mjs";

import { ErrFileStorageAdapterExists } from "../errors.mjs";

//
// consts
//

//
// adapter mapping
//

const displayAdapters = new Map();
const storageAdapters = new Map();

//
// functions (check move to polyfills)
//

const atob = globalThis.atob ?? function atob(a) {
    return new Buffer(a, 'base64').toString('binary');
};


export default class Mediathek {

    constructor() {
        this.stopped        = true;
        this.defaultAdapter = undefined;
    }

    //
    // init
    //

    static async open() {
        const mediathek = new this();
        try { await mediathek.start() } catch (e) { console.lgo("Mediathek could not be started", e) }
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
    // API
    //

    get root() {
        return me?.mediathek;
    }

    get tags() {
        return me?.tags;
    }

    async getByCID(cid) {
        const ufd = await this.root.getCID(cid);
        return ufd;
    }

    async add(content, { filename, mimetype, storage, credentials, mediathek = true, tags, timeout, onProgress = () => {} } = {}, abortSignal) {
        // no content, no UFD
        if (content == undefined || content === '') return;

        const store = this.storageAdapter(storage);     // get the storage adapter
        content     = store.adjustContent(content);
        let cid     = await store.cid(content);         // get the content id for the content

        let ufd = await this.getByCID(cid);
        if (ufd && ufd.hasSource()) {
            // tell the storage adapter that this content should be stored already. adapter is responsible to ensure persistence.
            // await store.add(content, { prevadd: true, filename, mimetype, credentials, onProgress, abortSignal, timeout });
            console.log(":CID", cid);
            return ufd;
        }

        // todo [OPEN]: determine mimetype if not provided

        const res = await store.add(content, { filename, mimetype, credentials, tags, onProgress, abortSignal, timeout, mediathek: this });
        if (res.err) {
            console.log("Mediathek", res.err);
            return ;
        }
        cid = res.cid;

        // now create the unified file descriptor
        ufd = ufd ?? await UnifiedFileDescriptor.create({ cid, content, name: filename, mimetype, tags: tags == undefined ? '' : Array.isArray(tags) ? tags.join(',') : tags.toString() });

        // create and attach a source
        let source = await store.createSource(cid, { filename, mimetype, credentials, content, use: true, mediathek: this });
        if (source) {
            const sources = ufd.sources;
            await sources.add(source);
        }

        // todo: preview

        // managed by mediathek
        if (mediathek && tags) {
            await this.maintainTags(cid, tags);
        }

        // maintain CID registry
        await this.root.addCID(cid, ufd);

        console.log("+CID", cid);

        return ufd;
    }

    addSource(cid, content, { filename, mimetype, storage, credentials, mediathek = true, tags, timeout, onProgress = () => {} } = {}, abortSignal) {
        // todo
    }

    get(cdi) {
        // const store = this.storageAdapter(storage);     // get the storage adapter

    }

    async getDataUrl(source) {
        const url = await source.getUrl();
        const store = this.getStorageAdapterFor(url);
        if (!store) return;
        const b64data = await store.getDataUrl(source);
        return b64data;
    }

    /**
     *
     * @param cid       cid of resource
     * @param tags      arrays of tags for this resource
     * @returns {Promise<void>}
     */
    maintainTags(cid, tags) {
        const mttags = this.tags;
        for (const tag of tags) {
            let tagcids = mttags.get(tag);
            if (!tagcids) {
                tagcids = Directory.create(); // todo [OPEN]: need persistent 'Set'
                mttags.put(tag, tagcids);
            }
            tagcids.put(cid, 1);
        }
    }

    removeTags(cid, tags) {
        const mttags = this.tags;
        for (const tag of tags) {
            let tagcids = mttags.get(tag);
            if (!tagcids) continue;
            tagcids.remove(cid);
        }
    }

/*
    async addMT(content, { filename, mimetype, storage, credentials, tags } = {}) {
        return await this.add(content, { mediathek: true, filename, mimetype, storage, credentials, tags });
    }
*/

    async cid(content) {
        let store = this.storageAdapter(storage);
        const cid = await store.cid(content);
        return cid;
    }

    async allCIDs() {
        return this.root.allCIDs();
    }

    async hasCID(cid) {
        return this.root.hasCID(cid);
    }

    async exists(content) {
        let cid = await this.cid(content);
        return this.existsCID(cid);
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
