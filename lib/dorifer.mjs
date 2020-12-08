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

import { EventEmitter } from "/evolux.pubsub";
import { Reporter }     from "/evolux.supervise";

import Registry         from "./application/registry.mjs";
import URLRouter        from "./application/urlrouter.mjs";

import { ErrNoAppElement, ErrNoUI } from "./errors.mjs";

export default class Dorifer extends Reporter(EventEmitter) {

    constructor() {
        super();
        this.appregistry = new Registry();
    }

    async init() {
        universe.truCloud = this;
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
        this.restartApp();
    }

    restartApp() {
        if (!this.top) {
            this.top = this.urlrouter.matchingApp(this.appreference);
            if (this.top) {
                if (this.top.ui && this.hasAppElement) {
                    let ui = this.top.ui;
                    let me = document.createElement(ui.elementTag);
                    this.appElement.appendChild(me);
                    /*
                                        ui.prepareEnveloping(this.appElement);
                                        ui.awaken();
                    */
                }   // if peer has a UI
                this.top.app.restart();
                // todo [OPEN]: connect Model and UI (ViewModel)
            }
        }
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
