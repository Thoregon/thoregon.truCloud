/**
 * Public Repository for Thoregon
 *
 *
 * @author: Bernhard Lukassen
 */

import ThoregonRepositoryProvider from "./thoregonrepositoryprovider.mjs";
import { ErrNotImplemented }      from "../../errors.mjs";
import { ThoregonObject }         from "/thoregon.archetim/lib/thoregonentity.mjs";
import RepositoryEntry            from "../repositoryentry.mjs";

const AMMANDUL = 'hWJAFJZJgVkfEWsGk7r77XGU1sjqZAcs';

export default class Ammandul extends ThoregonRepositoryProvider {


    get name() {
        return 'AMMANDUL';
    }

    async init() {
        super.init();
        if (!this.path) this.path = AMMANDUL;
        // this.root = await ThoregonObject.from(this.path);     //        universe.matter[this.path];
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

/*
    async lookup(searchstring, { matchAttrs, controls } = {}) {
    }
*/
}
