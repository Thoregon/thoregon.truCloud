/*
 * This is the base class for all applications within the thoregon ecosystem
 * defines entrypoint to start/restart the application
 * handling of attests
 *
 * @author: Martin Neitz, Bernhard Lukassen
 */

export default class ThoregonApplication {
    //--- APP ID  123
    //--- Version
    //--- Charta
    //--- restart   -> application router call....
    //--- isAuthorized
    //--- get description
    //--- get Image / Icons
    //--- view/change attest
    //--- application category  ( die kommen von Thoregon )
    //--- # tagging  (#tags für suche ... es gibt zwar eine Empfehlung von Thoregon aber der Entwrickler kann frei wählen)

    //--- issue attest - how? will there be an attest issue rules | guidline |
    //                                                schema |
    //                                                plan |
    //                                                manifest |
    //                                                joining requirements |
    //                                                statutes |
    //                                                membership declaration |
    //                                                terms of contract
    //                                                entry protocol
    //
    //                                                terms <----


    //    licence terms
    //    warenty terms

    //    joining terms:
    //    -----------------
    //    everybody
    //    app dependend
    //    attest dependend
    //    priced
    //    recommended

    //    expire terms:
    //    -----------------
    //    testmonat
    //    volume based
    //    forever

    //    login conditions:
    //    security conditions:
    //    policy terms:
    //    access terms:
    //    -----------------
    //    login requered
    //    pin requered
    //    ... qr code scan requered
    //


    /**
     * the application id will be used to register in the thoregon registry
     * it is like the IP address in the WWW
     * @return {string}
     */
    static get applicationID() {
        throw new Error("applicationID need to be implemented by Subclass");
    }

    /**
     * https://semver.org/lang/de/
     * @returns {string}
     */
    static get applicationVersion() { return '0.0.1-initial'; }

    restart() {
        // implement by subclasses
    }

    /*
     * start behavior
     */

    async isWelcome() {
        return true;       // todo: check if any service is created so far, then answer false
    }

    get interceptors() {

    }

    /*
     * information queries
     */

    getRegistryEntry() {
        return universe.dorifer.appregistry.apps[this.name];
    }

    getQuery(name) {
        return this.getRegistryEntry().queries[name];
    }

    getSchema(name) {
        return this.getRegistryEntry().schemas[name];
    }

}
