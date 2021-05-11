/**
 * Is a interface/superclass for universe wide repositories
 *
 * Address components by its path.
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ThoregonDirectory from "../directory/thoregondirectory.mjs";

export default class ThoregonRepository extends ThoregonDirectory {

    constructor() {
        super();
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

}
