/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ThoregonEntity     from "/thoregon.archetim/lib/thoregonentity.mjs";
import MetaClass          from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import { ATTRIBUTE_MODE } from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import Directory          from "/thoregon.archetim/lib/directory.mjs";

export class AppInstanceMeta extends MetaClass {

    initiateInstance() {
        this.name = "AppInstance";
        this.attributeMode = ATTRIBUTE_MODE.VARENCRYPT;     // can

        this.text('appid');
        this.text('id');

        this.object('home',        null,      { persistent: false, derived: true, description: 'API for this app' });
        this.collection('root',         Directory, { autocomplete: true, autoinit: true, description: 'app data root' });
        this.collection('extendedroot', Directory, { agent: true, autocomplete: true, autoinit: true, description: 'extended app data root, manly for Service Agents' });
        this.collection("services",     Directory, { autocomplete: true, autoinit: true, description: 'services for the app' });
        this.collection('channels',       Directory, { /*agent: true,*/ autocomplete: true, autoinit: true, description: 'app channels, manly for Service Agents' });
    }

}

const DBGID = '++ AppInstance';

export default class AppInstance extends ThoregonEntity() {

    static forApp(app, opt) {
        const appid = app.id;
        const id = opt?.id ?? universe.random(5);
        universe.debuglog(DBGID, "NEW for app", app.id, id);
        const instance = this.create({ id, appid, opt });
        instance._app = app;
/*
        instance.appid = app.id;
        instance.id = id;
        instance.opt = opt;
*/
        return instance;
    }

    restart() {
        // just 'touch' basic directories to accelerate sync
        // todo: use metaclass attribute descriptors
        this.root;
        this.services;
        this.channels;
    }

    get qualifier() {
        return `${this.appid}:${this.id}`;
    }

    // todo [OPEN]:
    //  - introduce structure of the app storeage
    //  - define each path needed for the app
    //  - will be available as short code e.g. app.current.myfriends
    //  - can also contain Queries (Views)
    //  - use as reference in UI

    get home() {
        if (!this._home) {
            const Home = this._app?.homeConstructor ?? globalThis.app?.homeConstructor;
            if (Home) {
                const home = new Home(this);
                this._home = home;
            }
        }
        return this._home;
    }

    set home(home) {
        if (home) this._home = home;
    }

    hasHome() {
        return !! this._home;
    }

    useHome(Home) {
        if (!Home || this._home) return;
        const home = new Home(this);
        this._home = home;
    }

    get element() {
        return universe.uirouter.appelement;
    }
}

AppInstance.checkIn(import.meta, AppInstanceMeta);
