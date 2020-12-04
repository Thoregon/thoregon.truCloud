/*
 * Registry for Apps
 *
 * registers apps (classes) by their name
 * apps must extend ThoregonApplication
 *
 * @author: Martin Neitz, Bernhard Lukassen
 */

import {EventEmitter} from "/evolux.pubsub";
import {Reporter}     from "/evolux.supervise";

export default class Registry extends Reporter(EventEmitter) {

    constructor(props) {
        super();
        this.apps = {};     // named app register
    }

    register(name, App) {
        try {
            let app = new App();        // todo [REFACTOR]: lazy init, instantate at first use. 'onRegister' must be changed
            app.onRegister();
            this.apps[name] = app;
            this.emit('registered', { app });
        } catch (e) {
            this.logger.error('Register App', e);
        }
    }

    unregister(name) {
        try {
            let app = this.apps[name];
            app.onUnregister();
        } catch (e) {
            this.logger.error('Unregister App', e);
        }
        // remove it anyways
        delete this.apps[name];
        this.emit('unregistered', { app });
    }

    get(appname) {
        return this.apps[appname];
    }

    names() {
        return Object.keys(this.apps);
    }

    /*
     * EventEmitter implementation
     */

    get publishes() {
        return {
            ready       : 'AppRegistry ready',
            exit        : 'AppRegistry exit',
            registered  : 'App has been registered',
            unregistered: 'App has been unregistered',
        };
    }
}
