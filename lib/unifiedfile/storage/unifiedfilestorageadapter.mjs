/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import { ErrNotImplemented } from "../../errors.mjs";
import FileSource            from "../filesource.mjs";

export default class UnifiedFileStorageAdapter {

    static async init() {
        const adapter = new this();
        return adapter;
    }

    //
    // responsibility
    //

    responsibleFor(uri) {
        return false;
    }

    //
    // identifier and type
    //

    static get id() {
        // implement by subclass
        throw ErrNotImplemented("id");
    }

    get id() {
        return this.constructor.id;
    }

    //
    // API
    //

    /**
     *
     * @param content
     * @param filename
     * @param mimetype
     * @param credentials
     * @param onProgress
     * @param abortSignal
     * @return {{ cid: String, size: Number, stime: Number }}
     */
    async add(content, { filename, mimetype, credentials, onProgress, abortSignal, prevadd=false } = {}) {
        // implement by subclass
        throw ErrNotImplemented("add()");
    }

    adjustContent(content) {
        // override by subclass if needed
        return content;
    }

    async adjustItem(content, { filename, mimetype, storage, credentials, mediathek, tags, timeout, onProgress } = {}) {
        return { content, filename, mimetype, credentials };
    }

    async cid(content, { abortSignal } = {}) {
        // implement by subclass
        throw ErrNotImplemented("cid()");
    }

    async createSource(cid, { filename, mimetype, credentials, use = false } = {}) {
        // implement by subclass
        throw ErrNotImplemented("createSource()");
    }

    async getDataUrl(source) {
        // implement by subclass
        throw ErrNotImplemented("getDataUrl()");
    }
}
