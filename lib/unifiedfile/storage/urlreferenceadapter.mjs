/**
 *
 *  referenced (download) only adapter
 *  - can't upload
 *  - but can reference any URL
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { getBase64DataOnly, isDataUrl } from "/evolux.util/lib/serialize.mjs";
import { isString }                     from "/evolux.util/lib/objutils.mjs";
import SEA                              from "/evolux.everblack/lib/crypto/sea.mjs";
import UnifiedFileStorageAdapter        from "./unifiedfilestorageadapter.mjs";
import FileSource                       from "../filesource.mjs";

const SALT = 'F2O4HI7VQgrZg4sh9VwYL0rQ68CCdub7';

export default class URLReferenceAdapter extends UnifiedFileStorageAdapter {


    static async init() {
        const adapter = await super.init();
        await adapter.initSalt();
        return adapter;
    }

    async initSalt() {
        this._salt = SALT;
    }

    //
    // responsibility
    //

    responsibleFor(uri) {
        return (uri?.startsWith('http:') ||  uri?.startsWith('https:')) ?? false;
    }

    //
    // identifier and type
    //

    static get id() {
        // implement by subclass
        return "url";
    }

    static get description() {
        return 'URL Reference Adapter';
    }

    //
    // API
    //

    /**
     * store the content
     * @param content
     * @param filename
     * @param mimetype
     * @param credentials
     * @param onProgress
     * @param abortSignal
     * @return {{ cid: String, size: Number, stime: Number }}
     */
    async add(content, { mediathek, filename, mimetype, credentials, onProgress, abortSignal, prevadd= false } = {}) {
        // implement by subclass
        if (!isString(content) && this.responsibleFor(content)) return;
        const cid = await this.cid(content);
        return { cid };
    }

    async cid(content, { abortSignal } = {}) {
        let salt = this._salt;
        if (!salt) salt = await this.initSalt();
        let cdi = await SEA.hash(content, salt);      // fast enough? how to support 'abortSignal'
        cdi = cdi.replaceAll("=", "");
        cdi = cdi.replaceAll("/", "-");
        return cdi;
    }

    /**
     * create a source reference to the content
     * @param cid
     * @param filename
     * @param mimetype
     * @param credentials
     * @param use
     * @returns {Promise<FileSource>}
     */
    async createSource(cid, { filename, mimetype, credentials, content, use = false } = {}) {
        try {
            let i;
            const url = new URL(content);
            const path = url.pathname;
            if (!filename) {
                i = path.lastIndexOf('/');
                if (i > -1) filename = path.substring(i+1);
            }
            i = filename.lastIndexOf('.');
            let ext;
            if (i > -1) ext = filename.substring(i + 1);
            if (!mimetype) {
                const r = await fetch(url.href);
                if (r.ok) {
                    mimetype = r.headers?.get("Content-Type");
                }
            }
            const source = await FileSource.create({ uri: url.href, filename, mimetype, credentials, use });
            return source;
        } catch (e) {
            console.log("Can't use URL", e);
        }
    }

    async getDataUrl(source) {
        const url = await source.getUrl();
        const res = await fetch(url);
        if (!res.ok) return;
        const blob   = await res.blob();
        const b46url = URL.createObjectURL(blob);
        return b46url;
    }

}
