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

export default class Dorifer extends Reporter(EventEmitter) {

    constructor() {
        super();
        this.appregistry = new Registry();
    }

    async init() {
        universe.truCloud = this;
        if (thoregon.ui) {
            // if a UI exists enable the application URL router
            let urlrouter  = new URLRouter();
            this.urlrouter = urlrouter;
            urlrouter.connect(this.appregistry);
            this.app = urlrouter.matchingApp(window.location.href);
            // todo: get app state
            if (this.app) this.app.restart();
        }
    }

    async cleanup() {

    }

    /*
     * Registry API
     * todo [REFACTOR]: distribute aspects to responsible entities
     */

    addApp(appname, app) {
        this.appregistry.register(appname, app);
        this.urlrouter.updateMapping(this.appregistry);
        if (!this.app) {
            this.app = this.urlrouter.matchingApp(window.location.href);
            if (this.app) this.app.restart();
        }
    }

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
