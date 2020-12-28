/**
 * Is a interface/superclass for universe wide repositories
 *
 * Address components by its path.
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class ThoregonRepository {

    constructor({
                    id
                } = {}) {
        Object.assign(this, { id });
    }

}
