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

    constructor(name) {
        this._name = name;
    }

    /**
     * the application id will be used to register in the thoregon registry
     * it is like the IP address in the WWW
     * @return {string}
     */
    static get applicationID() {
        return this._name;
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
        return false;       // todo: check if any service is created so far, then answer false
    }

    get interceptors() {

    }

    async connectUI(view) {
        console.log("MyServicesThatsmeApp App restart");

        let vm = await universe.aurora.ViewModel();
        vm.model = universe.observe(this);
        vm.view = view;

        //this.vm = vm;

        return true;
    }

    get interfaceSettings() {
        if (this._interfaceSettings) return this._interfaceSettings;
        this._interfaceSettings = {};
        if (!this.ctx || !this.ctx.getInterface()) return this._interfaceSettings;
        let properties = Object.entries(this.ctx.getInterface()).map(([name, spec]) => { return { name, value: spec.default } });
        properties.forEach((property) => this._interfaceSettings[property.name] = property.value);
        return this._interfaceSettings;
    }

    /*
     * information queries
     */

    getContext() {
        return universe.dorifer.context(this.name); // .appregistry.apps[this.name];
    }

    getQuery(name) {
        return this.getContext().getQuery(name);
    }

    getCommand(name) {
        let commandClass = this.getContext().getCommand(name);
        return new commandClass();
    }

    getSchema(name) {
        return this.getContext().getEntitySchema(name);
    }

}
