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

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

export default class TDevRepository extends ThoregonRepositoryProvider {

    async init() {

    }

    async lookup(searchstring, { matchAttrs, controls } = {}) {
        let params = parseSearchParams(searchstring);
        if (params.e === 'app' && params.cn) {
            try {
                // debugger;
                let module = await import(`/${params.cn}`);
                let entry  = new RepositoryEntry();
                // the default export must be a function
                // it should register in Dorifer and return the App Class
                let def = await module.default();
                entry.app  = isFuncion(def) ? await def() : def;
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
