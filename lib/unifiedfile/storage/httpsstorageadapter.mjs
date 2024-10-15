/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { getBase64DataOnly, isDataUrl, isURL } from "/evolux.util/lib/serialize.mjs";
import { isString }                            from "/evolux.util/lib/objutils.mjs";
import SEA                                     from "/evolux.everblack/lib/crypto/sea.mjs";
import UnifiedFileStorageAdapter               from "./unifiedfilestorageadapter.mjs";
import FileSource                              from "../filesource.mjs";

// const HTTPFILESIKN = 'http://127.0.0.1:7779';

const SALT = 'ksZGLUkuEGLSHGL3HxC3opTTeM14ePHG';

// --- todo: use package 'mime-types' in future -> https://github.com/jshttp/mime-types
const contentTypesByExtension = {   // todo: add more mime types
    'css'  : 'text/css',
    'mjs'  : 'application/javascript',
    'js'   : 'application/javascript',
    'json' : 'application/json',
    'png'  : 'image/png',
    'jpg'  : 'image/jpeg',
    'jpeg' : 'image/jpeg',
    'html' : 'text/html',
    'htm'  : 'text/html',
    'svg'  : 'image/svg+xml',
    'woff' : 'application/font-woff',
    'woff2': 'font/woff2',
    'tty'  : 'font/truetype',
    'otf'  : 'font/opentype',
    'wasm' : 'application/wasm',
    'eot'  : 'application/vnd.ms-fontobject',
};

function getContentType(filename) {
    if (!filename) return 'text/plain';
    var tokens = filename.split('.');
    var extension = tokens[tokens.length - 1];
    return contentTypesByExtension[extension] ?? 'text/plain';
}

// ----------------

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
        return universe.HTTPFILESINK ?? universe.SA_REST ?? universe.NEXUS_REST;
    }

    get api() {
        return universe.HTTPSINKAPI ?? '/resource';
    }

    get resourceroot() {
        return universe.HTTPSINKROOT ?? '/pub/resource';
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
    async add(content, { mediathek = false, filename, mimetype, credentials, onProgress, abortSignal, prevadd= false } = {}) {
        // implement by subclass
        if (content == undefined) return;
        const cid = await this.cid(content);
        if (!isDataUrl(content) && isURL(content)) return { cid };
        const i = filename.lastIndexOf('.');
        let ext, uri;
        if (i > -1) {
            ext = filename.substring(i+1);
            uri = `${this.sink}${this.resourceroot}/${cid}.${ext}`;
        } else {
            uri = `${this.sink}${this.resourceroot}/${cid}`;
        }
        const res = await fetch(`${this.sink}${this.api}/add`, {
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
        return { cid, uri };
    }

    contentForUnifiedFileDescriptor(content) {
        return undefined;
    }

    async adjustItem(content, { filename, mimetype, storage, credentials, mediathek, tags, timeout, onProgress } = {}) {
        const url = isURL(content);
        if (isDataUrl(content)) {
            content = '$B64$' + getBase64DataOnly(content);
        } else if (url) {
            if (mediathek) {
                const { mimeType, dataUrl } = await this.asDataUrl(content);
                if (dataUrl) {
                    content = dataUrl;
                    mimetype = mimeType;
                    filename = universe.path.basename(url.pathname);
                    return await this.adjustItem(content, { filename, mimetype, storage, credentials, mediathek, tags, timeout, onProgress });
                }
                throw Error("Can't fetch:", content);
            }
        } else if (!isString(content)) {
            content =  '$B64$' + btoa(content);    // assume a binary array buffer
        }
        return { content, filename, mimetype, credentials };
    }

    // adjustContent(content, { mediathek = false } = {}) {
    //     if (isDataUrl(content)) {
    //         content = '$B64$' + getBase64DataOnly(content);
    //     } else if (isURL(content)) {
    //         if (!mediathek) return content;
    //         // todo: fetch content and build data url
    //     } else if (!isString(content)) {
    //         content =  '$B64$' + btoa(content);    // assume a binary array buffer
    //     }
    //
    //     return content;
    // }

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
    async createSource(cid, { filename, content, mimetype, credentials, use = false, mediathek = false } = {}) {
        const url = isURL(content);
        if (!isDataUrl(content) && url) {
            const uri = url.href;
            const filename = universe.path.basename(url.pathname);
            const source = await FileSource.create({ uri, filename, mimetype, credentials, use });
            return source;
        } else {
            const i = filename.lastIndexOf('.');
            let ext;
            if (i > -1) ext = filename.substring(i+1);
            let uri = `${this.sink}/${cid}`;
            if (ext) uri +=`.${ext}`;
            const source = await FileSource.create({ uri, filename, mimetype, credentials, use });
            return source;
        }
    }

    async getDataUrl(source) {
        const url = await source.getUrl();
        const { mimeType, dataUrl } = await this.asDataUrl(url);
        return dataUrl;
    }

    async asDataUrl(url) {
        if (url.startsWith('file:')) {
            url = url.substring(5);
            const mimeType = getContentType(url);
            const buf = await thoregon.content(url);
            const b64 = buf.toString('base64');
            const dataUrl = `data:${mimeType};base64,${b64}`;
            return { mimeType, dataUrl };
        } else {
            const res = await fetch(url);
            if (!res.ok) return {};
            const mimeType = res.headers.get("Content-Type");
            const blob    = await res.blob();
            //const dataurl = URL.createObjectURL(blob);
            const dataUrl = await universe.specials.blobToDataURL(blob);
            return { mimeType, dataUrl };
        }
    }
}
