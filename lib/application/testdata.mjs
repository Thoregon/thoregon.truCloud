/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

const galaxyname = (filename) => filename.split('.').slice(0, -1).join('.');

export default class TestData {

    constructor(src) {
        this.src = src;
    }

    async provide() {
        const galaxies = {};
        try {
            const dir = JSON.parse(await (await fetch(this.src)).text());
            const entries = dir.entries || [];
            await entries.aForEach(async (entry) => {
                try {
                    const module = await import(this.src + '/' + entry);
                    const data   = module.default;
                    if (data != undefined) galaxies[galaxyname(entry)] = data;
                } catch (e) {
                    console.log("Couldn't load test data", entry, e);
                }
            })
        } catch (e) {/* no test data entries found */}
        return galaxies;
    }
}
