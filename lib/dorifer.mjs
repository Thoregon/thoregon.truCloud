/**
 * Dorifer provides the runtime environment and access to available components in the universe.
 * The runtime environment also includes the apps and components that are installed on this device.
 * Additional repositories can be made available to use other components as well. Just 'tap' it.
 *
 * two scenarios on start
 * - with UI
 *   - lookup app which is requested
 *   - start thoregon app if nothing referenced
 * - with & o/w UI
 *   - lookup services for this installation/device
 *   - run services
 *
 * Thoregon Repository
 * - Only Thoregon system components
 * - public repository -> Ammandul
 * - other repositories can be added
 *
 * Permissions: Archetim
 *
 * todo [OPEN]:
 *  - introduce state machine to handle the lifecycle
 *
 * todo [$$@REPO]:
 *  - new repo design
 *
 * @author: Bernhard Lukassen
 */

import { EventEmitter }   from "/evolux.pubsub";
import { Reporter }       from "/evolux.supervise";
import Registry           from "./application/registry.mjs";
import URLRouter          from "./application/urlrouter.mjs";
import ThoregonRepository from "./repo/thoregonrepository.mjs";
import MediaThek          from "./unifiedfile/mediathek.mjs";
import MetaClass          from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import AnnotationParser   from "/thoregon.archetim/lib/annotation/annotationparser.mjs";

import ThoregonEntity, { ThoregonObject } from "/thoregon.archetim/lib/thoregonentity.mjs";

import { ErrNoAppElement, ErrNoUI, ErrNotAvailable } from "./errors.mjs";
import { doAsync, timeout }                          from "/evolux.universe";
import { isFunction, isClass }                       from "/evolux.util";
import RepositoryEntry                               from "./repo/repositoryentry.mjs";
import AppStructure                                  from "./application/appstructure.mjs";

const T = universe.T;

const isDev = () => { try { return thoregon.isDev } catch (ignore) { return false } };

const ANNOTATION_PARSER = new AnnotationParser();

export default class Dorifer extends Reporter(EventEmitter) {

    constructor() {
        super();
        this.repositories = [];
        this.appregistry  = new Registry();
        this.contexts     = {};
        this.class2origin = new Map();
        this.origin2class = new Map();
        this.annotations  = {};

        universe.dorifer = this;
        universe.global('dorifer', this);

        // annotations
        const annotations = universe.preAnnotations();
        annotations.forEach((spec) => dorifer.checkinAnnotation(spec, spec.annotation, spec.name));
    }

    async init() {
        thoregon.checkpoint("dorifer: init");

        if (universe.AGENT_NAME) await this.awakeAgent();

        await this.attachRepositories();

        ThoregonObject.doCheckIn();

        if (globalThis.window) {
            // if started via a url in the browser analyze it if an app should be started
            thoregon.checkpoint("dorifer: create URL router");
            let urlrouter  = new URLRouter();
            this.urlrouter = urlrouter;
            urlrouter.prepare();
            thoregon.checkpoint("dorifer: URL router prepared");
        }
        // todo [$$@REPO]
        // if (this.hasAppElement) {
            // await timeout(200);
            // await doAsync();
            // urlrouter.connect(this.appregistry);
            // if a UI exists enable the application URL router
            // await this.restartApp();     // too early -> restart when universe was inflated
        //}

        thoregon.checkpoint("dorifer: mediathek open");
        let mediathek = await MediaThek.open();
        universe.global('mediathek', mediathek);
        thoregon.checkpoint("dorifer: mediathek opened");
    }

    async awakeAgent() {
        try {
            const Agent    = (await import("./agent/agent.mjs")).default;
            universe.Agent = Agent;
            await Agent.awake();
        } catch (e) {
            console.log("can't awake agent", e);
        }
    }

    async attachRepositories() {
        // attach standard repositories
        let repo;
/*
        if (isDev()) {
            this.repositories.push({ name: 'tdev', repo: await ThoregonRepository.tap({ provider: '/thoregon.truCloud/lib/repo/provider/tdevrepository.mjs' }) });
        }
        this.repositories.push({ name: 'THOREGON', repo: await ThoregonRepository.tap({ provider: '/thoregon.truCloud/lib/repo/provider/ammandul.mjs' }) });
*/
        // attach users repositories
        // get registered repos in SSI and tap it
    }

    async cleanup() {

    }

    /*
     * directory & repository API
     * todo:
     *  - [OPEN] add repo
     *  - [OPEN] enable the user to replace modules with a mapping; this mapping is persistent and can be shared between all devices; a device can then also override the mapping
     */

