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

import Directory               from "/thoregon.archetim/lib/directory.mjs";
import { doAsync }             from "/evolux.universe";
import AppInstance             from "./appinstance.mjs";
import translate, * as plurals from '/evolux.util/lib/i18n/translate.mjs';
import DataLoader              from "../data/dataloader.mjs";
import ServiceHandle           from "../service/servicehandle.mjs";
import ThoregonConsumer        from "/thoregon.crystalline/lib/consumers/thoregonconsumer.mjs";

var I18N_NOPTIONS = {
    // These are the defaults:
    debug: false,  //[Boolean]: Logs missing translations to console and add "@@" around output, if `true`.
    array: false,  //[Boolean]: Returns translations with placeholder-replacements as Arrays, if `true`.
    resolveAliases: false,  //[Boolean]: Parses all translations for aliases and replaces them, if `true`.
    pluralize: function(n){ return Math.abs(n) },  //[Function(count)]: Provides a custom pluralization mapping function, should return a string (or number)
    useKeyForMissingTranslation: true //[Boolean]: If there is no translation found for given key, the key is used as translation, when set to false, it returns undefiend in this case
}

const DBGID = '++ AppInstance';

export default class ThoregonApplication {

    constructor(name) {
        this._name      = name;
        this._current   = undefined;
        this._instances = [];
        this._interceptors = [];
    }

    get id() {
        return this._name ?? this.constructor.name;
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
        this.engageInterceptors();

        // todo [REFACTOR]:
        //  - handle signoff and signon with another SSI
        //  - needs new concept for handling SSI requirements and auto signon, guest, ...
        if (!(await this.canStart)) return this.requestStart();
        if (universe.DEV?.ssi) {
            // universe.Identity.addListener('auth', async () => {} );  // await dorifer.restartApp()
            await universe.Identity.useIdentity(universe.DEV.ssi);
        }
        const Identity = universe.Identity;
        const autosignon = await Identity.hasAutoSignon();
        const isSignedOn = autosignon
                            ? await Identity.autoSignon()
                            : await Identity.isSignedOn();
        if (!isSignedOn && this.requiresGuestSSI) {
            await Identity.guest();
        // } else {
        //     this.requestStart();
        //     return false;
        }

        // todo [REFACTOR]: move this somehow to IdentityReflection
        if (!globalThis.me) {
            this._interceptors.push({
                fulfill(resolve) {
                    const signonfn = () => {
                        Identity.removeListener('auth', signonfn);
                        resolve({ signedon: true });
                    };
                    Identity.addListener('auth', signonfn);
                }
            })
        }
        await doAsync();
        return true;
    }

    get canStart() { return true }

    async requestStart() { /* implement by subclass */ }

    engageInterceptors() { /* implement by subclass */ }

    async restart() {
        const appinstance = await this.selectInstance();

        if (!appinstance) return;   // todo [CHECK]: is an app instance required? (currently not)

        if (thoregon.isDev && (thoregon.loadTestData || universe.DEV?.load)) {
            await this.loadTestData(appinstance);
        } else {
            await this.loadInitialData(appinstance);
        }
    }

    get requiresSSI() {
        return true;
    }

    get requiresGuestSSI() {
        return false;
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
        return this._instances;
    }

    getInstance(id) {
        return this._instances?.[id];
    }

    get current() {
        return this._current;
    }

    set current(appinstance) {
        this._current = appinstance;
    }

