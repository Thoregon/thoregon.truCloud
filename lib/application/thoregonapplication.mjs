/*
 * This is the base class for all applications within the thoregon ecosystem
 * defines entrypoint to start/restart the application
 *
 * It is the root for all app instances. there is at least one. --> AppInstance
 * Each app instance is the root for materialized entities
 * Once instantiated, it is persistent and is the root for all
 *
 * todo [OPEN]
 *  - add a lifecycle state machine for create and init of app instances
 *
 * @author: Martin Neitz, Bernhard Lukassen
 */

import Directory   from "/thoregon.archetim/lib/directory.mjs";
import { doAsync } from "/evolux.universe";
import AppInstance from "./appinstance.mjs";

export default class ThoregonApplication {

    constructor(name) {
        this._name      = name;
        this._current   = undefined;
        this._instances = [];
    }

    /**
     * the application id will be used to register in the thoregon registry
     * it is like the IP address in the WWW
     * @return {string}
     */
    static get id() {
        return this._name;
    }

    get id() {
        return this.constructor.id;
    }

    /**
     * https://semver.org/lang/de/
     * @returns {string}
     */
    static get applicationVersion() { return '0.0.1-initial'; }

    /**
     * do not override. prepares instances
     */
    async prepare() {
        // if missing, create all necessary self issued credentials
        // request credentials from other issuers
        // get last used instance
        // select app root for instance
        // build directories in identity (me) and app.current

        await this.createInstance();
    }

    async restart() {
        // implement by subclasses
    }

    //
    // instances
    //

    get multipleInstances() {
        return false;
    }

    get credentialPath() {
        return 'apps/' + this._name;
    }

    get instances() {
        return this._instanes;
    }

    get current() {
        return this._current;
    }

    set current(appinstance) {
        this._current = appinstance;
    }

    async createInstance() {
        if (this.current) return;
        const withUser = await me.is;
        // first check if there is a last used, or a 'start with' instance exists
        if (!withUser) {
            // no app instance for user
            // there is no ssi and no device, can only be stored local for ghost/guest
            // todo [OPEN]
        } else {
            const ssi = await me.ssi();
            const apps = await ssi.apps;
            if (!apps) throw ErrAppsForSSInotAvailable(this.id);
            let appinstances = await apps[this.id];
            if (!appinstances) {
                // create a store for the instances from this app
                apps[this.id] = new Directory();
                await doAsync();
                appinstances = await apps[this.id];
            }
            let startApp;
            let startId = await appinstances.startWith;
            if (!startId) startId = await appinstances.lastUsed;
            if (startId) {
                startApp = await appinstances[startId];
            }
            if (!startApp) {
                // new instance needed
                const instance = await AppInstance.forApp(this);
                startId = instance.id;
                appinstances[startId] = instance;
                await doAsync();
                startApp = await appinstances[startId];
                await this.initInstance(startApp);
            }
            this._current   = startApp;
            this._instances = appinstances;
            appinstances.lastUsed = await startApp.id;
            await this.activateInstance(startApp);
        }
    }

    async initInstance(instance) {
        // implement by subclass
    }

    async activateInstance(instance) {
        // implement by subclass
    }

    //
    // start behavior
    //

    async isWelcome() {
        return false;       // todo: check if any service is created so far, then answer false
    }

    get interceptors() {

    }

    async connectUI(view) {
        let vm = await universe.aurora.ViewModel();
        vm.model = universe.observe(this);
        vm.view = view;
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

    //
    // testing
    //



    //
    // information queries
    //

    getContext() {
        return universe.dorifer.context(this.name); // .appregistry.apps[this.name];
    }

}


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