    /**
     * register a class to be used for persistent objects
     *
     * @param {String} origin    /repo/componentOrContext/pathToModuleWithVersion  or a CID of the module
     * @param {Class|Function} cls
     * @param {Object} metaClass
     */
    checkinClass(origin, cls, metaClass) {
        const url = new URL(origin);
        let ref;
        if (thoregon.loader) {
            let root = thoregon.loader.findRoot(url.pathname);
            ref = (root) ? 'repo:' + root + ':' + cls.name: 'repo:' + url.pathname + ':' + cls.name;
        } else {
            ref = 'repo:' + url.pathname + ':' + cls.name;
        }
        if (!metaClass) metaClass = new MetaClass();
        if (!metaClass.cls) metaClass.cls = cls;
        this.class2origin.set(cls, { repo: ref, metaClass });
        this.origin2class.set(ref, { class: cls, metaClass });
        // now analyse annotations
        (async () => {
            const annotations = await ANNOTATION_PARSER.analyze(cls, metaClass, origin);
        })();
    }

    checkinAnnotation({ url:origin } = {}, annotation, name) {
        name = name ?? annotation.name;
        if (!name) {
            console.log("Annotation has no name", annotation);
            return;
        }
        if (!isClass(annotation) && !isFunction(annotation)) {
            console.log("Annotation not a class or function", name, annotation);
            return;
        }
        // todo [OPEN]: adjust import for annotations with same name
        // let ref;
        // const url = new URL(origin);
        // if (thoregon.loader) {
        //     let root = thoregon.loader.findRoot(url.pathname);
        //     ref = (root) ? root + ':' + name: 'repo:' + url.pathname + ':' + name;
        // } else {
        //     ref = url.pathname + ':' + name;
        // }
        // this.annotations[ref] = annotation;
        this.annotations[name] = annotation;

        this.checkinClass(origin, annotation);
    }

    getAnnotation(name, origin) {
        return this.annotations[name];
    }

    origin4cls(cls) {
        return this.class2origin.get(cls);
    }

    cls4origin(origin) {
        return this.origin2class.get(origin)?.class;
    }

    clsAnnotations(cls) {
        return this.class2origin.get(cls)?.metaClass?.getClassAnnotations();
    }