    async selectInstance() {
        if (this.current) return;
        const withUser = await SSI.is;
        // first check if there is a last used, or a 'start with' instance exists
        if (!withUser) {
            // no app instance for user
            // there is no ssi and no device, can only be stored local for ghost/guest
            // todo [OPEN]
        } else {
            universe.debuglog(DBGID, "selectInstance");
            // debugger;
            const apps = await me.apps;
            const id = this.name;     // todo [OPEN]: add repo (origin)
            if (!apps) throw ErrAppsForSSInotAvailable(id);
            let appinstances = await apps[id];
            if (!appinstances) {
                // create a store for the instances from this app
                universe.debuglog(DBGID, "selectInstance: new instances Directory");
                apps[id] = new Directory();
                await doAsync();
                appinstances = await apps[id];
            }
            let startApp;
            let startId = await this.prepareDev(id) ?? await appinstances.startWith ?? (this.hasDefaultInstanceId() ? this.getDefaultInstanceId() : undefined);
            if (!startId) startId = await appinstances.lastUsed;
            if (startId) {
                startApp = await appinstances[startId];
                universe.debuglog(DBGID, "selectInstance: start with last", startId);
            }
            if (!startApp) {
                universe.debuglog(DBGID, "selectInstance: start with new");
                const { instance } = await this.createInstance(startId, appinstances, startApp);
                startApp    = instance;
            }
            if (!(startApp instanceof AppInstance)) {
                universe.debuglog(DBGID, "selectInstance: instance is not an AppInstance");
                debugger;
            }
            if (startApp.id !== startId) startApp.id = startId;
            if (startApp.appid !== id) startApp.appid = id;
            startApp.restart();
            this._current   = startApp;
            this._instances = appinstances;
            if (!this.isDevInstance(app)) appinstances.lastUsed = await startApp.id;
            universe.debuglog(DBGID, "selectInstance: activate instance");
            await this.activateInstance(startApp);
            universe.debuglog(DBGID, "selectInstance: activate instance DONE");

            return startApp;
        }
    }

    async createInstance(appid, appinstances) {
        const opt = {};
        if (appid) opt.id = appid;
        // new instance needed
        const instance      = AppInstance.forApp(this, opt);
        appid               = instance.id;
        appinstances[appid] = instance;
        await doAsync();
        const startApp = await appinstances[appid];
        await this.initInstance(startApp);
        return { appid, instance };
    }

    hasDefaultInstanceId() { return false; }
    getDefaultInstanceId() { /* implement by subclass */ }

    isDevInstance(app) {
        const name = app.name;
        const instance = universe.DEV?.apps?.[name]?.instance;
        return !!instance;
    }

    async prepareDev(id) {
        const settings = universe.DEV?.apps?.[id];
        if (!settings) return;
        return settings.instance;
    }

    async initInstance(instance) {
        // implement by subclass
    }

    async activateInstance(instance) {
        // implement by subclass
    }

    //
    // data management
    //

    async loadTestData(appinstance) {
        const appname = this.name;
        const settings = universe.DEV?.apps?.[appname];
        if (!settings) return;
        const loader = DataLoader.with({
                                           instance: appinstance,
                                           testdata: settings.testdata,
                                           autoreload: settings.autoreload
                                       });
        await loader.load();
    }

    async loadInitialData() {

    }

    //
    // start behavior
    //

    async isWelcome() {
        return false;       // todo: check if any service is created so far, then answer false
    }

    get interceptors() {
        return this._interceptors;
    }

    async connectUI(view) {
        // todo [OPEN]: check if thoregon app
        //  - can specify its own view model
        //  - is a view model
        let vm = await universe.aurora.ViewModel();
        vm.model = universe.observe(this);
        vm.view = view;
        return true;
    }

    get interfaceSettings() {
        if (this._interfaceSettings) return this._interfaceSettings;
        const appElement = dorifer?.appElement;
        this._interfaceSettings = appElement?.getAttributeNames().reduce((obj, name) => { obj[name] = appElement.getAttribute(name); return obj; }, {}) ?? {};
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

    //
    // convenience shortcuts
    //

    // todo [REFACTOR]: target language for user setting
    getTranslator() {
        if (!this._translator) {
            const translation = this.getI18N();
            this._translator = translation
                   ? translate(translation, {
                        ...I18N_NOPTIONS,
                        pluralize: plurals.plural_EN,       // todo: select language
                    })
                   : (...args) => `${args.join(',')}`;
        }
        return this._translator;
    }

    getI18N() {
        return this._I18N ?? this.ctx.getI18N();
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
