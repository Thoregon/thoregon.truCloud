/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import Reporter from "/evolux.supervise/lib/reporter.mjs";

const isDir = (entry) => !! entry?.path;

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
            const json = await (await fetch(this.root + '!', { method: 'HEAD' })).text();
            const structure = JSON.parse(json);
            this.buildMap(structure);
        } catch (e) {
            this.logger.error('analyse (structure)', e);
        }
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
        if (!this.map[url]) throw Error(`404 - not found ${url}`);
        // todo [OPEN]: cache?
        return await fetch(url, opt);
    }

    async import(url) {
        // todo [REFACTOR]: normalize URL
        if (!this.map[url]) throw Error(`404 - not found ${url}`);
        // todo [OPEN]: cache?
        return await import(url);
    }
}
