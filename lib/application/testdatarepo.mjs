/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

// const galaxyname = (filename) => filename.split('.').slice(0, -1).join('.');

let import_ = async (url) => await import(url);

export default class TestDataRepo {

    constructor(src, proxy) {
        this.src   = src;
        this.proxy = proxy;
        if (proxy) import_ = async (url) => await proxy.import(url);;
    }

    async getTestData() {
        const testdata = [];
        try {
            const dir = JSON.parse(await (await fetch(this.src)).text());
            const entries = dir.entries || [];
            await entries.asyncForEach(async (entry) => {
                try {
                    const module = await import_(this.src + '/' + entry);
                    const data   = module.default;
                    if (data != undefined) testdata.push(data);
                } catch (e) {
                    console.log("Couldn't load test data", entry, e);
                }
            })
        } catch (e) {/* no test data entries found */}
        return testdata;
    }
}
