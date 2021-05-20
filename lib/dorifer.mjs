/**
 * Dorifer provides the runtime environment and access to available components in the universe.
 * The runtime environment also includes the apps and components that are installed on this device.
 * Additional repositories can be made available to use other components as well. Just 'tap' it.
 *
 * Thoregon Repository
 * - Only Thoregon system components
 * - public repository -> Ammandul
 * - other repositories can be added
 *
 * Permissions: Archetim
 *
 *
 * @author: Bernhard Lukassen
 */

import { doAsync }        from "/evolux.universe";
import { EventEmitter }   from "/evolux.pubsub";
import { Reporter }       from "/evolux.supervise";
//import { StateMachine }   from '/evolux.statemachine';

import Registry           from "./application/registry.mjs";
import URLRouter          from "./application/urlrouter.mjs";
import Device             from "./device/device.mjs";
import ThoregonRepository from "./repo/thoregonrepository.mjs";

import { ErrNoAppElement, ErrNoUI, ErrNotAvailable } from "./errors.mjs";

const T = universe.T;

/*
 * locations
 */
// the soul of the dorifer directory
const DORIFER  = 'n8UEpV5vGywQXr4bdhnuUpA6JDjQG9Er';

const isDev = () => { try { return thoregon.isDev } catch (ignore) { return false } };

export default class Dorifer extends Reporter(EventEmitter) {

    constructor() {
        super();
        this.repositories = [];
        this.appregistry  = new Registry();
        this.contexts     = {};
    }

    async init() {
        // todo [OPEN]: define 'dorifer' as global
        universe.dorifer = this;
        universe.device  = new Device();

        await this.attachRepositories();

        // if started via a url in the browser analyze it if an app should be started
        let urlrouter  = new URLRouter();
        this.urlrouter = urlrouter;
        urlrouter.connect(this.appregistry);
        if (this.hasAppElement) {
            // if a UI exists enable the application URL router
            await this.restartApp();
        }
    }

    async attachRepositories() {
        // attach standard repositories
        let repo;
        if (isDev()) {
            this.repositories.push({ name: 'tdev', repo: await ThoregonRepository.tap({ provider: '/thoregon.truCloud/lib/repo/provider/tdevrepository.mjs' }) });
        }
        this.repositories.push({ name: 'ammandul', repo: await ThoregonRepository.tap({ provider: '/thoregon.truCloud/lib/repo/provider/ammandul.mjs' }) });
        // attach users repositories
        // get registered repos in SSI and tap it
    }

    async cleanup() {

    }

    /*
     * directory & repository API
     * common
     */



    /*
     * registry API
     * the registry manages the components and contexts for this (local) peer
     * it has its own storage in the device and in the identity
     * -
     *
     * todo [REFACTOR]: distribute aspects to responsible entities
     * todo [OPEN]: dorifer context for each component/app -> rename addApp to context and return a DoriferContext
     */

    /**
     * tap a repository to get components from
     * @param repo
     */
    tap(repo) {
        // get teh repo
        // get the SSI
        // add the repo to the used (tapped) repositories
    }

    context(ctxname) {
        let ctx = this.contexts[ctxname];
        if (ctx) return ctx;
        ctx = new DoriferContext(ctxname, this, this.appregistry);
        this.contexts[ctxname] = ctx;
        return ctx;
    }
/*

    addWidget(appname, widgetname, segment, widget) {
        this.appregistry.addWidget(appname, widgetname, segment, widget);
        return this;
    }
*/

    addInterceptor(appname, conditionFn, prerequisiteFn) {
        this.appregistry.addInterceptor(appname, conditionFn, prerequisiteFn);
        return this;
    }

    requiresUser(apppath) {
        if (!universe.thatsmeLogin) throw ErrNotAvailable('thatsme');
        universe.thatsmeLogin(apppath);
        return this;
    }

    async findInRepo(ref) {
        for await ( let { repo } of this.repositories) {
            let entry = await repo.lookup(ref);
            if (entry) return entry;
        }
    }

    async restartApp(appcontext) {
        if (!this.top) {
            let { appname, instance } = this.urlrouter.matchingApp(this.appreference);   // local installed apps
            // find in repos
            if (!instance) {
                let reporef = this.urlrouter.repoRefFrom(this.appreference);
                if (reporef) {
                    let appref  = await this.findInRepo(reporef);
                    let apprepo = this.urlrouter.matchingApp(this.appreference);
                    if (apprepo) {
                        appname  = apprepo.appname;
                        instance = apprepo.instance;
                    }
                }
            }
            this.top = instance;
            if (instance && !instance.name) instance.name = appname;
            if (this.top) {
                let app = this.top.app;
                if (!app.name) app.name = appname;
                // first restart the app (model)
                app.restart();
                let interceptors = this.top.interceptors;
                this.processInterceptors(interceptors, async () => {
                    // now awake the UI.
                    if (app.restore) await app.restore();
                    if (this.top.ui && this.hasAppElement) {
                        let uirouter        = universe.uirouter;
                        this.uirouter       = uirouter;
                        uirouter.app        = app;
                        let ui        = this.top.ui;
                        let view      = this.appElement.top(ui);   // set the top App UI element. Will be (re)started after init
                        uirouter.appelement = view;
                        view.app            = app;
                        view.appname        = appname;
                        this.top.view = view;
                        await view.untilExist();
                        // todo [OPEN]: restore UI state
                        view.prepareEnveloping();

                        await doAsync();
                        if (!await app.connectUI(view)) {
                            // connect Model and UI
                            let vm      = universe.aurora.ViewModel();
                            this.top.vm = vm;
                            vm.view     = view;
                            vm.model    = universe.observe(app);
                        };
                        await doAsync();
                        await view.awaken();
                        uirouter.restore();
                    }   // if peer has a UI
                });
            }
        }
    }

