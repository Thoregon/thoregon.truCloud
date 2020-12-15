/**
 * Thoregon Repository
 * - Only Thoregon system components
 * - public repository -> Ammandul
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
    }

    async init() {
        universe.dorifer = this;
        universe.device  = new Device();
        if (this.hasAppElement) {
            // if a UI exists enable the application URL router
            let urlrouter  = new URLRouter();
            this.urlrouter = urlrouter;
            urlrouter.connect(this.appregistry);
            this.restartApp();
        }
    }

    async cleanup() {

    }

    /*
     * Registry API
     * todo [REFACTOR]: distribute aspects to responsible entities
     */

    addApp(appname, app, ui) {
        this.appregistry.register(appname, app, ui);
        this.urlrouter.updateMapping(this.appregistry);
        // this.restartApp();   // -> this has to be done by API
        return this;
    }

    addWidget(appname, widgetname, segment, widget) {
        this.appregistry.addWidget(appname, widgetname, segment, widget);
        return this;
    }

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
