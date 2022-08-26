/**
 * Public Repository for Thoregon
 *
 *
 * @author: Bernhard Lukassen
 */

import ThoregonRepositoryProvider from "./thoregonrepositoryprovider.mjs";
import { ErrNotImplemented }      from "../../errors.mjs";
import { ThoregonObject }         from "/thoregon.archetim/lib/thoregonentity.mjs";

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

    async lookup(searchstring, { matchAttrs, controls } = {}) {
    }
}
