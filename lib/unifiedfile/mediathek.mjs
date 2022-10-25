/**
 * Top level (universe wide) object as entry point
 * to unified file descriptors and media services
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import LocalStorageAdapter             from "./storage/localstorageadapter.mjs";
import IPFSStorageAdapter              from "./storage/ipfsstorageadapter.mjs";
import UnifiedFileDescriptor           from "./unifiedfiledescriptor.mjs";
import IDXDBStorageAdapter             from "./storage/idxbdstorageadapter.mjs";

import { ErrFileStorageAdapterExists } from "../errors.mjs";

//
// consts
//

const BASE64_MARKER = ';base64,';

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

    constructor(props) {
        // super(props);
        this.stopped = true;
    }

    //
    // init
    //

    static async open() {
        const mediathek = new this();
        await mediathek.start();
        return mediathek;
    }

    // add SFTP/SCP adapter
    async start() {
        // add default storage adapters provided by thoregon
        storageAdapters.set(LocalStorageAdapter.id, await LocalStorageAdapter.init());
        storageAdapters.set(IDXDBStorageAdapter.id, await IDXDBStorageAdapter.init());
        storageAdapters.set(IPFSStorageAdapter.id,  await IPFSStorageAdapter.init());
        // storageAdapters.set(TorrentStorageAdapter.id, TorrentStorageAdapter);

        this.stopped = false;
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

    async add(content, { filename, mimetype, storage, credentials, mediathek = false, tags, timeout, onProgress = () => {} } = {}, abortSignal) {
        const store = this.storageAdapter(storage);
        let   cid = await store.cid(content);

        let ufd = await this.root.getCID(cid);
        if (ufd) {
            // tell the storage adapter that this content should be stored already. adapter is responsible to ensure persistence.
            await store.add(content, { prevadd: true, filename, mimetype, credentials, onProgress, abortSignal, timeout });
            console.log(":CID", cid);
            return ufd;
        }

        const res = await store.add(content, { filename, mimetype, credentials, onProgress, abortSignal, timeout });
        cid = res.cid;

        // now create the unified file descriptor
        ufd = await UnifiedFileDescriptor.create({ name: filename, mimetype, tags: tags == undefined ? '' : Array.isArray(tags) ? tags.join(',') : tags.toString() });

        // create and attach a source
        let source = await store.createSource(cid, { filename, mimetype, credentials, use: true });
        const sources = await ufd.sources;
        await sources.add(source);

        // todo: preview

        // managed by mediathek
        if (mediathek) {
            // todo: maintain mediathek 'tags', ...
        }

        // maintain CID registry
        await this.root.addCID(cid, ufd);

        console.log("+CID", cid);

        return ufd;
    }

    async addMT(content, { filename, mimetype, storage, credentials, tags } = {}) {
        return await this.add(content, { mediathek: true, filename, mimetype, storage, credentials, tags });
    }

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

    convertDataURIToBinary(dataURI) {
        var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        var base64 = dataURI.substring(base64Index);
        var raw = atob(base64);
        var rawLength = raw.length;
        var array = new Uint8Array(new ArrayBuffer(rawLength));

        for(let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    }

    abortController() {
        // const abortCtrl = new AbortController();
        // const abortSignal = abortCtrl.signal;
        return new AbortController();
    }

    //
    // storage adapters
    //

    storageAdapter(storage) {
        const Store = storage
                      ? this.getStorageAdapter(storage)
                      : this.getStorageAdapter('ipfs');
        if (!Store) throw ErrNoFileStorageAdapter();
        return new Store();
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
        const adapter = Object.values(storageAdapters).find(adapter => adapter.responsibleFor(uri));
        return adapter;
    }

    getStorageAdapter(id) {
        return storageAdapters.get(id);
    }

}
