/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class Query {

    static from(name) {
        const q   = new this();
        const from = me.hasGalaxy(name) ? me.getGalaxy(name) : me.hasQuery(name) ? me.getQuery(name) : [];
        q._from = from;
        return q;
    }

    get length() {
        return this._from?.length || 0;
    }

    [Symbol.asyncIterator]() {
        let i = 0;
        let q = this;
        return {
            async next() { // (2)
                if (i < q.length) {
                    return { done: false, value: q._from[i++] };
                } else {
                    return { done: true };
                }
            }
        };
    }

    addEventListener() {}
}
