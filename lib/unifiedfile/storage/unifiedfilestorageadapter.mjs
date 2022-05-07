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

    async cid(content, { abortSignal } = {}) {
        // implement by subclass
        throw ErrNotImplemented("cid()");
    }

    async createSource(cid, { filename, mimetype, credentials, use = false } = {}) {
        // implement by subclass
        throw ErrNotImplemented("exists()");
    }

    //
    // responsibility
    //

    responsibleFor(uri) {
        return false;
    }

    static async init() {
        // implement by subclass
        return this;
    }
}
