/**
 * Is a interface/superclass for universe wide repositories
 *
 * Address components by its path.
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { parseSearchParams } from "../directory/directoryutils.mjs";
import ThoregonDirectory     from "../directory/thoregondirectory.mjs";
import AppStructure          from "../application/appstructure.mjs";

export default class ThoregonRepository extends ThoregonDirectory {

    constructor() {
        super();
        this.components = {};
    }

    /**
     * tap the repository
     * @param {String} [path]
     * @return {Promise<ThoregonRepository>}
     */
    static async tap(env) {
        let repo = await this.at(env);
        await repo.provider.init();
        return repo;
    }

    /**
     * lookup a component in the repository
     * if found return an AppStructure information object
     * where all relevant entries can be queried
     *
     * @param {String} componentname     ... name of
     * @param {String[]} matchAttrs      ... attribute search definition with filters
     * @param {String[]} controls        ... search result controls
     * @return {Promise<AppStructure>}
     */
    async componentLookup(componentname) {
        const entry = await this.lookup(componentname);
        if (!entry) return;
        const struct = await AppStructure.from(entry.name, entry.href);
        return struct;
    }

}
