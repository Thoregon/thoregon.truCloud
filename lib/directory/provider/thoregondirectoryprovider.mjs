/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import { ErrNotImplemented } from "../../errors.mjs";

export default class ThoregonDirectoryProvider {

    async lookup(searchstring, { matchAttrs, controls } = {}) {
        throw ErrNotImplemented('lookup');
    }

}
