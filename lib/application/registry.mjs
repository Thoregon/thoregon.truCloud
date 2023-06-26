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

    registerDefault(name, app, ui) {
        try {
            this.apps[name] = { app, ui };
            this.emit('registered', { name, app, ui });
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

    getEntry(ctxname) {
        return this.apps[ctxname];
    }

    getAppInstances(ctxname) {
        let regentry = this.apps[ctxname];
        if (!regentry) return;      // todo:
        if (!regentry.app) {
            // create instances if missing
            let App = regentry.appCls;
            let UI = regentry.uiCls;
            regentry.app = new App();
            if (UI && !regentry.ui) {
                regentry.ui = UI;
                // regentry.route = UI.route;
            }
        }
        return regentry;
    }

    getWidgetInstances(regentry, widgetname) {
        if (!regentry.widgets || !regentry.widgets[widgetname]) return null;
        let widgetentry = regentry.widgets[widgetname];
            // create instances if missing
        let Segment = widgetentry.segment;
        widgetentry.app = new Segment();
        return widgetentry;
    }

    forRoute(route) {
        let parts = route.split('/');
        let ctxname = parts.shift();
        if (!ctxname) ctxname = parts.shift();  // skip leading '/'
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        if (parts.length === 0) return this.getAppInstances(ctxname);
        // now it can be a widget or a subcomponent
        let name = parts.shift();
        let widgetentry = this.getWidgetInstances(regentry, name);
        if (widgetentry) return widgetentry;
        // todo [OPEN]: other components
        return null;
    }

    /**
     * register a widget with its app segment for an app
     *
     * @param {String}      ctxname
     * @param {String}      widgetname
     * @param {AppSegment}  segment
     * @param {AppWidget}   widget
     */
    addWidget(ctxname, widgetname, segment, widget) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        let widgets = regentry.widgets;
        if (!widgets) {
            widgets = {};
            regentry.widgets = widgets;
        }
        widgets[widgetname] = { segment, widget/*, route: widget.route*/ };
        return this;
    }

    /**
     * register a widget with its app segment for an app
     *
     * @param {String}      ctxname
     * @param {String}      domain
     */
    addDomain(ctxname, domain) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        let domains = regentry.domains;
        if (!domains) {
            domains = [];
            regentry.domains = domains;
        }
        domains.push(domain);
        return this;
    }

    addInterceptor(ctxname, conditinFn, prerequisiteFn) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        let interceptors = regentry.interceptors;
        if (!interceptors) {
            interceptors = [];
            regentry.interceptors = interceptors;
        }
        let interceptor = new Interceptor()
                                .withCondition(conditinFn)
                                .prerequisiteHandler(prerequisiteFn);
        interceptors.push(interceptor);
    }

    addQuery(ctxname, name, resolver) {
        let entry = this.apps[ctxname];
        if (!entry) {
            entry = { queries: {}, appCls: null, uiCls: null, app: null, ui: null, uiroot: null };
            this.apps[name] = entry;
        }
        let queries = entry.queries;
        if (!queries) {
            queries = {};
            entry.queries = queries;
        }
        queries[name] =  resolver;
        return this;
    }

    addCommand(ctxname, name, commandcls) {
        let entry = this.apps[ctxname];
        if (!entry) {
            entry = { commands: {}, appCls: null, uiCls: null, app: null, ui: null, uiroot: null };
            this.apps[name] = entry;
        }
        let commands = entry.commands;
        if (!commands) {
            commands = {};
            entry.commands = commands;
        }
        commands[name] =  commandcls;
        return this;
    }

    getQuery(ctxname, name) {
        let entry = this.apps[ctxname];
        if (!entry || !entry.queries) return;
        let resolver = entry.queries[name];
        if (!resolver) return;
        return; // Query.at(resolver);
    }

    getCommand(ctxname, name) {
        let entry = this.apps[ctxname];
        if (!entry || !entry.commands) return;
        let command = entry.commands[name];
        return command;
    }

    getStructure(ctxname) {
        let entry = this.apps[ctxname];
        if (!entry) return;
        return entry.structure;
    }

    getStructure(ctxname) {
        let entry = this.apps[ctxname];
        if (!entry) return;
        return entry.structure;
    }

    getDescriptor(ctxname) {
        let entry = this.apps[ctxname];
        if (!entry || !entry.structure) return;
        return entry.structure.descriptor;
    }

    addEntitySchema(ctxname, name, schema) {
        let entry = this.apps[ctxname];
        if (!entry) {
            entry = { schemas: {}, appCls: null, uiCls: null, app: null, ui: null, uiroot: null };
            this.apps[ctxname] = entry;
        }
        let schemas = entry.schemas;
        if (!schemas) {
            schemas = {};
            entry.schemas = schemas;
        }
        schemas[name] = schema;
        return this;
    }

    withStore(ctxname, storepath) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        regentry.store = storepath;
    }

    withUI(ctxname, uipath) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        if (regentry.uiCls) regentry.uiCls.uiComponentRoot = uipath;
        regentry.uipath = uipath;
    }

    withI18N(ctxname, translation) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        regentry.translation = translation;
    }

    getI18N(ctxname) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        return regentry.translation;
    }

    withAssets(ctxname, assetspath) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        regentry.assetspath = assetspath;
    }

    withStructure(ctxname, stucture) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        regentry.stucture = stucture;
    }

    withInterface(ctxname, intface) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        regentry.interface = intface;
    }

    withExports(ctxname, exports) {
        let regentry = this.apps[ctxname];
        if (!regentry) throw ErrAppUnknown(ctxname);
        regentry.exports = exports;
    }

    getInterface(ctxname) {
        let regentry = this.apps[ctxname];
        return regentry ? regentry.interface : undefined;
    }

    names() {
        return Reflect.ownKeys(this.apps);
    }

    /*
     * app state management
     * todo: [OPEN]: manage app states for user and devices.
     */

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
