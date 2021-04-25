/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class ThoregonDirectory {

    constructor(soul) {
        this.soul = soul;
    }

    static async at(soul) {
        let dir = new this(soul);
    }

    async getEntry(id) {

    }

    /*
     * aync iterator interface
     */
    [Symbol.asyncIterator]() {

    }
}
