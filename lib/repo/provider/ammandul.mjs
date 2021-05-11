/**
 * Public Repository for Thoregon
 *
 *
 * @author: Bernhard Lukassen
 */

import ThoregonRepositoryProvider from "./thoregonrepositoryprovider.mjs";
import { ErrNotImplemented }      from "../../errors.mjs";

const AMMANDUL = 'hWJAFJZJgVkfEWsGk7r77XGU1sjqZAcs';

export default class Ammandul extends ThoregonRepositoryProvider {

    async init() {
        super.init();
        if (!this.path) this.path = AMMANDUL;
        this.root = universe.matter[this.path];
    }

    async lookup(searchstring, { matchAttrs, controls } = {}) {
    }
}