    /**
     * process all interceptors in the order they a specified
     * loop until all interceptors allow resume
     *
     * todo [REFACTOR]: work together with router
     *
     * @param {[Interceptor]}   interceptors
     * @param {Function}        resume
     */
    processInterceptors(interceptors, resume) {
        if (!interceptors || !Array.isArray(interceptors)) {
            resume();
            return;
        }
        let interceptor = interceptors.shift();
        interceptor.fulfill((result) => {
            if (result.error) {
                universe.logger.error("Dorifer.processInterceptors()", result.error);
                return;
            }
            if (interceptors.is_empty) {
                resume();
                return;
            } else {
                let interceptor = interceptors.shift();
                this.processInterceptors(interceptors, resume);
            }
        })
    }

    get appreference() {
        return window.location.href;
    }

    get urlParams() {
        return this.urlrouter ? this.urlrouter.params : undefined;
    }

    /*
     * entities
     */

    async wake(node) {
        // get meta data from node
        // find out which schema
        // create instance from schema or generic object if none
        // build decorator with schema and instance

    }

    /*
     * UI
     */

    // this property will be added at the bottom according the peers nature (has UI or not)
    // get appElement() { ... }
    // get hasAppElement() { ... }

    /*
     * service implementation.
     * on start setup the tru cloud
     */

    install() {}
    uninstall() {}
    resolve() {}
    async start() {
        await this.init();
        this.emit('ready', { dorifer: this });
    }
    async stop() {
        await this.cleanup();
        this.emit('exit', { dorifer: this });
    }

    update() {}


    /*
     * EventEmitter implementation
     */

    get publishes() {
        return {
            ready       : 'Dorifer ready',
            exit        : 'Dorifer exit',
        };
    }

}

/*
 * now initialize the UI reference
 * add properties to handle UI to Dorifer
 * - appElement     ... get the top app element in the UI, throw if missing of peer has no UI
 * - hasAppElement  ... returns if an app element exists
 */

if (thoregon.ui) {
    let app = document.querySelector('thoregon-app');
    if (app) {
        Object.defineProperties(Dorifer.prototype, {
            appElement: {
                configurable: false,
                enumerable  : false,
                value       : app,
            },
            hasAppElement: {
                configurable: false,
                enumerable  : false,
                value       : true,
            },
        });
/*
        Object.defineProperty(Dorifer.prototype, 'appElement', {
            configurable: false,
            enumerable  : false,
            value       : app,
        });
*/
    } else {
        Object.defineProperties(Dorifer.prototype, {
            appElement: {
                configurable: false,
                enumerable  : false,
                get         : () => { throw ErrNoAppElement(); },
            },
            hasAppElement: {
                configurable: false,
                enumerable  : false,
                value       : false,
            },
        });
    }
} else {
    Object.defineProperties(Dorifer.prototype, {
        appElement: {
            configurable: false,
            enumerable  : false,
            get         : () => { throw ErrNoUI() },
        },
        hasAppElement: {
            configurable: false,
            enumerable  : false,
            value       : false,
        },
    });
}

class DoriferContext {

    constructor(ctxname, dorifer, registry) {
        this.dorifer     = dorifer;
        this.appregistry = registry;
        this.ctxname     = ctxname;
    }

    addApp(app, ui) {
        this.appregistry.register(this.ctxname, app, ui);
        this.dorifer.urlrouter.updateMapping(this.appregistry);
        if (!this.app) this.app = app;  // first app as default app
        if (!this.ui)  this.ui  = ui;   // first ui as default ui
        return this;
    }

    addWidget(widgetname, segment, widget) {
        this.appregistry.addWidget(this.ctxname, widgetname, segment, widget);
        return this;
    }

    addDomain(dmain) {
        this.appregistry.addDomain(this.ctxname, dmain);
        return this;
    }

    addRoutes(routes) {
        this.appregistry.addRoutes(this.ctxname, routes);
        return this;
    }

    addInterceptor(conditionFn, prerequisiteFn) {
        this.appregistry.addInterceptor(this.ctxname, conditionFn, prerequisiteFn);
        return this;
    }

    addQuery(name, query) {
        this.appregistry.addQuery(this.ctxname, name, query);
        return this;
    }

    addEntitySchema(clazz, schema) {
        schema.impl = clazz;
        this.appregistry.addEntitySchema(this.ctxname, schema.name, schema);  // todo [OPEN]: specify schema uri and version
        return this;
    }

    addCommand(name, action) {
        // todo [OPEN]
    }

    withStore(path) {
        this.appregistry.withStore(this.ctxname, path);
        return this;
    }

    withUI(path) {
        this.appregistry.withUI(this.ctxname, path);
        return this;
    }

    requiresUser() {
        if (!universe.thatsmeLogin) throw ErrNotAvailable('thatsme');
        universe.thatsmeLogin(this.ctxname);
        return this;
    }
    async restartApp(prerequisitefn) {
        // todo: just exec when app is really restarted
        if (prerequisitefn) await prerequisitefn();
        // await this.dorifer.restartApp(this);
    }

}