    lookupCls4origin(orgin) {
        // todo:
        //  - if not cached already get it from the specified repository
        //  - what if the user did not 'tap' the repo? load anyways?
    }

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
     * @param [device]
     */
    tap(repo, device) {
        // get the repo
        // get the SSI
        // add the repo to the used (tapped) device repositories if device is defined
        // otherwise add to SSI tapped repos
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

    get appname() {
        return this.urlrouter?.appid;
    }

    async findMatchingApp(appname) {
        if (!appname) return {};
        let ctx = this.contexts[appname];
        if (ctx) return ctx.appregistry.apps[appname].app;

        await this.findInRepo(appname);

        ctx = this.contexts[appname];
        return (ctx) ? { appname, instance: ctx.appregistry.apps[appname] } : { appname: undefined, instance: undefined };
    }

    // todo [OPEN]: support versions
    async findInRepo(appname) {
        try {
            thoregon.checkpoint("dorifer: find app 1");
            const href = `/${appname}`;
            let module = await fetch(href);
            thoregon.checkpoint("dorifer: find app 2 fetched");
            let entry  = new RepositoryEntry();
            // the default export must be a function
            // it should register in Dorifer and return the App Class
            entry.name = appname;
            entry.type = 'app';
            entry.href = href;
            // entry.module = module;
            if (!entry) return;
            const struct = await AppStructure.from(entry.name, entry.href);
            thoregon.checkpoint("dorifer: find app 3 app structure built");
            return struct;
        } catch (e) {
            // todo [OPEN]: check first if the resource is available, if so and the import fails there must be a JS error (Syntax, Reference, ...)
            console.log('Dev Repo', e);
        }
/*
        if (!ref) return;
        for await ( let { repo } of this.repositories) {
            let entry = await repo.componentLookup(ref);
            if (entry) return entry;
        }
*/
    }

    async restartApp(appcontext) {
        thoregon.checkpoint("dorifer: restart app");
        if (!this.top) {
            let { appname, instance } = await this.findMatchingApp(this.appname);

/* $$@REPO
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
*/
            if (!instance) {
                thoregon.checkpoint("dorifer: no app found");
                // todo [OPEN]: start default app -> thatsme
            }
            this.top = instance;
            if (this.top) {
                thoregon.checkpoint("dorifer: app found");
                if (!instance.name) instance.name = appname;
                let app = this.top.app;
                if (!app.name) app.name = appname;
                // first restart the app (model)
                await app.prepare();
                thoregon.checkpoint("dorifer: app prepared");
                let interceptors = this.top.interceptors ?? [];
                interceptors = [...interceptors, ...app.interceptors];
                this.processInterceptors(interceptors, async () => {
                    thoregon.checkpoint("dorifer: interceptors processed");
                    // if in dev mode, check if testdata available
                    // now awake the UI.
                    await app.restart();
                    thoregon.checkpoint("dorifer: app restarted");
                    if (app.restore) await app.restore();
                    thoregon.checkpoint("dorifer: app restored");
                    if (this.top.ui && this.hasAppElement) {
                        let uirouter         = universe.uirouter;
                        this.uirouter        = uirouter;
                        uirouter.app         = app;
                        uirouter.urlrouter   = this.urlrouter;
                        uirouter.applyInterfaceSettings(app);
                        let ui               = this.top.ui;
                        let view             = this.appElement.top(ui);   // set the top App UI element. Will be (re)started after init
                        uirouter.appelement  = view;
                        view.app             = app;
                        view.appname         = appname;
                        this.top.view = view;
                        await view.untilExist();
                        // todo [OPEN]: restore UI state
                        view.prepareEnveloping();

                        thoregon.checkpoint("dorifer: view prepared");
                        await doAsync();
                        if (!await app.connectUI(view)) {
                            // connect Model and UI#
                            thoregon.checkpoint("dorifer: default connect UI");
                            let vm      = universe.aurora.ViewModel();
                            this.top.vm = vm;
                            vm.view     = view;
                            vm.model    = universe.observe(app);
                        };
                        thoregon.checkpoint("dorifer: UI connected");
                        await doAsync();
                        await view.awaken();
                        uirouter.restore();
                        thoregon.checkpoint("dorifer: app started");
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

    seal() {
        // todo [OPEN]: component is loaded and initialized, avoid overriding for security
    }

    addApp(app, ui) {
        this.appregistry.register(this.ctxname, app, ui);
        // todo [$$@REPO]: this.dorifer.urlrouter.updateMapping(this.appregistry);
        if (!this.app) this.app = app;  // first app as default app
        if (!this.ui)  this.ui  = ui;   // first ui as default ui
        return this;
    }

    addAppDefault(app, ui) {
        this.appregistry.registerDefault(this.ctxname, app, ui);
        // todo [$$@REPO]: this.dorifer.urlrouter.updateMapping(this.appregistry);
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
        // me._$_addQuery(this.ctxname, name, query);
        return this;
    }

    addTempGalaxies(galaxies) {
        // me._$_addTempGalaxies(this.ctxname, galaxies);
    }

    getQuery(name) {
        return this.appregistry.getQuery(this.ctxname, name);
    }

    addEntitySchema(clazz, schema) {
        schema.impl = clazz;
        this.appregistry.addEntitySchema(this.ctxname, schema.name, schema, clazz);  // todo [OPEN]: specify schema uri and version
        return this;
    }

    getEntitySchema(name) {
        let entry = this.appregistry.getEntry(this.ctxname);
        return entry.schemas ? entry.schemas[name] : undefined;
    }

    addCommand(name, commandcls) {
        this.appregistry.addCommand(this.ctxname, name, commandcls);
        return this;
    }

    getCommand(name) {
        return this.appregistry.getCommand(this.ctxname, name);
    }

    withUI(path) {
        this.appregistry.withUI(this.ctxname, path);
        return this;
    }

    withI18N(translation) {
        this.appregistry.withI18N(this.ctxname, translation);
        return this;
    }

    getI18N() {
        return this.appregistry.getI18N(this.ctxname);
    }

    withAssets(path) {
        this.appregistry.withAssets(this.ctxname, path);
        return this;
    }

    withStructure(stucture) {
        this.appregistry.withStructure(this.ctxname, stucture);
        return this;
    }

    withInterface(intface) {
        this.appregistry.withInterface(this.ctxname, intface);
        return this;
    }

    withExports(exports) {
        this.appregistry.withExports(this.ctxname, exports);
        return this;
    }

    getInterface() {
        return this.appregistry.getInterface(this.ctxname);
    }

    getStructure() {
        return this.appregistry.getStructure(this.ctxname);
    }

    requiresUser() {
        if (!universe.thatsmeLogin) throw ErrNotAvailable('thatsme');
        universe.thatsmeLogin(this.ctxname);
        return this;
    }

}
