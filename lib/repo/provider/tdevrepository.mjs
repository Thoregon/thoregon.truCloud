/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { parseSearchParams }      from "../../directory/directoryutils.mjs";
import ThoregonRepositoryProvider from "./thoregonrepositoryprovider.mjs";
import RepositoryEntry            from "../repositoryentry.mjs";

export default class TDevRepository extends ThoregonRepositoryProvider {

    async init() {

    }

    async lookup(searchstring, { matchAttrs, controls } = {}) {
        let params = parseSearchParams(searchstring);
        if (params.e === 'app' && params.cn) {
            try {
                let module = await import(`/${params.cn}`);
                let entry  = new RepositoryEntry();
                entry.app  = module.default();
                entry.name = params.cn;
                return entry;
            } catch (e) {
                // todo [OPEN]: check first if the resource is available, if so and the import fails there must be a JS error (Syntax, Reference, ...)
                // console.log('Dev Repo', e);
                // debugger;
            }
        }
    }
}
