/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class DirectoryEntry {

    /**
     *
     * @param id
     * @param properties
     * @param source        the source where to resolve or modify the object
     */
    constructor(id, properties, source) {
        Object.assign(this, properties,{ id, source });
    }

    /**
     * list the specified meta entries
     *
     * if no names, all meta entries
     *
     * @param names
     */
    async getMeta(...names) {

    }

    /**
     * list the specified attributes of the object
     * @param names
     */
    async getAttributes(...names) {

    }

    /**
     * get the object contained by this entry
     * @return {Promise<void>}
     */
    async resolve() {

    }
}
