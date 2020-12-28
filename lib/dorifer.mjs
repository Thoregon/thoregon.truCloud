/**
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

import { doAsync }      from "/evolux.universe";
import { EventEmitter } from "/evolux.pubsub";
import { Reporter }     from "/evolux.supervise";

import Registry         from "./application/registry.mjs";
import URLRouter        from "./application/urlrouter.mjs";

import Device           from "./device/device.mjs";

import { ErrNoAppElement, ErrNoUI } from "./errors.mjs";

export default class Dorifer extends Reporter(EventEmitter) {

    constructor() {
        super();
        this.appregistry = new Registry();
        this.contexts    = {};
    }

    async init() {
        universe.dorifer = this;
        universe.device  = new Device();
        let urlrouter  = new URLRouter();
        this.urlrouter = urlrouter;
        urlrouter.connect(this.appregistry);
        if (this.hasAppElement) {
            // if a UI exists enable the application URL router
            this.restartApp();
        }
    }

    async cleanup() {

    }

    /*
     * Registry API
     * todo [REFACTOR]: distribute aspects to responsible entities
     * todo [OPEN]: dorifer context for each component/app -> rename addApp to context and return a DoriferContext
     */

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

    restartApp() {
        if (!this.top) {
            this.top = this.urlrouter.matchingApp(this.appreference);
            if (this.top) {
                let app = this.top.app;
                // first restart the app (model)
                app.restart();
                let interceptors = this.top.interceptors;
                this.processInterceptors(interceptors, async () => {
                    // now awake the UI.
                    if (this.top.ui && this.hasAppElement) {
                        let ui = this.top.ui;
                        let view = this.appElement.top(ui);   // set the top App UI element. Will be (re)started after init
                        this.top.view = view;
                        // todo [OPEN]: restore UI state
                        view.prepareEnveloping();
                        await doAsync();
                        if (!await app.connectUI(view)) {
                            // connect Model and UI
                            let vm = new universe.aurora.ViewModel();
                            this.top.vm = vm;
                            vm.view = view;
                            vm.model = universe.observe(app);
                        };
                        await doAsync();
                        await view.awaken();
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
            } else {
                let interceptor = interceptors.shift();
                this.processInterceptors(interceptors, resume);
            }
        })
    }

    get appreference() {
        return window.location.href;
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
        Object.defineProperty(Dorifer.prototype, 'appElement', {
            configurable: false,
            enumerable  : false,
            value       : app,
        });
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
        // this.restartApp();   // -> this has to be done by API
        return this;
    }

    addWidget(widgetname, segment, widget) {
        this.appregistry.addWidget(this.ctxname, widgetname, segment, widget);
        return this;
    }

    addInterceptor(conditionFn, prerequisiteFn) {
        this.appregistry.addInterceptor(this.ctxname, conditionFn, prerequisiteFn);
        return this;
    }

    requiresUser() {
        if (!universe.thatsmeLogin) throw ErrNotAvailable('thatsme');
        universe.thatsmeLogin(this.ctxname);
        return this;
    }
    restartApp() {
        this.dorifer.restartApp();
        return this;
    }

}
