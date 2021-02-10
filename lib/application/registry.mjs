/*
 * Runtime Registry for Apps
 *
 * registers apps (classes) by their name
 * apps must extend ThoregonApplication
 *
 * todo [OPEN]: uniqueness required! add universe address to the app name
 *
 * @author: Martin Neitz, Bernhard Lukassen
 */

import { EventEmitter }  from "/evolux.pubsub";
import { Reporter }      from "/evolux.supervise";
import AppState          from "./appstate.mjs";
import Interceptor       from "./interceptor.mjs";
import { ErrAppUnknown } from "../errors.mjs";

export default class Registry extends Reporter(EventEmitter) {

    constructor(props) {
        super();
        this.apps = {};     // named app register
    }

    register(name, App, UI) {
        try {
            this.apps[name] = { appCls: App, uiCls: UI, app: null, ui: null, uiroot: null };
            this.emit('registered', { name, App, UI });
        } catch (e) {
            this.logger.error('Register App', e);
        }
        return this;
    }

    unregister(name) {
        let app = this.apps[name];
        try {
            app.ui.sleep();
        } catch (e) {
            this.logger.error('Unregister App UI', e);
        }
        try {
            app.instance.shutdown();
        } catch (e) {
            this.logger.error('Unregister App', e);
        }
        // remove it anyways, also in case of an error
        delete this.apps[name];
        this.emit('unregistered', { app });
    }

    getAppInstances(appname) {
        let appentry = this.apps[appname];
        if (!appentry) return;      // todo:
        if (!appentry.app) {
            // create instances if missing
            let App = appentry.appCls;
            let UI = appentry.uiCls;
            appentry.app = new App();
            if (UI) {
                appentry.ui = UI;
                // appentry.route = UI.route;
            }
        }
        return appentry;
    }

    getWidgetInstances(appentry, widgetname) {
        if (!appentry.widgets || !appentry.widgets[widgetname]) return null;
        let widgetentry = appentry.widgets[widgetname];
            // create instances if missing
        let Segment = widgetentry.segment;
        widgetentry.app = new Segment();
        return widgetentry;
    }

    forRoute(route) {
        let parts = route.split('/');
        let appname = parts.shift();
        if (!appname) appname = parts.shift();  // skip leading '/'
        let appentry = this.apps[appname];
        if (!appentry) throw ErrAppUnknown(appname);
        if (parts.length === 0) return this.getAppInstances(appname);
        // now it can be a widget or a subcomponent
        let name = parts.shift();
        let widgetentry = this.getWidgetInstances(appentry, name);
        if (widgetentry) return widgetentry;
        // todo [OPEN]: other components
        return null;
    }

    /**
     * register a widget with its app segment for an app
     *
     * @param {String}      appname
     * @param {String}      widgetname
     * @param {AppSegment}  segment
     * @param {AppWidget}   widget
     */
    addWidget(appname, widgetname, segment, widget) {
        let appentry = this.apps[appname];
        if (!appentry) throw ErrAppUnknown(appname);
        let widgets = appentry.widgets;
        if (!widgets) {
            widgets = {};
            appentry.widgets = widgets;
        }
        widgets[widgetname] = { segment, widget/*, route: widget.route*/ };
        return this;
    }

    addInterceptor(appname, conditinFn, prerequisiteFn) {
        let appentry = this.apps[appname];
        if (!appentry) throw ErrAppUnknown(appname);
        let interceptors = appentry.interceptors;
        if (!interceptors) {
            interceptors = [];
            appentry.interceptors = interceptors;
        }
        let interceptor = new Interceptor()
                                .withCondition(conditinFn)
                                .prerequisiteHandler(prerequisiteFn);
        interceptors.push(interceptor);
    }

    withStore(appname, storepath) {
        let appentry = this.apps[appname];
        if (!appentry) throw ErrAppUnknown(appname);
        appentry.store = storepath;
    }

    withUI(appname, uipath) {
        let appentry = this.apps[appname];
        if (!appentry) throw ErrAppUnknown(appname);
        if (appentry.uiCls) appentry.uiCls.uiComponentRoot = uipath;
        appentry.uipath = uipath;
    }

    names() {
        return Object.keys(this.apps);
    }

    /*
     * app state management
     * todo: [OPEN]: manage app states for user and devices. store in universe.matter
     */

    /**
     * gets the app state object (handle) for an application
     * the application can use the handle to update its state
     *
     * todo [OPEN]: implement
     *
     * @param {String} appname
     * @param {Address} device - address of a device
     */
    appStateHandleFor(appname, device) {
        return new AppState();
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
