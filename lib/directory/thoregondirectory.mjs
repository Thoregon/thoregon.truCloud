/**
 * A directory is a standardized interface to
 * directory and naming (generic directory)
 *
 * a directory always has one underlying provider
 * which defines how to search
 *
 * directories can support permissions
 * authentication and security API
 *
 * schemas
 * - not mandatory for a directory
 * - object classes
 *    - enforce
 *    - free extendable
 * - attributes: matching rules (by type or specific implementation as parser)
 *
 * verifiable claims
 * - SSI's issue claims to the directory (owner)
 * - become a directory entry (or a reference to the claim)
 *
 * https://docs.oracle.com/javase/jndi/tutorial/trailmap.html
 *
 * todo [OPEN]
 *  - support sophisticated search strings like LDAP (&(sn=Kwapil)(mail=*)) or regular expressions
 *  - attibute synonymes (LDAP)
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { ErrDirectoryProviderNotFound } from "../errors.mjs";

export default class ThoregonDirectory {

    //
    // management
    //

    /**
     * get the the repository
     *
     * specify the environment to get the provider and the content
     *
     * e.g.:
     * {
     *     namespace: '',   // matching namespace for this provider -> namespace resolvers like DID resolvers
     *     factory: '',     // which factory to get the provider
     *     provider: '',    // which provider (implementation), either 'factory' or 'provider'
     *     ref: '',         // information for the provider to select the content
     *     auth: '',        // SSI Claim needed, JWT style token
     * }
     *
     * subscribe to a directory
     * - log information
     * - content changes
     * - listen to
     *      - specific attributes
     *      - whole entries
     *      - whole (sub) contexts
     *
     * @param env       ... environment to get the provider and the directory content
     * @return {Promise<void>}
     */

    static async at(env) {
        let repo = new this();
        await repo.boot(env);
        return repo;
    }

    async boot(env) {
        this.env = env;
        if (env.factory) {
            let factory;
            let provider;
            // todo [OPEN]
            //  - where to get the factory (from another repo)
            //  - factory as object
        } else if (env.provider) {
            let provider;
            try {
                let module = await import(env.provider);
                if (module.provider) {
                    provider = new module.provider();
                } else if (module.default) {
                    provider = new module.default();
                }
            } catch (ignore) {} // this results in a ErrDirectoryProviderNotFound error
            if (!provider) throw ErrDirectoryProviderNotFound(env.provider);
            this.provider = provider;
        }
        return this;
    }

    /**
     * metadata of this directory
     * should at least contain a name and a description
     */
    meta() {

    }

    //
    // queries
    //

    /**
     * find a directory entry with a search string
     * delivers one single directory entry if found
     *
     * the search string depends on the directory provider
     * address the provider and the search
     *
     * The entry contains only meta information about
     * the object, it must be resolved to get the content
     *
     * @param {String} searchstring      ... provider dependent search string
     * @param {String[]} matchAttrs      ... attribute search definition with filters
     * @param {String[]} controls        ... search result controls
     * @return {Promise<void>}
     */
    async lookup(searchstring, { matchAttrs, controls } = {} ) {
        return this.provider.lookup(searchstring, { matchAttrs, controls });
    }


    /**
     * find matching directory entries with a search like
     * delivers a collection of directory entries, empty if nothing found
     *
     * @param {String} searchstring      ... provider dependent search string
     * @param {String[]} matchAttrs      ... attribute search definition
     * @param {String[]} controls        ... search result controls
     * @return {Promise<void>}
     */
    async list(searchstring, matchAttrs, controls) {

    }

    //
    // entries: can also be used via the DirectoryEntry
    //

    async resolveEntry(searchstring) {

    }

    async entryMeta(...names) {

    }

    async entryAttributes(...names) {

    }

    /**
     * the modification item contains a collection
     * of modifications
     *    add, replace, remove attribute
     *    add, replace, remove meta
     *
     * @param modificationitem
     * @return {Promise<void>}
     */
    async modifyEntry(modificationitem) {

    }

    //
    // modifications
    //

    async bind(path, object, meta) {

    }

    async replace(path, object, meta) {

    }

    async unbind(path) {

    }

    async move(oldpath, newpath) {

    }

    async link(path, link, meta) {

    }

    /**
     * like a directory, can contain directory entries
     *
     * depends on the underlying provider if subcontexts
     * are supported
     *
     * @param path
     * @param object
     * @param meta
     * @return {Promise<void>}
     */
    async createContext(path, object, meta) {

    }

    async dropContext(path, object, meta) {

    }

    /*
     * aync iterator interface
     */
    [Symbol.asyncIterator]() {

    }
}
