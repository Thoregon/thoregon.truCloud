/**
 *
 * todo [$$@REPO]:
 *  - new repo design
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { isFunction }             from "/evolux.util/lib/objutils.mjs";
import { parseSearchParams }      from "../../directory/directoryutils.mjs";
import ThoregonRepositoryProvider from "./thoregonrepositoryprovider.mjs";
import RepositoryEntry            from "../repositoryentry.mjs";

export default class TDevRepository extends ThoregonRepositoryProvider {


    get name() {
        return "DevRepo";
    }

    async lookup(appname) {
        try {
            const href = `/${appname}`;
            let module = await fetch(href);
            let entry  = new RepositoryEntry();
            // the default export must be a function
            // it should register in Dorifer and return the App Class
            entry.name = appname;
            entry.type = 'app';
            entry.href = href;
            // entry.module = module;
            return entry;
        } catch (e) {
            // todo [OPEN]: check first if the resource is available, if so and the import fails there must be a JS error (Syntax, Reference, ...)
            console.log('Dev Repo', e);
        }
    }

/*  $$@REPO
    async _lookup(searchstring, { matchAttrs, controls } = {}) {
        let params = parseSearchParams(searchstring);
        if (params.e === 'app' && params.cn) {
            try {
                // debugger;
                const href = `/${params.cn}`;
                let module = await fetch(href);
                let entry  = new RepositoryEntry();
                // the default export must be a function
                // it should register in Dorifer and return the App Class
                entry.name = params.cn;
                entry.type = params.e;
                entry.href = href;
                return entry;
            } catch (e) {
                // todo [OPEN]: check first if the resource is available, if so and the import fails there must be a JS error (Syntax, Reference, ...)
                console.log('Dev Repo', e);
            }
        }
    }
*/
}
