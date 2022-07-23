/**
 * Public Repository for Thoregon
 *
 *
 * @author: Bernhard Lukassen
 */

import ThoregonRepositoryProvider from "./thoregonrepositoryprovider.mjs";
import { ErrNotImplemented }      from "../../errors.mjs";
import { ThoregonObject }         from "/thoregon.archetim/lib/thoregonentity.mjs";

const NEULAND = 'e4xvv2sZaXtnWqgM4lJdXKTmmBBN7013';

export default class Neuland extends ThoregonRepositoryProvider {

    get name() {
        return "NEULAND";
    }

    async init() {
        super.init();
        if (!this.path) this.path = NEULAND;
        this.root = await ThoregonObject.from(this.path);     //        universe.matter[this.path];
    }

    async lookup(searchstring, { matchAttrs, controls } = {}) {
    }
}
