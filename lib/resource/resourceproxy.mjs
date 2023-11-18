/**
 *
 *
 * todo [OPEN]:
 *  - support multiple versions
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import Reporter from "/evolux.supervise/lib/reporter.mjs";

const isDir = (entry) => !! entry?.path;

const versionedUrl = (url, version) => {
    if (url.indexOf('@') > -1) return url;   // todo [OPEN]: semantic parsing. the '@' may also be in a filename
    const i =  url.indexOf('/',1);
    const modulename = url.substring(0,i);
    const sub = url.substring(i);
    url = `${modulename}@${version}${sub}`;
    return url;
}

export default class ResourceProxy extends Reporter() {

    constructor(props) {
        super();
        Object.assign(this, props);
        this.map = {};
    }

    static async on(root) {
        const proxy = new this({ root });
        await proxy.analyse();
        return proxy;
    }

    async analyse() {
        try {
            const res = await fetch(this.root + '!', { method: 'HEAD' });
            const headers = res.headers;
            let json   = headers.get("Structure");
            if (!json) json = await res.text();
            const structure = JSON.parse(json);
            if (structure._ === 'flat') {
                this.useMap(structure);
            } else {
                this.buildMap(structure);
            }
        } catch (e) {
            this.logger.error('analyse (structure)', e);
        }
    }

    useMap(stucture) {
        this.version = stucture.version;
        this.map = stucture;
    }

    buildMap(level) {
        const { name, path, type, entries } = level;
        const map = this.map;
        map[path] = { name, path, type, entries };
        entries?.forEach((entry) => {
            if (isDir(entry)) {
                this.buildMap(entry);
            } else {
                const fpath = path+'/'+entry;
                map[fpath] = { name, path: fpath, type: 'file' };
            }
        });
    }

    knows(url) {
        return !!this.map[url];
    }

    async fetch(url, opt) {
        // todo [REFACTOR]: normalize URL
        if (this.version) url = versionedUrl(url, this.version);
        if (!this.map[url]) throw Error(`404 - not found ${url}`);
        // todo [OPEN]: cache?
        return await fetch(url, opt);
    }

    async import(url) {
        // todo [REFACTOR]: normalize URL
        if (this.version) url = versionedUrl(url, this.version);
        if (!this.map[url]) throw Error(`404 - not found ${url}`);
        // todo [OPEN]: cache?
        return await import(url);
    }
}
