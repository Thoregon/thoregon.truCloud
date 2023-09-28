/**
 *
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

// const HTTPFILESIKN = 'http://127.0.0.1:7779';

const SALT = 'ksZGLUkuEGLSHGL3HxC3opTTeM14ePHG';

export default class HttpsStorageAdapter extends UnifiedFileStorageAdapter {

    static async init() {
        const adapter = await super.init();
        await adapter.initSalt();
        return adapter;
    }

    async initSalt() {
        this._salt = SALT;
    }

    // maybe in future
    // async initSalt() {
    //     let salt = await SSI.getSecretProperty("httpstoragesalt");
    //     if (!salt) {
    //         salt = universe.random();
    //         await SSI.setSecretProperty("httpstoragesalt", salt);
    //     }
    //     this._salt = salt;
    //     return salt;
    // }

    get sink() {
        return universe.HTTPFILESINK;
    }

    //
    // responsibility
    //

    responsibleFor(uri) {
        return uri?.startsWith('https:') || uri?.startsWith('http:');
        // return uri?.startsWith(universe.HTTPFILESINK);
    }

    //
    // identifier and type
    //

    static get id() {
        // implement by subclass
        return "https";
    }

    static get description() {
        return 'HTTPS Adapter';
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
        if (content == undefined) return;
        const cid = await this.cid(content);
        const i = filename.lastIndexOf('.');
        let ext;
        if (i > -1) ext = filename.substring(i+1);
        const res = await fetch(`${this.sink}/add`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cid, filename, ext , content })
        });
        if (!res.ok) {
            const err = await res.json();
            return { err: err.error ?? "internal server error" };
        }
        return { cid };
    }

    adjustContent(content) {
        if (isDataUrl(content)) {
            content = '$B64$' + getBase64DataOnly(content);
        } else if (!isString(content)) {
            content =  '$B64$' + btoa(content);    // assume a binary array buffer
        }

        return content;
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
    async createSource(cid, { filename, mimetype, credentials, use = false } = {}) {
        const i = filename.lastIndexOf('.');
        let ext;
        if (i > -1) ext = filename.substring(i+1);
        let uri = `${this.sink}/${cid}`;
        if (ext) uri +=`.${ext}`;
        const source = await FileSource.create({ uri, filename, mimetype, credentials, use });
        return source;
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
